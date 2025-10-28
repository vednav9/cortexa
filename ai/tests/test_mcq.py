"""
Test MCQ Generation
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from mcq.generator import get_mcq_generator

def test_generate_from_topic():
    print("\n🧪 Testing MCQ Generation from Topic...")
    
    generator = get_mcq_generator()
    
    # Generate MCQs about Big Data
    mcqs = generator.generate_from_topic(
        topic="Big Data Analytics",
        num_questions=3,
        difficulty="medium"
    )
    
    print(f"\n✓ Generated {len(mcqs)} MCQs\n")
    
    for i, mcq in enumerate(mcqs, 1):
        print(f"Question {i}: {mcq['question']}")
        for letter, option in mcq['options'].items():
            print(f"  {letter}) {option}")
        print(f"  ✓ Correct Answer: {mcq['correct_answer']}")
        print(f"  📝 Explanation: {mcq['explanation']}\n")

if __name__ == "__main__":
    test_generate_from_topic()
