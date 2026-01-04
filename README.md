# Cirser (Circuit-Sense RAG)

**Cirser** is a deployable, secure, rule-grounded Electrical Engineering reasoning system with interactive simulation-level visualization. Unlike standard chatbots, Cirser does not hallucinate answers; it constructs solutions by retrieving formal engineering rules, validating them against constraints, and delegating computation to symbolic solvers.

**Live Demo**: [https://cirser.vercel.app](https://cirser.vercel.app)

---

## 🚀 Key Features

### 1. Rule-Grounded Reasoning
The system never "guesses". It enforces a strict pipeline:
- **Retrieval**: Fetches formal laws (KVL, Ohm's Law) from a vector database.
- **Planning**: The AI acts as an orchestrator, selecting the correct rule and variables.
- **Symbolic Solving**: Math is delegated to **SymPy**, ensuring 100% algebraic precision.

### 2. Premium 5-Stack UI
A glassmorphic, "Electric Dark" interface built with **React**, **Three.js**, and **Framer Motion**:
- **Simulation Stack**: 3D Visualization of circuit nodes.
- **Rule Stack**: Context-aware cards that appear when rules are applied.
- **Chat Stack**: Logic-aware conversation interface.
- **Control Stack**: real-time parameter tuning (Frequency, Voltage).

### 3. Enterprise-Grade Security
- **Authentication**: Full JWT-based Login/Signup system.
- **Protection**: All API endpoints are protected (guest access revoked).
- **Rate Limiting**:
    - Chat Endpoint: **20 req/min**
    - AI Proxy: **10 req/min** (Protects LLM Quota)

---

## 🏗️ System Architecture

The system is deployed using a decoupled **Microservices** pattern:

### **Frontend (Vercel)**
- **Tech**: React, Vite, TailwindCSS, Framer Motion, Three.js.
- **Role**: Handles UI, Auth State (JWT), and Visualization.
- **Security**: Routes are protected; unauthenticated users are redirected to Landing Page.

### **Backend (Render)**
- **Tech**: FastAPI, Python 3.10, PostgreSQL (via Render), ChromaDB (Embedded).
- **Role**:
    - **API Gateway**: manages Auth and Rate Limiting.
    - **RAG Engine**: Retrieves and ranks engineering rules.
    - **Internal AI Proxy**: Communicates with Hugging Face Inference API (Qwen-2.5-72B).
    - **Symbolic Engine**: Solves the math via SymPy.

---

## 🛠️ Local Development

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker (Optional)

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Set Environment Variables (see .env.example)
# DATABASE_URL=sqlite:///./sql_app.db
# HF_API_KEY=your_huggingface_key
uvicorn app.main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Running with Docker
```bash
docker-compose up --build
```

---

## 📦 Deployment Guide

### Backend (Render)
1.  Connect repository to **Render**.
2.  Select **Blueprint** or **Web Service (Docker)**.
3.  Set Environment Variables:
    - `HF_API_KEY`: Your Hugging Face Token.
    - `PORT`: `8000`.

### Frontend (Vercel)
1.  Connect repository to **Vercel**.
2.  Set Environment Variable:
    - `VITE_API_URL`: The URL of your rendered backend (e.g., `https://cirser.onrender.com/api/v1`).
3.  Deploy.

---

## 🔒 Security Compliance
- **No Chat History Memory**: Every request is reasoned about independently.
- **Rule-Grounding**: Every output cites a vetted source.
- **Input Sanitization**: All inputs are validated via Pydantic schemas.
