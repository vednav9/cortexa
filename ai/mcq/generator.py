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
        prompt = self._create_mcq_prompt(text, num_questions, difficulty, topic)
        
        # ⚡ Calculate tokens based on number of questions (avg 150 tokens per MCQ)
        tokens_needed = min(num_questions * 150 + 100, 800)  # Cap at 800 for speed
        
        # Generate MCQs with higher temperature for creativity
        response = self.llm.generate(
            prompt=prompt,
            max_new_tokens=tokens_needed,  # Dynamic based on num_questions
            temperature=0.8  # Balanced creativity
        )
        
        print(f"\n🤖 LLM Response:\n{response[:500]}...\n")  # Debug
        
        # Parse MCQs from response
        mcqs = self._parse_mcqs_improved(response, text)
        
        return mcqs
    
    def generate_from_document(
        self,
        document_name: str,
        num_questions: int = 5,
        difficulty: str = "medium",
        topic: Optional[str] = None
    ) -> List[Dict]:
        """Generate MCQs from a document in the vector store"""
        chunks = self._get_document_chunks(document_name, num_chunks=15)
        
        if not chunks:
            raise ValueError(f"Document '{document_name}' not found in vector store")
        
        text = "\n\n".join([chunk['text'] for chunk in chunks])
        return self.generate_from_text(text, num_questions, difficulty, topic)
    
    def generate_from_topic(
        self,
        topic: str,
        num_questions: int = 5,
        difficulty: str = "medium"
    ) -> List[Dict]:
        """Generate MCQs from a specific topic using vector search"""
        # ⚡ Reduce search for speed - fewer documents = faster
        documents, metadatas, distances = self.vector_store.search(
            query=topic,
            top_k=5  # Reduced from 15 for speed
        )
        
        if not documents:
            raise ValueError(f"No content found for topic: {topic}")
        
        # ⚡ Use top 3 most relevant (reduced from 5)
        text = "\n\n".join(documents[:3])
        return self.generate_from_text(text, num_questions, difficulty, topic)
    
    def _create_mcq_prompt(
        self,
        text: str,
        num_questions: int,
        difficulty: str,
        topic: Optional[str]
    ) -> str:
        """Create improved prompt for MCQ generation"""
        
        topic_str = f" about {topic}" if topic else ""
        
        # ⚡ Shorter text input = faster generation
        max_text_length = 800 if num_questions <= 3 else 1200
        
        # Simpler, clearer prompt
        prompt = f"""Based on the following text, create {num_questions} multiple-choice questions{topic_str}.

TEXT:
{text[:max_text_length]}

Create exactly {num_questions} questions. For each question:
1. Write a clear question
2. Provide exactly 4 options labeled A, B, C, D
3. Mark which option is correct
4. Give a brief explanation

Example format:

Q1: What is the capital of France?
A. London
B. Paris
C. Berlin
D. Rome
ANSWER: B
EXPLANATION: Paris is the capital and largest city of France.

Q2: Which planet is known as the Red Planet?
A. Venus
B. Mars
C. Jupiter
D. Saturn
ANSWER: B
EXPLANATION: Mars appears reddish due to iron oxide on its surface.

Now create {num_questions} questions:

"""
        return prompt
    
    def _parse_mcqs_improved(self, response: str, context: str) -> List[Dict]:
        """Improved MCQ parsing with fallback"""
        mcqs = []
        
        # Try to find questions by Q1:, Q2:, etc.
        question_pattern = r'Q\d+[:.]\s*(.+?)(?=Q\d+[:.|\n]|ANSWER:|$)'
        questions = re.findall(question_pattern, response, re.DOTALL | re.IGNORECASE)
        
        if not questions:
            # Fallback: try numbered questions
            question_pattern = r'(\d+[.)])\s*(.+?)(?=\d+[.)]|ANSWER:|$)'
            questions = re.findall(question_pattern, response, re.DOTALL)
            questions = [q[1] for q in questions]  # Get just the text
        
        # Parse each question block
        for question_text in questions:
            mcq = self._parse_question_block(question_text)
            if mcq:
                mcqs.append(mcq)
        
        # If parsing failed, generate synthetic MCQs from context
        if len(mcqs) == 0:
            print("⚠️ Parsing failed, generating synthetic MCQs...")
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
            # Get question (first line)
            if i == 0:
                question = re.sub(r'^Q\d+[:.]\s*', '', line).strip()
                continue
            
            # Parse options (A. / A) / A:)
            option_match = re.match(r'^([A-D])[.):\s]+(.+)', line, re.IGNORECASE)
            if option_match:
                letter = option_match.group(1).upper()
                text = option_match.group(2).strip()
                options[letter] = text
                continue
            
            # Parse answer
            if 'answer' in line.lower():
                answer_match = re.search(r'\b([A-D])\b', line, re.IGNORECASE)
                if answer_match:
                    correct_answer = answer_match.group(1).upper()
                continue
            
            # Parse explanation
            if 'explanation' in line.lower():
                explanation = re.sub(r'^explanation[:\s]+', '', line, flags=re.IGNORECASE).strip()
        
        # Validate
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
