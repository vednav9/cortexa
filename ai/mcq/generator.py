"""
MCQ Generator using LLM
"""
import json
import re
import unicodedata
from typing import List, Dict, Optional
from models.llm import get_llm_model
from vectordb.json_store import get_json_store


def sanitize_context(text: str) -> str:
    """Strip corrupt PDF characters that cause LLM failures.

    Characters like \u8186 (膆), \u8e30 (踰) come from garbled PDF encoding.
    They cause the LLM to produce garbage or fail entirely, which then triggers
    the raw-prompt-leaking absolute fallback question.
    """
    if not text:
        return ""
    # Remove CJK ideographs and symbols common in corrupt PDF extractions
    text = re.sub(r'[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af\u4000-\u9fff]', ' ', text)
    # Remove box-drawing, private-use area, and specials
    text = re.sub(r'[\u2500-\u257f\ue000-\uf8ff\ufff0-\uffff]', ' ', text)
    # Remove control characters (keep newline/tab)
    text = re.sub(r'[\x00-\x08\x0b-\x1f\x7f-\x9f]', ' ', text)
    # Fix common garbled ligatures from bad PDF encodings
    text = text.replace('\u01af', 'ff')  # Ư -> ff (e.g. DiƯerence -> Difference)
    text = text.replace('\u01b0', 'ff')
    # Collapse whitespace
    text = re.sub(r'[ \t]{2,}', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

class MCQGenerator:
    def __init__(self):
        self.llm = get_llm_model()
        self.vector_store = get_json_store()
    
    def generate_from_text(
        self,
        text: str,
        num_questions: int = 5,
        difficulty: str = "medium",
        topic: Optional[str] = None
    ) -> List[Dict]:
        """Generate MCQs from given text — uses a per-question loop to guarantee
        the requested count and avoid token-budget truncation that caused CJK garbage."""
        # Sanitize: remove corrupt PDF chars before they reach the LLM
        text = sanitize_context(text)
        # Validate and normalize input
        num_questions = max(1, min(20, num_questions))
        difficulty = difficulty.lower() if difficulty else "medium"
        if difficulty not in ["easy", "medium", "hard"]:
            difficulty = "medium"

        mcqs: List[Dict] = []
        # Try generating each question individually — more reliable than one big call.
        for q_idx in range(1, num_questions + 1):
            if len(mcqs) >= num_questions:
                break
            try:
                prompt = self._create_single_mcq_prompt(text, q_idx, num_questions, difficulty, topic)
                # 300 tokens is enough for one Q+4 options+CORRECT+EXPLAIN
                response = self.llm.generate(
                    prompt=prompt,
                    max_new_tokens=350,
                    temperature=0.6
                )
                # Use improved parser — handles the full Q1: ... response correctly
                parsed_list = self._parse_mcqs_improved(response, text, 1)
                if parsed_list:
                    mcq = parsed_list[0]
                    # Preserve the requested difficulty
                    mcq['difficulty'] = difficulty
                    mcqs.append(mcq)
            except Exception as e:
                print(f"⚠️ Per-question generation failed for Q{q_idx}: {e}")
                pass  # will be filled by fallback below

        # If per-question loop didn't fill all slots, try a batch call as backup.
        if len(mcqs) < num_questions:
            remaining = num_questions - len(mcqs)
            try:
                batch_prompt = self._create_mcq_prompt(text, remaining, difficulty, topic)
                # Give ~300 tokens per remaining question
                batch_tokens = min(remaining * 310 + 60, 2048)
                batch_response = self.llm.generate(
                    prompt=batch_prompt,
                    max_new_tokens=batch_tokens,
                    temperature=0.6
                )
                batch_mcqs = self._parse_mcqs_improved(batch_response, text, remaining)
                for mcq in batch_mcqs:
                    mcq['difficulty'] = difficulty
                mcqs = self._merge_unique_mcqs(mcqs, batch_mcqs)
            except Exception as e:
                print(f"⚠️ Batch fallback generation failed: {e}")
                pass

        # Last-resort synthetic top-up so API always returns requested count.
        if len(mcqs) < num_questions:
            synthetic = self._generate_synthetic_mcqs(text, num_questions - len(mcqs))
            mcqs = self._merge_unique_mcqs(mcqs, synthetic)

        # Hard-enforce word limits regardless of LLM compliance
        mcqs = [self._enforce_word_limits(mcq) for mcq in mcqs]

        return mcqs[:num_questions]
    
    def generate_from_document(
        self,
        document_name: str,
        num_questions: int = 5,
        difficulty: str = "medium",
        topic: Optional[str] = None
    ) -> List[Dict]:
        """Generate MCQs from a document in the vector store"""
        try:
            chunks = self._get_document_chunks(document_name, num_chunks=15)
            if not chunks:
                raise ValueError(f"Document '{document_name}' not found in vector store")
            raw_text = "\n\n".join([chunk['text'] for chunk in chunks])
            # Sanitize before passing on
            text = sanitize_context(raw_text)
        except Exception as e:
            raise ValueError(f"Failed to retrieve document '{document_name}': {str(e)}")
        
        return self.generate_from_text(text, num_questions, difficulty, topic)
    
    def generate_from_topic(
        self,
        topic: str,
        num_questions: int = 5,
        difficulty: str = "medium"
    ) -> List[Dict]:
        """Generate MCQs from a specific topic using vector search or knowledge"""
        try:
            # Try vector search first
            documents, metadatas, distances = self.vector_store.search(
                query=topic,
                top_k=5
            )
            
            if documents and len(documents) > 0:
                # Use top 3 documents
                text = "\n\n".join(documents[:3])
            else:
                # Fallback to topic name only
                print(f"⚠️ No vector search results for '{topic}', using topic name only")
                text = f"Topic: {topic}"
        except Exception as e:
            print(f"⚠️ Vector search failed: {str(e)}, using topic name only")
            text = f"Topic: {topic}"
        
        return self.generate_from_text(text, num_questions, difficulty, topic)
    
    def _enforce_word_limits(self, mcq: dict) -> dict:
        """Post-processing: hard-truncate question to 10 words and each option to 2 words."""
        def trim_words(text: str, max_words: int) -> str:
            if not text:
                return text
            words = str(text).split()
            if len(words) <= max_words:
                return text
            return ' '.join(words[:max_words])

        question = str(mcq.get('question', ''))
        # Truncate to 10 words; add '?' if it doesn't end with one
        question = trim_words(question, 10)
        if question and not question.endswith('?'):
            question += '?'
        mcq = dict(mcq)  # copy
        mcq['question'] = question

        options = mcq.get('options', {})
        if isinstance(options, dict):
            mcq['options'] = {k: trim_words(str(v), 2) for k, v in options.items()}
        elif isinstance(options, list):
            mcq['options'] = [trim_words(str(o), 2) for o in options]

        return mcq

    def _create_mcq_prompt(
        self,
        text: str,
        num_questions: int,
        difficulty: str,
        topic: Optional[str]
    ) -> str:
        """Create a structured prompt for MCQ generation (batch mode)"""
        topic_str = f" about '{topic}'" if topic else ""
        diff_hint = {
            "easy": "basic concepts and definitions",
            "medium": "moderate understanding of concepts and their applications",
            "hard": "deep understanding, critical thinking, and complex scenarios"
        }.get(difficulty, "moderate understanding")

        # Limit context: 500 chars per question to leave room for output tokens
        max_text_length = min(500 * num_questions, 3000)
        context_text = text[:max_text_length]

        prompt = f"""Generate exactly {num_questions} multiple-choice questions{topic_str}.
DIFFICULTY: {difficulty.upper()} ({diff_hint})
CONTEXT: {context_text}

STRICT RULES:
- Question: maximum 10 words, end with ?
- Each option (A/B/C/D): maximum 2 words only
- No sentences in options — single terms or short phrases only

OUTPUT (repeat block for each question):
Q1: [max 10-word question]?
A. [1-2 words]
B. [1-2 words]
C. [1-2 words]
D. [1-2 words]
CORRECT: [A/B/C/D]
EXPLAIN: [one sentence]

Generate {num_questions} questions now:
"""
        return prompt

    def _create_single_mcq_prompt(
        self,
        text: str,
        q_num: int,
        total: int,
        difficulty: str,
        topic: Optional[str]
    ) -> str:
        """Prompt for generating exactly ONE MCQ (used in per-question loop)."""
        topic_str = f" about '{topic}'" if topic else ""
        diff_hint = {
            "easy": "basic concepts and definitions",
            "medium": "understanding of concepts and applications",
            "hard": "deep understanding and critical thinking"
        }.get(difficulty, "understanding of concepts")

        # Keep context short — leave tokens for the answer
        context_text = text[:600]

        prompt = f"""Generate question {q_num} of {total}{topic_str}.
DIFFICULTY: {difficulty.upper()} ({diff_hint})
CONTEXT: {context_text}

STRICT RULES:
- Question: maximum 10 words, end with ?
- Each option (A B C D): maximum 2 words
- No full sentences in options

Output ONLY this exact format:
Q{q_num}: [max 10-word question]?
A. [1-2 words]
B. [1-2 words]
C. [1-2 words]
D. [1-2 words]
CORRECT: [A/B/C/D]
EXPLAIN: [one sentence why]

Q{q_num}:"""
        return prompt
    
    def _parse_mcqs_improved(self, response: str, context: str, num_requested: int) -> List[Dict]:
        """
        Improved MCQ parsing with new format: Q#: ... A. ... B. ... C. ... D. ... CORRECT: ... EXPLAIN: ...
        """
        mcqs = []
        
        # Split by Q# pattern — handles both leading and mid-string occurrences
        question_blocks = re.split(r'(?:^|\n)Q\d+:', response)
        
        # First block is usually empty or garbage before first Q1:
        if question_blocks and not re.search(r'[A-D][.):]+', question_blocks[0]):
            question_blocks = question_blocks[1:]
        
        for block in question_blocks:
            if not block.strip():
                continue
                
            mcq = self._parse_single_mcq_block(block)
            if mcq:
                mcqs.append(mcq)
        
        # If we got enough MCQs, return them.
        if len(mcqs) >= num_requested:
            return mcqs[:num_requested]
        
        # If parsing produced very few, try fallback parser and merge.
        fallback_mcqs = self._parse_mcqs_fallback(response)
        mcqs = self._merge_unique_mcqs(mcqs, fallback_mcqs)
        
        return mcqs
    
    def _parse_single_mcq_block(self, block: str) -> Optional[Dict]:
        """Parse a single question block in new format"""
        lines = [l.strip() for l in block.split('\n') if l.strip()]
        if not lines:
            return None
        
        question = None
        options = {}
        correct_answer = None
        explanation = None
        
        # First line is the question — preserve the '?' but strip the Q prefix and trailing ':'
        first_line = lines[0]
        # Remove any leading Q#: prefix that may have leaked through
        first_line = re.sub(r'^\s*(Q|Question)\s*\d+\s*[:.)-]\s*', '', first_line, flags=re.IGNORECASE).strip()
        # Remove trailing colon that some models add
        if first_line.endswith(':') and not first_line.endswith('?:'):
            first_line = first_line[:-1].strip()
        question = first_line
        
        if not question or len(question) < 5:
            return None
        
        # Look for options A, B, C, D
        for line in lines[1:]:
            # Skip lines that look like the end-of-prompt echo (e.g. "Q2:")
            if re.match(r'^Q\d+:\s*$', line):
                continue

            # Match "A. text", "A) text", "A: text"
            opt_match = re.match(r'^([A-D])[\s.):]+(.+)$', line)
            if opt_match:
                letter = opt_match.group(1).upper()
                text = opt_match.group(2).strip()
                if text:
                    options[letter] = text
                continue
            
            # Match CORRECT: X
            if 'CORRECT' in line.upper():
                correct_match = re.search(r'\b([A-D])\b', line)
                if correct_match:
                    correct_answer = correct_match.group(1).upper()
                continue
            
            # Match EXPLAIN: or EXPLANATION:
            if 'EXPLAIN' in line.upper():
                explanation = re.sub(r'^EXPLAIN(ATION)?[\s:]+', '', line, flags=re.IGNORECASE).strip()
                continue
        
        # Validate - need question, at least 2 options, and correct answer
        if question and len(options) >= 2 and correct_answer:
            # Fill any missing options with placeholders
            for letter in 'ABCD':
                if letter not in options:
                    options[letter] = f"Option {letter}"
            # If correct_answer not in parsed options, default to A
            if correct_answer not in options:
                correct_answer = 'A'
            ordered_options = [options.get(letter, f"Option {letter}") for letter in 'ABCD']
            return {
                'question': question,
                'options': {
                    'A': ordered_options[0],
                    'B': ordered_options[1],
                    'C': ordered_options[2],
                    'D': ordered_options[3],
                },
                'correct_answer': correct_answer,
                'explanation': explanation or "Based on the provided context.",
                'difficulty': 'medium'  # will be overridden by caller
            }
        
        return None

    def _merge_unique_mcqs(self, base: List[Dict], extra: List[Dict]) -> List[Dict]:
        """Merge MCQ lists and keep unique questions by normalized text."""
        merged = []
        seen = set()

        for item in (base + extra):
            question = str(item.get('question', '')).strip()
            key = re.sub(r'^\s*(Q|Question)\s*\d+\s*[:.)-]\s*', '', question, flags=re.IGNORECASE).lower()
            if not key or key in seen:
                continue
            seen.add(key)
            item['question'] = re.sub(r'^\s*(Q|Question)\s*\d+\s*[:.)-]\s*', '', question, flags=re.IGNORECASE).strip()
            merged.append(item)

        return merged
    
    def _parse_mcqs_fallback(self, response: str) -> List[Dict]:
        """Fallback parsing for various formats"""
        mcqs = []
        
        # Try finding by Q1:, Q2: pattern
        question_pattern = r'Q\d+[:.]\s*(.+?)(?=Q\d+[:.]|$)'
        blocks = re.findall(question_pattern, response, re.DOTALL | re.IGNORECASE)
        
        for block in blocks:
            mcq = self._parse_legacy_format(block)
            if mcq:
                mcqs.append(mcq)
        
        return mcqs
    
    def _parse_legacy_format(self, text: str) -> Optional[Dict]:
        """Parse legacy question format"""
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        if not lines:
            return None
        
        question = lines[0]
        options = {}
        correct_answer = None
        explanation = None
        
        for line in lines[1:]:
            # Try to parse options
            opt_match = re.match(r'^([A-D])[\s.):]+(.+)$', line)
            if opt_match:
                options[opt_match.group(1).upper()] = opt_match.group(2).strip()
                continue
            
            # Parse answer — support both ANSWER: X and CORRECT: X
            if 'ANSWER' in line.upper() or 'CORRECT' in line.upper():
                ans_match = re.search(r'\b([A-D])\b', line)
                if ans_match:
                    correct_answer = ans_match.group(1).upper()
            
            # Parse explanation
            if 'EXPL' in line.upper():
                explanation = re.sub(r'.*EXPL[A-Z]*\s*[:\s]*', '', line, flags=re.IGNORECASE)
        
        # Need at least 2 options and a correct answer
        if question and len(options) >= 2 and correct_answer:
            # Fill missing options
            for letter in 'ABCD':
                if letter not in options:
                    options[letter] = f"Option {letter}"
            if correct_answer not in options:
                correct_answer = list(options.keys())[0]
            ordered_options = {letter: options.get(letter, f"Option {letter}") for letter in 'ABCD'}
            return {
                'question': question,
                'options': ordered_options,
                'correct_answer': correct_answer,
                'explanation': explanation or "Based on the context.",
                'difficulty': 'medium'
            }
        
        return None
    
    def _generate_synthetic_mcqs(self, text: str, num: int) -> List[Dict]:
        """Generate fallback MCQs from document facts when LLM parsing fails.

        Produces 'Which is true?' MCQs instead of fill-in-the-blank so that
        prompt text never leaks into the question.
        """
        # Keywords that indicate prompt preamble / non-document text
        PROMPT_JUNK = re.compile(
            r'generate\s+mcq|use the following|reference context|fill in the blank'
            r'|topic:\s*generate|selected documents|\[source:|chapter name',
            re.IGNORECASE
        )

        # Strip prompt preamble
        clean = re.sub(
            r'(?si)^.*?(?:reference context[^\n]*|use the following[^\n]*)\n+',
            '', text
        )
        clean = re.sub(r'\[Source:[^\]]*\]\s*', ' ', clean)
        clean = re.sub(r'^Topic:\s*[^\n]*\n*', '', clean, flags=re.IGNORECASE | re.MULTILINE)
        clean = re.sub(r'^Generate\s+MCQ[^\n]*\n*', '', clean, flags=re.IGNORECASE | re.MULTILINE)

        if len(clean.strip()) < 80:
            clean = text

        # Split on sentence boundaries and collect clean facts
        facts = []
        for s in re.split(r'(?<=[.!?])\s+|\n', clean):
            s = s.strip()
            if len(s) < 30 or len(s) > 200:
                continue
            if PROMPT_JUNK.search(s):
                continue
            # Must be mostly readable ASCII
            alnum = len(re.findall(r'[A-Za-z0-9]', s))
            if alnum / max(len(s), 1) < 0.45:
                continue
            facts.append(s)
            if len(facts) >= num * 3:
                break

        mcqs = []
        for i, fact in enumerate(facts[:num]):
            words = [w for w in fact.split() if re.match(r'[A-Za-z]', w)]
            if len(words) < 4:
                continue
            # Build a short question from the first few meaningful words
            q_words = words[:8]
            q_text = ' '.join(q_words)
            if not q_text.endswith('?'):
                q_text += '?'

            correct_word = words[min(3, len(words) - 1)]

            mcq = {
                'question': q_text,
                'options': {
                    'A': correct_word,
                    'B': 'False',
                    'C': 'Unrelated',
                    'D': 'Unknown',
                },
                'correct_answer': 'A',
                'explanation': 'Based on the document context.',
                'difficulty': 'easy'
            }
            mcqs.append(mcq)

        return mcqs
    
    def _get_document_chunks(self, document_name: str, num_chunks: int = 10) -> List[Dict]:
        """Get chunks from a specific document"""
        matching_chunks = []
        
        for doc in self.vector_store.data['documents']:
            if document_name.lower() in doc['metadata'].get('source', '').lower():
                matching_chunks.append({
                    'text': doc['text'],
                    'metadata': doc['metadata']
                })
        
        return matching_chunks[:num_chunks]

# Singleton
_mcq_generator = None

def get_mcq_generator() -> MCQGenerator:
    global _mcq_generator
    if _mcq_generator is None:
        _mcq_generator = MCQGenerator()
    return _mcq_generator
