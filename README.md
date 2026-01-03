# Cirser (Circuit-Sense RAG)

**Cirser** is a deployable, secure, rule-grounded Electrical Engineering reasoning system with interactive simulation-level visualization. Unlike standard chatbots, Cirser does not hallucinate answers; it constructs solutions by retrieving formal engineering rules, validating them against constraints, and delegating computation to symbolic solvers.

## System Architecture

The system operates on a strict **Microservices Architecture** with a **5-Stack Frontend** and an **Isolated Inference Engine**.

### 1. The Reasoning Core (Backend)
The backend is not a black box. It enforces a mandatory 6-stage pipeline for every user request:
1.  **Problem Classification**: Determines the domain (e.g., Linear Circuit Theory, Two-Port Networks).
2.  **RAG Retrieval**: Retrieves formal rules (candidates) from the Vector Database based on semantic checking.
3.  **Rule Selection (Agentic)**: The AI Agent selects the single best-fitting rule, citing its source (book/section) and justifying why it applies over others.
4.  **Equation Construction**: Symbolic equations are extracted from the rule definition.
5.  **Delegated Solving**: The system uses a strict Symbolic Math Engine (SymPy) to solve equations. **The LLM never performs math.**
6.  **Validation**: Results are checked for physical feasibility (e.g., Passivity, Linearity) before return.

### 2. The 5-Stack Frontend
The user interface is strictly strictly layered to separate concerns:
1.  **Simulation Stack**: WebGL/Three.js physics rendering (Node voltages, Branch currents).
2.  **Rule Stack**: Displays the specific engineering rule currently governing the simulation state.
3.  **Parameter Stack**: Control surfaces for component values ($R$, $L$, $C$). Changes trigger real-time backend validation.
4.  **Inspector Stack**: Precise numeric introspection of nodes and ports.
5.  **Validation Stack**: Visual error states (e.g., Red flash on KCL violation).

### 3. Isolated AI Inference
To ensure security and auditability:
- The AI Model (e.g., Qwen-2.5-7B, DeepSeek-Coder) is hosted in a completely separate environment (e.g., Google Colab T4 Node).
- The Main Backend communicates with the AI service via a secured ephemeral tunnel.
- The AI Service has no direct access to the frontend or user database.

## Security & compliance
Designed for professional audit:
- **No Chat History Memory**: Every request is reasoned about independently to prevent context poisoning.
- **Rule-Grounding**: Every output must cite a governing rule from the vetted knowledge base.
- **Safe Math**: `eval()` is strictly banned. Math is parsed via a restricted Abstract Syntax Tree (AST).

---

## Local Development (Lite Mode)

For development and testing without a full container orchestration cluster, Cirser runs in **Lite Mode**.
This uses **SQLite** and **Embedded ChromaDB** to run entirely on the host machine.

### Prerequisites
1.  **Python 3.10+**
2.  **Node.js 18+**
3.  **Google Colab Account** (For the AI Brain)

### Quick Start
1.  **Start the Brain**:
    - Open the [Cirser Brain Notebook](ai_service/colab_node.py) in Google Colab.
    - Run it and copy the public Ngrok URL (e.g., `http://xyz.ngrok-free.app`).

2.  **Launch the System**:
    ```bash
    # From the project root
    export AI_SERVICE_URL="http://your-ngrok-url..."
    ./start_lite.sh
    ```

3.  **Access**:
    - Frontend: `http://localhost:5173`
    - Backend API: `http://localhost:8000/docs`

The script will automatically set up the virtual environment, seed the rule database, and start the servers.
