"""
Language model for local text generation (CPU/GPU)
"""
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from config import LLM_MODEL, DEVICE, MODELS_DIR, MAX_NEW_TOKENS, TEMPERATURE, TOP_P

class LanguageModel:
    def __init__(self):
        print(f"Loading language model: {LLM_MODEL}")
        
        quantization_config = None
        if DEVICE == "cuda":
            try:
                quantization_config = BitsAndBytesConfig(load_in_8bit=True, llm_int8_threshold=6.0)
            except:
                pass
        
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

        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        

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

        print(f"✓ Local Language model loaded successfully!")

    
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
            max_length=768,  # cap input; single-MCQ prompts are <512 tokens
        ).to(self.model.device)

        inputs = self.tokenizer(formatted_prompt, return_tensors="pt").to(self.model.device)
        
        print(f"🤖 Generating locally (up to {max_new_tokens} tokens). This may take 2-4 minutes on a free CPU Space...")
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                max_length=None,
                do_sample=False,          # greedy — ~3x faster than sampling
                pad_token_id=self.tokenizer.pad_token_id,
                eos_token_id=self.tokenizer.eos_token_id
            )

        # Decode only the newly generated tokens (skip input)
        input_len = inputs["input_ids"].shape[1]
        generated_ids = outputs[0][input_len:]
        generated_text = self.tokenizer.decode(generated_ids, skip_special_tokens=True)
        return generated_text.strip()
        
        generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Clean up the output to return ONLY the generated MCQs
        clean_input = self.tokenizer.decode(inputs['input_ids'][0], skip_special_tokens=True)
        if generated_text.startswith(clean_input):
            generated_text = generated_text[len(clean_input):].strip()
            
        if "<|assistant|>" in generated_text:
            generated_text = generated_text.split("<|assistant|>")[-1].strip()
            
        return generated_text

# Singleton instance
_llm_model = None

def get_llm_model() -> LanguageModel:
    """Get or create LLM instance"""
    global _llm_model
    if _llm_model is None:
        _llm_model = LanguageModel()
    return _llm_model

    global _llm_model
    if _llm_model is None:
        _llm_model = LanguageModel()
    return _llm_model

