import Document from '../models/document.js';
import DocumentChunk from '../models/documentChunk.js';
import EmbeddingStore from '../models/embeddingStore.js';
import { uploadDocument as uploadToR2 } from './cloudflareR2.js';
import aiService from './aiService.js';
import mongoose from 'mongoose';

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSourceCandidates = (fileName, aiFilename = null) => {
  const raw = [aiFilename, fileName]
    .map((x) => String(x || '').trim())
    .filter(Boolean);

  const withStems = raw.flatMap((name) => {
    const stem = name.includes('.') ? name.split('.').slice(0, -1).join('.') : '';
    return stem && stem !== name ? [name, stem] : [name];
  });

  return Array.from(new Set(withStems));
};

const buildChunkQuery = ({ sourceCandidates, institutionId, courseId }) => {
  const sourceClauses = sourceCandidates.flatMap((name) => {
    const safe = escapeRegex(name);
    return [
      { 'metadata.source': { $regex: `^${safe}$`, $options: 'i' } },
      { 'metadata.fileName': { $regex: `^${safe}$`, $options: 'i' } },
      { 'metadata.filename': { $regex: `^${safe}$`, $options: 'i' } },
    ];
  });

  return {
    $and: [
      { $or: sourceClauses },
      { 'metadata.institution_id': String(institutionId) },
      { 'metadata.course_id': String(courseId) },
    ],
  };
};

/**
 * Complete document upload and processing workflow
 * 1. Upload file to Cloudflare R2
 * 2. Send to AI server for processing (chunks + embeddings)
 * 3. Save chunks and embeddings to MongoDB
 * 4. Create Document record
 */
export async function processAndStoreDocument(fileBuffer, fileName, fileInfo) {
  const {
    institutionId,
    courseId,
    uploadedBy,
    fileType,
    fileSize
  } = fileInfo;

  let document = null;

  try {
    console.log(`[Document Service] Processing ${fileName}...`);

    // Step 1: Upload to Cloudflare R2
    console.log('[Document Service] Uploading to R2...');
    const r2Url = await uploadToR2(
      fileBuffer,
      fileName,
      `application/${fileType}`
    );
    console.log(`[Document Service] R2 upload complete: ${r2Url}`);

    // Step 2: Send to AI server for processing
    console.log('[Document Service] Sending to AI server for processing...');
    const aiResponse = await aiService.uploadDocument(
      fileBuffer,
      fileName,
      institutionId,
      courseId
    );
    console.log(`[Document Service] AI processing complete: ${aiResponse.chunks_added} chunks`);

    // Step 3: Validate chunks directly from Mongo proxy collections.
    console.log('[Document Service] Verifying chunks in Mongo proxy collections...');
    const db = mongoose.connection.db;
    const chunksCollection = db.collection('documentchunks');
    const embeddingsCollection = db.collection('embeddingstores');

    const sourceCandidates = buildSourceCandidates(fileName, aiResponse?.filename);
    const chunkQuery = buildChunkQuery({ sourceCandidates, institutionId, courseId });
    const chunkRows = await chunksCollection
      .find(chunkQuery, { projection: { chunk_id: 1, metadata: 1 } })
      .sort({ 'metadata.chunk_index': 1 })
      .toArray();

    if (!chunkRows.length) {
      throw new Error(`No chunks available in AI store for document names: ${sourceCandidates.join(', ')}`);
    }

    const chunkIds = Array.from(new Set(
      chunkRows
        .map((row) => String(row?.chunk_id || '').trim())
        .filter(Boolean)
    ));

    // Step 4: Create Document record
    console.log('[Document Service] Creating Document record...');
    document = new Document({
      fileName: fileName,
      originalName: fileName,
      fileUrl: r2Url,
      fileType: fileType,
      fileSize: fileSize,
      institution: new mongoose.Types.ObjectId(institutionId),
      course: new mongoose.Types.ObjectId(courseId),
      uploadedBy: new mongoose.Types.ObjectId(uploadedBy),
      isProcessed: true,
      chunksCount: chunkRows.length
    });
    await document.save();
    console.log(`[Document Service] Document record created: ${document._id}`);

    // Step 5: Link proxy rows to this document for cleanup/debugging.
    await chunksCollection.updateMany(
      { chunk_id: { $in: chunkIds } },
      {
        $set: {
          'metadata.document_id': String(document._id),
          'metadata.fileName': fileName,
          'metadata.fileType': fileType,
          'metadata.uploadedBy': String(uploadedBy),
        },
      }
    );

    if (chunkIds.length) {
      await embeddingsCollection.updateMany(
        { chunk_id: { $in: chunkIds } },
        {
          $set: {
            'metadata.document_id': String(document._id),
            'metadata.fileName': fileName,
            'metadata.fileType': fileType,
          },
        }
      );
    }

    const verifiedChunkCount = chunkRows.length;
    const verifiedEmbeddingCount = chunkIds.length
      ? await embeddingsCollection.countDocuments({ chunk_id: { $in: chunkIds } })
      : 0;

    if (verifiedChunkCount === 0) {
      throw new Error('Chunk persistence verification failed: no DocumentChunk rows found');
    }

    console.log('[Document Service] ✅ Complete pipeline finished successfully');

    return {
      success: true,
      document: document,
      chunksCount: verifiedChunkCount,
      embeddingsCount: verifiedEmbeddingCount,
      r2Url: r2Url,
      message: `Successfully processed ${fileName}: ${verifiedChunkCount} chunks created`
    };

  } catch (error) {
    console.error('[Document Service] ❌ Error:', error);
    
    // If Document was created but processing failed, mark it as failed
    if (document?._id) {
      await Document.findByIdAndUpdate(document._id, {
        isProcessed: false,
        processingError: error.message
      });
    }
    
    throw error;
  }
}

/**
 * Get all chunks for a document
 */
export async function getDocumentChunks(documentId) {
  const chunks = await DocumentChunk.find({ document: documentId })
    .sort({ chunkIndex: 1 });
  return chunks;
}

/**
 * Search embeddings by similarity (requires vector search setup)
 */
export async function searchSimilarChunks(queryEmbedding, filters = {}, limit = 5) {
  // This would need vector similarity search
  // For now, return filtered chunks
  const query = {};
  if (filters.institution_id) {
    query['metadata.institution_id'] = new mongoose.Types.ObjectId(filters.institution_id);
  }
  if (filters.course_id) {
    query['metadata.course_id'] = new mongoose.Types.ObjectId(filters.course_id);
  }

  const chunks = await EmbeddingStore.find(query)
    .limit(limit)
    .populate('documentId', 'fileName fileType')
    .sort({ createdAt: -1 });

  return chunks;
}

export default {
  processAndStoreDocument,
  getDocumentChunks,
  searchSimilarChunks
};
