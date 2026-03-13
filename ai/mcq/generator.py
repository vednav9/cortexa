"""
MCQ Generator using LLM
"""
import json
import re
from typing import List, Dict, Optional
from models.llm import get_llm_model
from vectordb.json_store import get_json_store

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
        """Generate MCQs from given text"""
        # Validate and normalize input
        num_questions = max(1, min(20, num_questions))
        difficulty = difficulty.lower() if difficulty else "medium"
        if difficulty not in ["easy", "medium", "hard"]:
            difficulty = "medium"
        
        prompt = self._create_mcq_prompt(text, num_questions, difficulty, topic)
        
        # Keep generation bounded for latency-sensitive mobile UX.
        tokens_needed = min(num_questions * 70 + 120, 520)
        
        response = self.llm.generate(
            prompt=prompt,
            max_new_tokens=tokens_needed,
            temperature=0.6
        )
        
        # Parse MCQs from response
        mcqs = self._parse_mcqs_improved(response, text, num_questions)

        # Last-resort synthetic top-up so API returns requested count.
        if len(mcqs) < num_questions:
            synthetic = self._generate_synthetic_mcqs(text, num_questions - len(mcqs))
            mcqs = self._merge_unique_mcqs(mcqs, synthetic)

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
            text = "\n\n".join([chunk['text'] for chunk in chunks])
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
    
    def _create_mcq_prompt(
        self,
        text: str,
        num_questions: int,
        difficulty: str,
        topic: Optional[str]
    ) -> str:
        """Create a structured prompt for MCQ generation"""
        
        topic_str = f" about '{topic}'" if topic else ""
        diff_hint = {
            "easy": "basic concepts and definitions",
            "medium": "moderate understanding of concepts and their applications",
            "hard": "deep understanding, critical thinking, and complex scenarios"
        }.get(difficulty, "moderate understanding")
        
        # Limit text size
        max_text_length = 1000 if num_questions <= 5 else 1500
        context_text = text[:max_text_length]
        
        prompt = f"""Generate exactly {num_questions} high-quality multiple-choice questions{topic_str}.

DIFFICULTY LEVEL: {difficulty.upper()}
(Focus on: {diff_hint})

CONTEXT:
{context_text}

OUTPUT FORMAT - Generate ONLY valid questions in this exact format (no other text):

Q1: [Clear question here]?
A. [Option A]
B. [Option B]
C. [Option C]
D. [Option D]
CORRECT: [A/B/C/D]
EXPLAIN: [Brief explanation of why this is correct]

Q2: [Next question]?
A. [Option A]
B. [Option B]
C. [Option C]
D. [Option D]
CORRECT: [A/B/C/D]
EXPLAIN: [Brief explanation]

[Continue for all {num_questions} questions]

RULES:
- Each question must have exactly one correct answer
- Options should be plausible but distinct
- Explanations should be concise (1-2 sentences)
- Questions should test the difficulty level specified
- Avoid ambiguous wording

Now generate {num_questions} questions:
"""
        return prompt
    
    def _parse_mcqs_improved(self, response: str, context: str, num_requested: int) -> List[Dict]:
        """
        Improved MCQ parsing with new format: Q#: ... A. ... B. ... C. ... D. ... CORRECT: ... EXPLAIN: ...
        """
        mcqs = []
        
        # Split by Q# pattern to find all questions
        question_blocks = re.split(r'\nQ\d+:', response)
        
        # First block is usually garbage before first Q1:
        if question_blocks and not question_blocks[0].strip().startswith('Q'):
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
        
        # First line is the question
        question = lines[0].rstrip('?')
        if question.endswith(':'):
            question = question[:-1]
        question = re.sub(r'^\s*(Q|Question)\s*\d+\s*[:.)-]\s*', '', question, flags=re.IGNORECASE).strip()
        
        if not question or len(question) < 5:
            return None
        
        # Look for options A, B, C, D
        for line in lines[1:]:
            # Match "A. text" or "A) text"
            opt_match = re.match(r'^([A-D])[\s.):]+(.+)$', line)
            if opt_match:
                letter = opt_match.group(1).upper()
                text = opt_match.group(2).strip()
                if text:
                    options[letter] = text
                continue
            
            # Match CORRECT: X
            if 'CORRECT' in line.upper():
                correct_match = re.search(r'([A-D])', line)
                if correct_match:
                    correct_answer = correct_match.group(1).upper()
                continue
            
            # Match EXPLAIN: or EXPLANATION:
            if 'EXPLAIN' in line.upper():
                explanation = re.sub(r'^EXPLAIN(ATION)?[\s:]+', '', line, flags=re.IGNORECASE).strip()
                continue
        
        # Validate - need question, 4 options, and correct answer
        if question and len(options) >= 4 and correct_answer and correct_answer in options:
            # Ensure we have exactly 4 options in order
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
                'difficulty': 'medium'
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
            
            # Parse answer
            if 'ANSWER' in line.upper():
                ans_match = re.search(r'([A-D])', line)
                if ans_match:
                    correct_answer = ans_match.group(1).upper()
            
            # Parse explanation
            if 'EXPL' in line.upper():
                explanation = re.sub(r'.*EXPL[A-Z]*\s*[:\s]*', '', line, flags=re.IGNORECASE)
        
        if question and len(options) >= 3 and correct_answer in options:
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
        """Generate simple synthetic MCQs when parsing fails"""
        # Extract key sentences
        sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 50][:num * 2]
        
        mcqs = []
        for i, sentence in enumerate(sentences[:num]):
            # Create a simple MCQ from the sentence
            words = sentence.split()
            if len(words) < 5:
                continue
            
            # Create question by removing a key word
            key_word = words[len(words)//2]
            question_text = sentence.replace(key_word, "______")
            
            mcq = {
                'question': f"Fill in the blank: {question_text}",
                'options': {
                    'A': key_word,
                    'B': f"Not {key_word}",
                    'C': "None of the above",
                    'D': "Cannot be determined"
                },
                'correct_answer': 'A',
                'explanation': f"The correct term is '{key_word}' based on the context.",
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
