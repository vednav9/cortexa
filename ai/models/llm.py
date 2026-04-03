"""
Language model for local text generation (CPU/GPU)
"""
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from config import LLM_MODEL, DEVICE, MODELS_DIR, MAX_NEW_TOKENS, TEMPERATURE, TOP_P

class LanguageModel:
    def __init__(self):
        print(f"Loading local language model: {LLM_MODEL} on {DEVICE}...")
        
        quantization_config = None
        if DEVICE == "cuda":
            try:
                quantization_config = BitsAndBytesConfig(load_in_8bit=True, llm_int8_threshold=6.0)
            except:
                pass
        
        self.tokenizer = AutoTokenizer.from_pretrained(
            LLM_MODEL,
            cache_dir=str(MODELS_DIR),
            trust_remote_code=True
        )
        
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
        print(f"✓ Local Language model loaded successfully!")
    
    def generate(
        self,
        prompt: str,
        max_new_tokens: int = MAX_NEW_TOKENS,
        temperature: float = TEMPERATURE,
        top_p: float = TOP_P
    ) -> str:
        """Generate text locally"""
        
        # 👉 THE FIX: TinyLlama requires strict Chat Templates. 
        # Without this, it loops infinitely and causes timeouts.
        is_chat = "chat" in LLM_MODEL.lower() or "instruct" in LLM_MODEL.lower()
        if is_chat:
            formatted_prompt = f"<|system|>\nYou are an expert educational AI that strictly follows instructions.</s>\n<|user|>\n{prompt}</s>\n<|assistant|>\n"
        else:
            formatted_prompt = prompt

        inputs = self.tokenizer(formatted_prompt, return_tensors="pt").to(self.model.device)
        
        print(f"🤖 Generating locally (up to {max_new_tokens} tokens). This may take 2-4 minutes on a free CPU Space...")
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                top_p=top_p,
                do_sample=True,
                pad_token_id=self.tokenizer.pad_token_id,
                eos_token_id=self.tokenizer.eos_token_id
            )
        
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
    global _llm_model
    if _llm_model is None:
        _llm_model = LanguageModel()
    return _llm_model