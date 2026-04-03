"""
MCQ Generator using LLM
"""
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
        prompt = self._create_mcq_prompt(text, num_questions, difficulty, topic)
        
        # ⚡ Cap tokens strictly to avoid Client/Proxy Timeouts on CPU
        tokens_needed = min(num_questions * 110 + 50, 500)
        
        # Generate MCQs with low temperature for strictly factual output
        response = self.llm.generate(
            prompt=prompt,
            max_new_tokens=tokens_needed,
            temperature=0.3
        )
        
        print(f"\n🤖 LLM Response Preview:\n{response[:400]}...\n")
        
        return self._parse_mcqs_improved(response, text)
    
    def generate_from_document(
        self,
        document_name: str,
        num_questions: int = 5,
        difficulty: str = "medium",
        topic: Optional[str] = None
    ) -> List[Dict]:
        """Generate MCQs from a document in the vector store"""
        chunks = self._get_document_chunks(document_name, num_chunks=10)
        
        if not chunks:
            # FIX: Fallback to topic search instead of throwing a 500 Server Error
            print(f"⚠️ Document '{document_name}' exact match failed. Falling back to semantic search.")
            return self.generate_from_topic(document_name, num_questions, difficulty)
        
        text = "\n\n".join([chunk['text'] for chunk in chunks])
        return self.generate_from_text(text, num_questions, difficulty, topic)
    
    def generate_from_topic(
        self,
        topic: str,
        num_questions: int = 5,
        difficulty: str = "medium"
    ) -> List[Dict]:
        """Generate MCQs from a specific topic using vector search"""
        documents, metadatas, distances = self.vector_store.search(
            query=topic,
            top_k=4
        )
        
        if not documents:
            # FIX: Return fallback instead of crashing with ValueError -> 500 Error
            print(f"⚠️ No content found for topic: {topic}. Generating basic fallback.")
            return self._generate_synthetic_mcqs(topic, num_questions)
        
        text = "\n\n".join(documents)
        return self.generate_from_text(text, num_questions, difficulty, topic)
    
    def _create_mcq_prompt(
        self,
        text: str,
        num_questions: int,
        difficulty: str,
        topic: Optional[str]
    ) -> str:
        """Create improved prompt formatted specifically for TinyLlama-Chat"""
        topic_str = f" about {topic}" if topic else ""
        max_text_length = 1000  # Shorter context parses much faster
        
        # FIX: TinyLlama requires <|system|>, <|user|>, and <|assistant|> tokens
        prompt = f"""<|system|>
You are an expert teacher. Generate multiple-choice questions based ONLY on the provided text. Do NOT use outside knowledge. Output ONLY the questions in the exact format requested, with no conversational filler.</s>
<|user|>
Text: {text[:max_text_length]}

Create exactly {num_questions} multiple-choice questions{topic_str}.
Format EACH question EXACTLY like this:
Q1: [Question text]
A. [Option]
B. [Option]
C. [Option]
D. [Option]
ANSWER: [A/B/C/D]
EXPLANATION: [Brief explanation]
</s>
<|assistant|>
"""
        return prompt
    
    def _parse_mcqs_improved(self, response: str, context: str) -> List[Dict]:
        """Improved MCQ parsing with fallback"""
        mcqs = []
        
        # Look for Q1:, 1., etc.
        question_pattern = r'(?:Q\d+[:.]|\d+[.)])\s*(.+?)(?=(?:Q\d+[:.]|\d+[.)]|ANSWER:|$))'
        questions = re.findall(question_pattern, response, re.DOTALL | re.IGNORECASE)
        
        for question_text in questions:
            mcq = self._parse_question_block(question_text)
            if mcq:
                mcqs.append(mcq)
        
        if len(mcqs) == 0:
            print("⚠️ Parsing failed due to LLM hallucination, generating synthetic fallback MCQs...")
            mcqs = self._generate_synthetic_mcqs(context, 3)
            
        return mcqs
    
    def _parse_question_block(self, text: str) -> Optional[Dict]:
        """Parse a single question block"""
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        
        question = None
        options = {}
        correct_answer = None
        explanation = None
        
        for i, line in enumerate(lines):
            if i == 0:
                question = re.sub(r'^(?:Q\d+[:.]|\d+[.)])\s*', '', line).strip()
                continue
                
            option_match = re.match(r'^([A-D])[.):\s]+(.+)', line, re.IGNORECASE)
            if option_match:
                letter = option_match.group(1).upper()
                text_opt = option_match.group(2).strip()
                options[letter] = text_opt
                continue
                
            if 'answer' in line.lower():
                answer_match = re.search(r'\b([A-D])\b', line, re.IGNORECASE)
                if answer_match:
                    correct_answer = answer_match.group(1).upper()
                continue
                
            if 'explanation' in line.lower():
                explanation = re.sub(r'^explanation[:\s]+', '', line, flags=re.IGNORECASE).strip()
                
        if question and len(options) >= 3 and correct_answer and correct_answer in options:
            return {
                'question': question,
                'options': options,
                'correct_answer': correct_answer,
                'explanation': explanation or "Based on the provided context.",
                'difficulty': 'medium'
            }
            
        return None
    
    def _generate_synthetic_mcqs(self, text: str, num: int) -> List[Dict]:
        """Generate simple synthetic MCQs when parsing fails"""
        sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 50][:num * 2]
        mcqs = []
        
        for i, sentence in enumerate(sentences[:num]):
            words = sentence.split()
            if len(words) < 5:
                continue
            key_word = words[len(words)//2]
            question_text = sentence.replace(key_word, "______")
            
            mcqs.append({
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
            })
            
        return mcqs if mcqs else [{
            'question': "Could not generate questions based on the provided topic.",
            'options': {'A': "True", 'B': "False", 'C': "None", 'D': "Unknown"},
            'correct_answer': 'A',
            'explanation': "The AI failed to find text to generate questions from.",
            'difficulty': 'medium'
        }]
    
    def _get_document_chunks(self, document_name: str, num_chunks: int = 10) -> List[Dict]:
        """Get chunks from a specific document - relaxed matching to prevent 500s"""
        matching_chunks = []
        doc_name_lower = str(document_name).lower()
        
        for doc in self.vector_store.data.get('documents', []):
            meta = doc.get('metadata', {})
            # Look inside multiple metadata keys just in case Flutter sent the wrong ID
            searchable_string = " ".join([
                str(meta.get('source', '')),
                str(meta.get('fileName', '')),
                str(meta.get('originalName', ''))
            ]).lower()
            
            if doc_name_lower in searchable_string:
                matching_chunks.append({
                    'text': doc.get('text', ''),
                    'metadata': meta
                })
                
        return matching_chunks[:num_chunks]

# Singleton
_mcq_generator = None

def get_mcq_generator() -> MCQGenerator:
    global _mcq_generator
    if _mcq_generator is None:
        _mcq_generator = MCQGenerator()
    return _mcq_generator