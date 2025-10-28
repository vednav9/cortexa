"""
MCQ Validator and Scorer
"""
from typing import List, Dict

class MCQValidator:
    
    @staticmethod
    def validate_mcq(mcq: Dict) -> bool:
        """
        Validate if MCQ has all required fields
        
        Args:
            mcq: MCQ dictionary
            
        Returns:
            True if valid, False otherwise
        """
        required_fields = ['question', 'options', 'correct_answer']
        
        # Check required fields
        if not all(field in mcq for field in required_fields):
            return False
        
        # Check options
        if not isinstance(mcq['options'], dict):
            return False
        
        if len(mcq['options']) < 2:
            return False
        
        # Check correct answer
        if mcq['correct_answer'] not in mcq['options']:
            return False
        
        return True
    
    @staticmethod
    def score_answers(
        mcqs: List[Dict],
        user_answers: Dict[int, str]
    ) -> Dict:
        """
        Score user answers
        
        Args:
            mcqs: List of MCQs
            user_answers: Dict mapping question index to user's answer
            
        Returns:
            Scoring result dictionary
        """
        total_questions = len(mcqs)
        correct_count = 0
        results = []
        
        for i, mcq in enumerate(mcqs):
            user_answer = user_answers.get(i)
            correct_answer = mcq['correct_answer']
            is_correct = user_answer == correct_answer
            
            if is_correct:
                correct_count += 1
            
            results.append({
                'question_index': i,
                'question': mcq['question'],
                'user_answer': user_answer,
                'correct_answer': correct_answer,
                'is_correct': is_correct,
                'explanation': mcq.get('explanation', '')
            })
        
        score_percentage = (correct_count / total_questions * 100) if total_questions > 0 else 0
        
        return {
            'total_questions': total_questions,
            'correct_answers': correct_count,
            'incorrect_answers': total_questions - correct_count,
            'score_percentage': round(score_percentage, 2),
            'grade': MCQValidator._calculate_grade(score_percentage),
            'results': results
        }
    
    @staticmethod
    def _calculate_grade(score: float) -> str:
        """Calculate letter grade from score"""
        if score >= 90:
            return 'A+'
        elif score >= 80:
            return 'A'
        elif score >= 70:
            return 'B'
        elif score >= 60:
            return 'C'
        elif score >= 50:
            return 'D'
        else:
            return 'F'
