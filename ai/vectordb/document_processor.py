"""
Document processing and chunking — semantic, structure-aware pipeline.

Improvements over the old version
──────────────────────────────────
• PDF extracted page-by-page via PyMuPDF (fitz) → pdfplumber fallback
  – Tracks page numbers per chunk for precise citations
  – Auto-detects & removes repeated headers/footers (noise lines appearing
    on ≥40 % of pages)
  – Fixes hyphenated line-breaks (word-\nbreak → wordbreak)
• Three-level chunking hierarchy:
    1. Detect section headings → each section stays together where possible
    2. Split into paragraphs (double-newline / blank line)
    3. Split paragraphs into sentences (abbreviation-aware regex)
  Sentences are then accumulated into target-size chunks so a chunk never
  cuts in the middle of a sentence.
• Chunk overlap carried as actual character text (not word count) so the
  embedding always sees a coherent intro from the previous chunk.
• Minimum chunk size filter (100 chars) — avoids storing page numbers,
  lone headers, or empty fragments.
• Metadata per chunk now includes:  page_start, page_end, section_title,
  char_count, chunk_index, total_chunks, source, file_type, institution_id,
  course_id (passed in by caller).
"""

import re
from pathlib import Path
from typing import List, Dict, Tuple, Optional

from config import CHUNK_SIZE, CHUNK_OVERLAP

# ──────────────────────────────────────────────────────────────────────────────
#  Data class
# ──────────────────────────────────────────────────────────────────────────────

class DocumentChunk:
    def __init__(self, text: str, metadata: Dict, chunk_id: int):
        self.text = text
        self.metadata = metadata
        self.chunk_id = chunk_id


# ──────────────────────────────────────────────────────────────────────────────
#  Low-level text utilities
# ──────────────────────────────────────────────────────────────────────────────

# Sentence boundary — fixed-width lookbehind only (Python re requires this).
# Abbreviation detection is done as a post-processing pass in _split_sentences.
_SENT_SPLIT_RE = re.compile(r'(?<=[.!?])\s+(?=[A-Z0-9"])')

# Abbreviations whose trailing period is NOT a sentence terminator.
_ABBREVS = frozenset({
    'dr', 'mr', 'mrs', 'ms', 'prof', 'sr', 'jr', 'rev', 'gen', 'sgt',
    'cpl', 'pvt', 'lt', 'capt', 'cmdr', 'adm',
    'etc', 'fig', 'vs', 'ie', 'eg', 'eq', 'no', 'ref', 'approx',
    'cf', 'et', 'vol', 'ed', 'pp', 'ch', 'sec', 'dept', 'univ',
    'est', 'govt', 'corp', 'inc', 'ltd', 'co', 'eng', 'tech', 'lab',
    'exp', 'max', 'min', 'avg', 'std', 'def', 'prop', 'thm', 'cor',
    'lem', 'ex', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul',
    'aug', 'sep', 'oct', 'nov', 'dec', 'mon', 'tue', 'wed', 'thu',
    'fri', 'sat', 'sun',
})

# Unicode ligatures that PDFs sometimes embed
_LIGATURES = str.maketrans({
    "\uFB00": "ff", "\uFB01": "fi", "\uFB02": "fl",
    "\uFB03": "ffi", "\uFB04": "ffl", "\uFB05": "st", "\uFB06": "st",
    "\u2019": "'",  "\u2018": "'",  "\u201C": '"',  "\u201D": '"',
    "\u2013": "-",  "\u2014": " - ", "\u2022": "*",  "\u00A0": " ",
})

# Detect a question sentence (ends with ? or starts with question words)
_QUESTION_RE = re.compile(
    r'\?$|^(what|which|who|whom|whose|when|where|why|how|is|are|was|were|'
    r'do|does|did|can|could|will|would|shall|should|may|might|must|has|have|had)\b',
    re.IGNORECASE,
)

# List item starters: bullet, dash, numbered, letter+period
_LIST_ITEM_RE = re.compile(
    r'^(\s*[\*\-\•\–\—]\s+|\s*\d{1,3}[.)]\s+|\s*[a-zA-Z][.)]\s+)'
)

# Heading detection: line is a heading if it matches any of these
_HEADING_RE = re.compile(
    r"^\s*("
    r"\d+(\.\d+)*\.?\s+[A-Z]"          # 1. Introduction / 1.2 Overview
    r"|[A-Z][A-Z\s]{4,}[A-Z]"          # ALL CAPS (min 6 chars)
    r"|Chapter\s+\d+"                   # Chapter N
    r"|Section\s+\d+"                   # Section N
    r"|[IVXLCDM]+\.\s+[A-Z]"           # Roman numeral heading
    r")\s*$",
    re.MULTILINE,
)

# Detect lines that are just page numbers / artifacts (no real content)
_NOISE_LINE_RE = re.compile(
    r'^[\s\d\.\-\–\—\|]{0,6}$'         # whitespace/digits/punctuation only
    r'|^\s*(page|pg\.?)\s*\d+\s*$',    # "Page 5" etc.
    re.IGNORECASE,
)


def _fix_text(raw: str) -> str:
    """
    Comprehensive PDF text cleaning that preserves paragraph structure.

    Handles:
    - Unicode ligatures and smart quotes
    - Hyphenated line-breaks (word-\n)
    - Isolated single-character lines from columnar PDFs
    - Repeated spaces from PDF spacing
    - Runs of blank lines
    - Non-breaking spaces, zero-width chars
    """
    # Translate known ligatures and typographic chars
    text = raw.translate(_LIGATURES)

    # Remove zero-width / control chars except newline and tab
    text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)

    # Tabs → spaces
    text = text.replace('\t', ' ')

    # Fix hard/soft hyphen line-breaks: "some-\nword" → "someword"
    text = re.sub(r'(\w)-\n(\w)', r'\1\2', text)

    # Remove lone single-character lines (column-merging artifact)
    # but only if surrounded by blank lines
    text = re.sub(r'\n([A-Za-z])\n', r' \1 ', text)

    # A single newline that is NOT a paragraph break: join as a space
    # (paragraph breaks = 2+ newlines, keep those)
    text = re.sub(r'(?<!\n)\n(?!\n)', ' ', text)

    # Collapse runs of spaces (not newlines)
    text = re.sub(r'[ ]{2,}', ' ', text)

    # Collapse 3+ blank lines to exactly 2
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Remove lines that are pure noise (page numbers, lone dashes, etc.)
    lines = text.splitlines()
    lines = [ln for ln in lines if not _NOISE_LINE_RE.fullmatch(ln)]
    text = '\n'.join(lines)

    return text.strip()


def _split_sentences(paragraph: str) -> List[str]:
    """
    Split a paragraph into clean, complete sentences.

    Rules:
    1. Split on [.!?] followed by whitespace + uppercase/digit  (fixed lookbehind)
    2. Rejoin where the word before the period is a known abbreviation
    3. Questions (ending with ?) are preserved as whole atomic units
    4. Short fragments (< 15 chars) are merged with the next sentence
    """
    text = paragraph.strip()
    if not text:
        return []

    parts = _SENT_SPLIT_RE.split(text)
    if len(parts) <= 1:
        return [text]

    # Abbreviation-aware rejoin pass
    merged: List[str] = []
    current = parts[0]
    for part in parts[1:]:
        m = re.search(r'\b(\w+)\.\s*$', current)
        if m and m.group(1).lower() in _ABBREVS:
            current = current.rstrip() + ' ' + part
        else:
            stripped = current.strip()
            if stripped:
                merged.append(stripped)
            current = part
    stripped = current.strip()
    if stripped:
        merged.append(stripped)

    if not merged:
        return [text]

    # Merge tiny fragments (< 15 chars that aren't standalone questions)
    result: List[str] = []
    for sent in merged:
        if (result and len(sent) < 15
                and not _QUESTION_RE.search(sent)
                and not sent.endswith('?')):
            result[-1] = result[-1].rstrip() + ' ' + sent
        else:
            result.append(sent)

    return result


def _split_paragraphs(text: str) -> List[str]:
    """Split cleaned text into paragraphs (blank-line separated).
    Also treats each list item as its own paragraph.
    """
    raw_paras = re.split(r'\n{2,}', text)
    paras: List[str] = []
    for p in raw_paras:
        p = p.strip()
        if not p:
            continue
        # If the paragraph contains multiple list items, split them individually
        lines = p.splitlines()
        if len(lines) > 1 and all(_LIST_ITEM_RE.match(ln) for ln in lines if ln.strip()):
            for ln in lines:
                ln = ln.strip()
                if ln:
                    paras.append(ln)
        else:
            paras.append(p)
    return paras


# Lines that are purely exam/assignment questions should NOT be stored as chunks.
# They mislead the LLM into answering the wrong question.
_EXAM_Q_RE = re.compile(
    r'^\s*(?:Q\.?\d*[.:]?\s*|[0-9]{1,3}[.):]?\s+)'
    r'(?:Discuss|Explain|Describe|Define|What|How|Why|List|Enumerate|'
    r'Compare|Differentiate|Write|State|Elaborate|Outline|Summarize|'
    r'Summarise|Illustrate|Analyse|Analyze|Give|Show|Prove|Derive|Find|'
    r'Calculate|Evaluate|Justify)',
    re.IGNORECASE | re.MULTILINE,
)


def _is_exam_question_block(text: str) -> bool:
    """
    Return True if the passage is predominantly numbered/lettered exam questions
    and should be excluded from the chunk store.
    """
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    if not lines:
        return False
    q_lines = sum(1 for l in lines if _EXAM_Q_RE.match(l))
    # If more than half the non-empty lines look like exam questions, skip it.
    return q_lines >= max(1, len(lines) // 2)


def _detect_heading(line: str) -> bool:
    """Return True if the line looks like a section heading."""
    return bool(_HEADING_RE.match(line.strip()))


# ──────────────────────────────────────────────────────────────────────────────
#  PDF extraction helpers
# ──────────────────────────────────────────────────────────────────────────────

def _extract_pdf_pages_fitz(file_path: str) -> List[Tuple[int, str]]:
    """
    Extract text per page using PyMuPDF (fitz).

    Uses the 'blocks' extraction mode which preserves reading order and
    provides paragraph-level grouping: each block becomes its own logical
    paragraph, which drastically reduces mid-word / mid-sentence breaks
    compared to raw character-stream extraction.

    Returns [(page_number_1based, text), ...].
    """
    import fitz  # PyMuPDF
    pages = []
    with fitz.open(file_path) as doc:
        for page_num, page in enumerate(doc, start=1):
            blocks = page.get_text("blocks", sort=True)  # sort=True → reading order
            paragraphs = []
            for blk in blocks:
                # blocks entry: (x0, y0, x1, y1, "text", block_no, block_type)
                if blk[6] != 0:  # 0 = text, 1 = image — skip images
                    continue
                blk_text = blk[4].strip()
                if blk_text:
                    paragraphs.append(blk_text)
            if paragraphs:
                # Join blocks with double newlines so _split_paragraphs can use them
                pages.append((page_num, "\n\n".join(paragraphs)))
    return pages


def _extract_pdf_pages_pdfplumber(file_path: str) -> List[Tuple[int, str]]:
    """Fallback: extract per-page text via pdfplumber."""
    import pdfplumber
    pages = []
    with pdfplumber.open(file_path) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            if text.strip():
                pages.append((i, text))
    return pages


def _extract_pdf_pages_pypdf2(file_path: str) -> List[Tuple[int, str]]:
    """Last resort: PyPDF2 per page."""
    import PyPDF2
    pages = []
    with open(file_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for i, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            if text.strip():
                pages.append((i, text))
    return pages


def _remove_headers_footers(
    pages: List[Tuple[int, str]],
    threshold: float = 0.40,
) -> List[Tuple[int, str]]:
    """
    Remove lines that appear almost identically on ≥ threshold fraction of pages
    — these are headers/footers (e.g. "Confidential", "Page N", course title).
    """
    if len(pages) < 3:
        return pages   # too few pages to detect reliably

    # Collect first-line and last-line of each page (most common header/footer positions)
    first_lines: Dict[str, int] = {}
    last_lines: Dict[str, int] = {}

    for _, text in pages:
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        if not lines:
            continue
        # Normalise: strip numbers from the lines to catch "Page 1", "Page 2", etc.
        first = re.sub(r"\b\d+\b", "N", lines[0])
        last  = re.sub(r"\b\d+\b", "N", lines[-1])
        first_lines[first] = first_lines.get(first, 0) + 1
        last_lines[last]   = last_lines.get(last, 0) + 1

    total = len(pages)
    noisy_first = {k for k, v in first_lines.items() if v / total >= threshold}
    noisy_last  = {k for k, v in last_lines.items()  if v / total >= threshold}

    cleaned = []
    for page_num, text in pages:
        lines = text.splitlines()
        filtered = []
        for idx, line in enumerate(lines):
            normalised = re.sub(r"\b\d+\b", "N", line.strip())
            if idx == 0 and normalised in noisy_first:
                continue
            if idx == len(lines) - 1 and normalised in noisy_last:
                continue
            # Also skip lone page-number lines anywhere in the page
            if re.fullmatch(r"[\s\-–—]*\d{1,4}[\s\-–—]*", line):
                continue
            filtered.append(line)
        cleaned.append((page_num, "\n".join(filtered)))
    return cleaned


# ──────────────────────────────────────────────────────────────────────────────
#  Core chunker
# ──────────────────────────────────────────────────────────────────────────────

# Hard upper limit — a single chunk is never allowed to exceed this
_MAX_CHUNK_SIZE = 1400

def _overlap_seed(text: str, overlap_chars: int) -> str:
    """
    Return the last `overlap_chars` characters of `text`, but trim to the
    start of the last complete word so we never cut mid-word.
    """
    if len(text) <= overlap_chars:
        return text
    tail = text[-overlap_chars:]
    # Walk forward until we hit a word boundary (space)
    idx = tail.find(' ')
    return tail[idx + 1:] if idx != -1 else tail


def _build_chunks(
    passages: List[Tuple[str, int, Optional[str]]],  # (text, page_num, section_title)
    target_size: int = CHUNK_SIZE,
    overlap_chars: int = CHUNK_OVERLAP,
    min_chunk_size: int = 80,
) -> List[Dict]:
    """
    Paragraph-first chunking with sentence-level overflow handling.

    Strategy (in priority order):
    1. **Keep paragraphs whole** — if a paragraph fits in [min_chunk_size, MAX],
       accumulate paragraphs into the current chunk until target is reached.
    2. **Question boundary preference** — when flushing, prefer to end on a
       sentence that ends with '?' so questions are never split.
    3. **Sentence-level split** — if a single paragraph exceeds MAX_CHUNK_SIZE,
       split it at sentence boundaries (never mid-word, never mid-sentence).
    4. **Overlap** — the last 1–2 sentences of the previous chunk are prepended
       to the next so the LLM has context across boundaries.
    5. **Min filter** — discard chunks shorter than min_chunk_size (stray
       headings, lone numbers, etc.).
    """
    chunks: List[Dict] = []
    current_text = ""
    current_page_start: Optional[int] = None
    current_page_end: Optional[int] = None
    current_section: Optional[str] = None
    seed = ""   # overlap carried into the next chunk

    def flush(force_seed: str = ""):
        nonlocal current_text, current_page_start, current_page_end, seed
        text = current_text.strip()
        if len(text) >= min_chunk_size:
            chunks.append({
                "text": text,
                "page_start": current_page_start,
                "page_end": current_page_end,
                "section_title": current_section,
            })
            seed = force_seed if force_seed else _overlap_seed(text, overlap_chars)
        current_text = ""
        current_page_start = None
        current_page_end = None

    def _append_to_current(text_piece: str, page_num: int):
        nonlocal current_text, current_page_start, current_page_end
        sep = " " if current_text and not current_text.endswith('\n') else ""
        current_text += sep + text_piece
        if current_page_start is None:
            current_page_start = page_num
        if current_page_end is None:
            current_page_end = page_num
        else:
            current_page_end = max(current_page_end, page_num)

    def add_sentence_chunks(sentences: List[str], page_num: int):
        """
        Split a list of sentences into chunks, respecting target/max sizes.
        Questions are always kept in their own chunk if long enough.
        """
        nonlocal seed, current_text, current_page_start, current_page_end
        for sent in sentences:
            sent = sent.strip()
            if not sent:
                continue

            is_question = bool(_QUESTION_RE.search(sent)) or sent.endswith('?')

            # If the sentence itself exceeds MAX, split at the last word boundary
            while len(sent) > _MAX_CHUNK_SIZE:
                cut = sent.rfind(' ', 0, _MAX_CHUNK_SIZE)
                if cut == -1:
                    cut = _MAX_CHUNK_SIZE
                piece = sent[:cut].strip()
                sent  = sent[cut:].strip()
                if current_text:
                    flush()
                    current_text = (seed + " " + piece).strip() if seed else piece
                    current_page_start = current_page_end = page_num
                else:
                    current_text = (seed + " " + piece).strip() if seed else piece
                    current_page_start = current_page_end = page_num
                flush()

            projected = len(current_text) + (1 if current_text else 0) + len(sent)

            # Questions start a fresh chunk when they're substantial enough
            if is_question and len(sent) >= 30 and current_text:
                flush()
                current_text = (seed + " " + sent).strip() if seed else sent
                current_page_start = current_page_end = page_num
                # If this question fits alone as a good chunk, flush it immediately
                if len(sent) >= min_chunk_size:
                    flush()
                continue

            if projected > target_size and current_text:
                flush()
                current_text = (seed + " " + sent).strip() if seed else sent
                current_page_start = current_page_end = page_num
            else:
                if not current_text:
                    current_text = (seed + " " + sent).strip() if seed else sent
                    current_page_start = current_page_end = page_num
                else:
                    _append_to_current(sent, page_num)

    for passage_text, page_num, section_title in passages:
        # Section tracking
        if section_title:
            current_section = section_title

        # ── Paragraph-first ──────────────────────────────────────────────────
        para = passage_text.strip()
        if not para:
            continue

        para_len = len(para)

        # Small paragraph: accumulate as-is (don't sentence-split yet)
        if para_len <= target_size:
            projected = len(current_text) + (2 if current_text else 0) + para_len
            if projected > _MAX_CHUNK_SIZE and current_text:
                flush()
                current_text = (seed + " " + para).strip() if seed else para
                current_page_start = current_page_end = page_num
            else:
                if not current_text:
                    current_text = (seed + " " + para).strip() if seed else para
                    current_page_start = current_page_end = page_num
                else:
                    # Add a clear paragraph separator within the chunk
                    current_text += "\n\n" + para
                    current_page_end = max(current_page_end or page_num, page_num)

        # Large paragraph: sentence-split and accumulate sentence by sentence
        else:
            sentences = _split_sentences(para)
            if len(sentences) <= 1:
                # Can't split — force as its own chunk, truncating only at MAX
                if current_text:
                    flush()
                truncated = para[:_MAX_CHUNK_SIZE]
                # Don't cut mid-word
                last_space = truncated.rfind(' ')
                if last_space > min_chunk_size:
                    truncated = truncated[:last_space]
                current_text = (seed + " " + truncated).strip() if seed else truncated
                current_page_start = current_page_end = page_num
                flush()
            else:
                add_sentence_chunks(sentences, page_num)

    # Flush the final partial chunk
    if current_text.strip():
        flush()

    return chunks


# ──────────────────────────────────────────────────────────────────────────────
#  Main processor class (public API unchanged)
# ──────────────────────────────────────────────────────────────────────────────

class DocumentProcessor:
    def __init__(self):
        self.supported_formats = [".pdf", ".txt", ".docx"]

    # ── Public entry point ────────────────────────────────────────────────────

    def process_document(
        self,
        file_path: str,
        metadata: Dict = None,
    ) -> List[DocumentChunk]:
        """
        Process a document file into semantically coherent chunks.
        Returns a list of DocumentChunk objects; interface is unchanged.
        """
        path = Path(file_path)
        ext = path.suffix.lower()

        if ext == ".pdf":
            pages = self._load_pdf_pages(file_path)
        elif ext == ".txt":
            raw = self._load_txt(file_path)
            pages = [(1, raw)]
        elif ext == ".docx":
            raw = self._load_docx(file_path)
            pages = [(1, raw)]
        else:
            raise ValueError(f"Unsupported file format: {ext}")

        # Build base metadata
        file_meta = {
            "source": path.name,
            "file_path": str(file_path),
            "file_type": ext,
        }
        if metadata:
            file_meta.update(metadata)

        # Convert pages to passage list with section tracking
        passages = self._pages_to_passages(pages)

        # Build variable-length chunks
        raw_chunks = _build_chunks(passages, target_size=CHUNK_SIZE, overlap_chars=CHUNK_OVERLAP)

        # Drop chunks that are purely exam/assignment question listings so the
        # LLM never sees those questions and answers them instead of the user.
        raw_chunks = [rc for rc in raw_chunks if not _is_exam_question_block(rc["text"])]

        # Wrap into DocumentChunk objects
        doc_chunks = []
        total = len(raw_chunks)
        for i, rc in enumerate(raw_chunks):
            chunk_meta = file_meta.copy()
            chunk_meta["chunk_index"] = i
            chunk_meta["total_chunks"] = total
            chunk_meta["char_count"] = len(rc["text"])
            chunk_meta["page_start"] = rc.get("page_start")
            chunk_meta["page_end"] = rc.get("page_end")
            if rc.get("section_title"):
                chunk_meta["section_title"] = rc["section_title"]

            doc_chunks.append(DocumentChunk(
                text=rc["text"],
                metadata=chunk_meta,
                chunk_id=i,
            ))

        print(f"✅ Chunked '{path.name}' → {total} chunks "
              f"(avg {sum(len(c.text) for c in doc_chunks)//max(total,1)} chars each)")
        return doc_chunks

    # ── Legacy interface (still works; used by some older code paths) ─────────

    def load_document(self, file_path: str) -> str:
        """Return the full cleaned text of a document as a single string."""
        ext = Path(file_path).suffix.lower()
        if ext == ".pdf":
            pages = self._load_pdf_pages(file_path)
            return "\n\n".join(text for _, text in pages)
        elif ext == ".txt":
            return self._load_txt(file_path)
        elif ext == ".docx":
            return self._load_docx(file_path)
        raise ValueError(f"Unsupported format: {ext}")

    def chunk_text(self, text: str, chunk_size: int = CHUNK_SIZE,
                   overlap: int = CHUNK_OVERLAP) -> List[str]:
        """Legacy helper — returns list of chunk strings from a raw text blob."""
        passages = [(text, 1, None)]
        raw_chunks = _build_chunks(passages, target_size=chunk_size, overlap_chars=overlap)
        return [rc["text"] for rc in raw_chunks]

    # ── PDF loading ───────────────────────────────────────────────────────────

    def _load_pdf_pages(self, file_path: str) -> List[Tuple[int, str]]:
        """Extract per-page text from a PDF with fallback chain."""
        pages = None

        # 1. PyMuPDF (best quality, respects reading order)
        try:
            pages = _extract_pdf_pages_fitz(file_path)
        except Exception as e:
            print(f"  fitz failed ({e}), trying pdfplumber…")

        # 2. pdfplumber
        if not pages:
            try:
                pages = _extract_pdf_pages_pdfplumber(file_path)
            except Exception as e:
                print(f"  pdfplumber failed ({e}), trying PyPDF2…")

        # 3. PyPDF2 last resort
        if not pages:
            pages = _extract_pdf_pages_pypdf2(file_path)

        if not pages:
            raise RuntimeError(f"Could not extract any text from: {file_path}")

        # Remove noise headers/footers, then clean each page
        pages = _remove_headers_footers(pages)
        return [(pn, _fix_text(text)) for pn, text in pages if _fix_text(text)]

    # ── Plain text / DOCX loading ─────────────────────────────────────────────

    def _load_txt(self, file_path: str) -> str:
        with open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return _fix_text(f.read())

    def _load_docx(self, file_path: str) -> str:
        from docx import Document as DocxDoc
        doc = DocxDoc(file_path)
        paragraphs = []
        for para in doc.paragraphs:
            text = para.text.strip()
            if text:
                paragraphs.append(text)
        return _fix_text("\n\n".join(paragraphs))

    # ── Section/passage extraction ────────────────────────────────────────────

    def _pages_to_passages(
        self,
        pages: List[Tuple[int, str]],
    ) -> List[Tuple[str, int, Optional[str]]]:
        """
        Convert (page_num, text) pairs into a flat list of
        (passage_text, page_num, section_title) tuples.

        Detects section headings and tags each passage with the most recent
        heading seen.  Paragraphs within a page are exploded into separate
        passages so that the chunker can work at fine granularity.
        """
        passages: List[Tuple[str, int, Optional[str]]] = []
        current_section: Optional[str] = None

        for page_num, page_text in pages:
            # Split the page into paragraphs
            paragraphs = _split_paragraphs(page_text)

            for para in paragraphs:
                if not para.strip():
                    continue

                # Is this paragraph a standalone heading?
                first_line = para.splitlines()[0].strip()
                if _detect_heading(first_line) and len(para.strip()) < 120:
                    current_section = para.strip()
                    # Don't create a chunk for a bare heading — it'll be absorbed
                    # into the next passage as its section_title context
                    continue

                passages.append((para, page_num, current_section))

        return passages

