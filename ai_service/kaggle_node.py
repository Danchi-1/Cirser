# Cirser Brain - Remote Inference Node on Kaggle

# 1. Install Dependencies
!pip install -q fastapi uvicorn pyngrok nest_asyncio torch transformers accelerate

# 2. Authenticate ngrok (User must provide token)
# from pyngrok import ngrok
# ngrok.set_auth_token("YOUR_NGROK_TOKEN_HERE")

# 3. Model Setup (DeepSeek Coder V2 Lite - Fits in T4 GPU)
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline

model_id = "deepseek-ai/deepseek-coder-6.7b-instruct" # Using 6.7b as a proxy for 'Lite' if V2 unavailable, or Qwen2.5-7B-Instruct
# Note: For Kaggle T4 x2, we can run larger models, but let's stick to safe bets.
# To fit in 16GB VRAM, we might need 4-bit quantization or smaller model.
# Let's use Qwen2.5-7B-Instruct for high performance/weight ratio.

MODEL_NAME = "Qwen/Qwen2.5-7B-Instruct"

print(f"Loading {MODEL_NAME}...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    device_map="auto",
    torch_dtype=torch.float16,
    trust_remote_code=True
)

pipe = pipeline("text-generation", model=model, tokenizer=tokenizer)

# 4. Define API
from fastapi import FastAPI, Request
from pydantic import BaseModel
import uvicorn
import nest_asyncio

app = FastAPI()

class InferenceRequest(BaseModel):
    messages: list
    tools: list = None

@app.post("/v1/chat/completions")
async def chat(req: InferenceRequest):
    # Convert tools to system prompt description if strictly necessary, 
    # but Qwen/DeepSeek often support tool calling or we structure it in backend.
    # For now, simplistic generation.
    
    # We will let the Main Backend handle prompt engineering for tools, 
    # and just treat this as a raw completion engine if needed, 
    # OR we implement a simple apply_chat_template here.
    
    prompt = tokenizer.apply_chat_template(req.messages, tokenize=False, add_generation_prompt=True)
    
    outputs = pipe(
        prompt,
        max_new_tokens=512,
        do_sample=True,
        temperature=0.1, # Low temp for reasoning
        top_p=0.9
    )
    
    generated_text = outputs[0]["generated_text"][len(prompt):]
    
    return {
        "choices": [
            {
                "message": {
                    "role": "assistant",
                    "content": generated_text
                }
            }
        ]
    }

# 5. Run Server
import uvicorn
from pyngrok import ngrok
import nest_asyncio

# Open a ngrok tunnel to the HTTP server
public_url = ngrok.connect(8000).public_url
print(f"🚀 Cirser Brain Deployed at: {public_url}")

nest_asyncio.apply()
uvicorn.run(app, port=8000)
