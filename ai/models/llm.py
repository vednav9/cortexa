"""
Language model for text generation
"""
import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    pipeline
)
from typing import Optional
from config import LLM_MODEL, DEVICE, MODELS_DIR, MAX_NEW_TOKENS, TEMPERATURE, TOP_P

class LanguageModel:
    def __init__(self):
        print(f"Loading language model: {LLM_MODEL}")
        
        # Quantization config for GPU (optional, only if you want smaller models)
        quantization_config = None
        
        # Only use quantization if on GPU
        if DEVICE == "cuda":
            try:
                # Try 8-bit quantization (recommended)
                quantization_config = BitsAndBytesConfig(
                    load_in_8bit=True,
                    llm_int8_threshold=6.0
                )
                print("Using 8-bit quantization")
            except:
                print("8-bit quantization not available, using full precision")
        
        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(
            LLM_MODEL,
            cache_dir=str(MODELS_DIR),
            trust_remote_code=True
        )
        
        # Set pad token if not set
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        
        # Load model
        self.model = AutoModelForCausalLM.from_pretrained(
            LLM_MODEL,
            cache_dir=str(MODELS_DIR),
            quantization_config=quantization_config,
            device_map="auto" if DEVICE == "cuda" else None,
            torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
            trust_remote_code=True
        )
        
        if DEVICE == "cpu":
            self.model = self.model.to(DEVICE)
        
        self.model.eval()
        print(f"✓ Language model loaded on {DEVICE}")
    
    def generate(
        self,
        prompt: str,
        max_new_tokens: int = 150,
        temperature: float = TEMPERATURE,
        top_p: float = TOP_P
    ) -> str:
        """
        Generate text from prompt using greedy decoding for speed.
        """
        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=1024,  # cap input to avoid OOM and slow processing
        ).to(self.model.device)

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=False,          # greedy — ~3x faster than sampling
                pad_token_id=self.tokenizer.pad_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
                repetition_penalty=1.1,   # avoid repetition loops
            )

        # Decode only the newly generated tokens (skip input)
        input_len = inputs["input_ids"].shape[1]
        generated_ids = outputs[0][input_len:]
        generated_text = self.tokenizer.decode(generated_ids, skip_special_tokens=True)
        return generated_text.strip()

# Singleton instance
_llm_model = None

def get_llm_model() -> LanguageModel:
    """Get or create LLM instance"""
    global _llm_model
    if _llm_model is None:
        _llm_model = LanguageModel()
    return _llm_model
