import Document from '../models/document.js';
import DocumentChunk from '../models/documentChunk.js';
import EmbeddingStore from '../models/embeddingStore.js';
import { uploadDocument as uploadToR2 } from './cloudflareR2.js';
import aiService from './aiService.js';
import mongoose from 'mongoose';

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

    // Step 3: Get detailed chunks and embeddings from AI server
    console.log('[Document Service] Fetching chunks and embeddings from AI server...');
    const candidateNames = [
      aiResponse?.filename,
      fileName,
      fileName.includes('.') ? fileName.split('.').slice(0, -1).join('.') : null,
    ].filter((n, idx, arr) => n && arr.indexOf(n) === idx);

    let chunksData = null;
    for (const candidate of candidateNames) {
      try {
        const result = await aiService.getDocumentChunksWithRetry(candidate, 5, 1200);
        if (Array.isArray(result?.chunks) && result.chunks.length > 0) {
          chunksData = result;
          break;
        }
      } catch (_) {
        // Try next candidate
      }
    }
    
    if (!chunksData || !chunksData.chunks) {
      throw new Error('Failed to retrieve chunks from AI server');
    }

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
      chunksCount: chunksData.chunks.length
    });
    await document.save();
    console.log(`[Document Service] Document record created: ${document._id}`);

    // Step 5: Save chunks to MongoDB
    console.log('[Document Service] Saving chunks to MongoDB...');
    const chunkDocuments = [];
    for (let i = 0; i < chunksData.chunks.length; i++) {
      const chunk = chunksData.chunks[i];
      const chunkDoc = new DocumentChunk({
        text: chunk.text,
        chunkIndex: i,
        document: document._id,
        embedding: chunk.embedding,
        embeddingModel: chunksData.embedding_model || 'paraphrase-MiniLM-L3-v2',
        metadata: {
          institution_id: institutionId,
          course_id: courseId,
          fileName: fileName,
          fileType: fileType,
          uploadedBy: uploadedBy
        }
      });
      chunkDocuments.push(chunkDoc);
    }
    await DocumentChunk.insertMany(chunkDocuments);
    console.log(`[Document Service] ${chunkDocuments.length} chunks saved to MongoDB`);

    // Step 6: Save embeddings to EmbeddingStore
    console.log('[Document Service] Saving embeddings to EmbeddingStore...');
    const embeddingDocuments = [];
    for (let i = 0; i < chunkDocuments.length; i++) {
      const chunkDoc = chunkDocuments[i];
      const embeddingDoc = new EmbeddingStore({
        documentId: document._id,
        chunkId: chunkDoc._id,
        text: chunkDoc.text,
        embedding: chunkDoc.embedding,
        embeddingDimension: chunkDoc.embedding.length,
        embeddingModel: chunkDoc.embeddingModel,
        metadata: {
          institution_id: new mongoose.Types.ObjectId(institutionId),
          course_id: new mongoose.Types.ObjectId(courseId),
          fileName: fileName,
          fileType: fileType,
          chunkIndex: i
        }
      });
      embeddingDocuments.push(embeddingDoc);
    }
    await EmbeddingStore.insertMany(embeddingDocuments);
    console.log(`[Document Service] ${embeddingDocuments.length} embeddings saved to EmbeddingStore`);

    const verifiedChunkCount = await DocumentChunk.countDocuments({ document: document._id });
    const verifiedEmbeddingCount = await EmbeddingStore.countDocuments({ documentId: document._id });

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
