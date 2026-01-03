#!/bin/bash

# Kill ports 8000 and 5173 to ensure clean start
fuser -k 8000/tcp 2>/dev/null
fuser -k 5173/tcp 2>/dev/null

echo "--- 🚀 Launching Cirser Lite ---"

# 1. Check for AI URL
if [ -z "$AI_SERVICE_URL" ]; then
  echo "⚠️  WARNING: AI_SERVICE_URL is not set."
  echo "You should export AI_SERVICE_URL='http://your-ngrok.io' before running this script."
  echo "Using localhost placeholder..."
  export AI_SERVICE_URL="http://localhost:9999"
fi

# 2. Setup Backend Virtual Env
if [ ! -d "venv" ]; then
    echo "Creating Python Virtual Environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r backend/requirements.txt
else
    source venv/bin/activate
fi

# 3. Seed Database (Safe to run multiple times? IDs might conflict but it's dev)
echo "🌱 Seeding Knowledge Base..."
export PYTHONPATH=$PYTHONPATH:$(pwd)/backend
python backend/seed_rules.py

# 4. Start Backend in Background
echo "🔌 Starting Backend on Port 8000..."
cd backend
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# 5. Start Frontend
echo "🎨 Starting Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo "---"
echo "👉 Backend: http://localhost:8000/docs"
echo "👉 Frontend: http://localhost:5173"
echo "---"
echo "Press CTRL+C to stop everything."

# Wait
wait $BACKEND_PID $FRONTEND_PID
