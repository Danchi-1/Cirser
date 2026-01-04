import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import useStore from './store/useStore'
import { Send, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import axios from 'axios'

// --- 1. Simulation Stack (The 3D World) ---
function SimulationStack() {
  const { simState } = useStore()

  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
        <color attach="background" args={['#0f172a']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Grid infiniteGrid sectionColor="#1e293b" cellColor="#0f172a" fadeDistance={30} />
        <OrbitControls makeDefault />

        {/* Render Nodes (Placeholder visualization) */}
        {simState.nodes && simState.nodes.map((node, i) => (
          <mesh key={i} position={[i * 2, 0, 0]}>
            <sphereGeometry args={[0.2]} />
            <meshStandardMaterial color="#38bdf8" />
          </mesh>
        ))}
      </Canvas>
    </div>
  )
}

// --- 2. Rule Stack (Top Right Overlay) ---
function RuleStack() {
  const { activeRules } = useStore()
  if (activeRules.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 z-10 w-96 space-y-2">
      {activeRules.map((rule) => (
        <div key={rule.rule_id} className="bg-cirser-panel/90 backdrop-blur border border-cirser-accent/30 p-4 rounded shadow-lg text-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-cirser-success" />
            <h3 className="font-bold text-cirser-accent">{rule.rule_name}</h3>
          </div>
          <p className="opacity-80 mb-2">{rule.formal_definition}</p>
          <div className="text-xs opacity-50 border-t border-gray-700 pt-2 flex justify-between">
            <span>ID: {rule.rule_id}</span>
            <span>{rule.source.title}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// --- 3. Parameter Stack (Bottom Control Panel) ---
function ParameterStack() {
  const { simState, updateSimState } = useStore()

  // Mock handler
  const handleChange = (key, val) => {
    // Here we would call API to validate
    console.log("Param changed", key, val)
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 h-48 bg-cirser-panel border-t border-gray-700 z-20 p-4 flex gap-8">
      <div className="w-1/3">
        <h4 className="text-xs uppercase tracking-wider text-gray-400 mb-4">Chat Interface</h4>
        <ChatInterface />
      </div>
      <div className="w-2/3">
        <h4 className="text-xs uppercase tracking-wider text-gray-400 mb-4">System Parameters</h4>
        <div className="grid grid-cols-2 gap-4">
          {/* Dynamic Sliders based on State */}
          <div className="flex flex-col gap-1">
            <label className="text-xs">Frequency (Hz)</label>
            <input type="range" className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Chat Interface Sub-Component ---
function ChatInterface() {
  const { messages, addMessage, setActiveRules } = useStore();
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    addMessage(userMsg);
    setInput("");

    // Mock API Call (Replace with Real Axois)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
      const res = await axios.post(`${API_URL}/chat/message`, { message: input });

      if (res.data.status === 'success') {
        const plan = res.data.plan;
        addMessage({
          role: 'assistant',
          content: plan.action === 'solve_symbolic'
            ? `Solved: ${res.data.result}`
            : plan.thought
        });

        if (res.data.candidates) {
          setActiveRules(res.data.candidates);
        }
      } else {
        addMessage({ role: 'assistant', content: "Error: " + res.data.message });
      }
    } catch (e) {
      addMessage({ role: 'assistant', content: "System connection failed." });
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto mb-2 space-y-2 text-sm pr-2">
        {messages.map((m, i) => (
          <div key={i} className={`${m.role === 'user' ? 'text-right text-cirser-accent' : 'text-left text-gray-300'}`}>
            {m.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-cirser-accent"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Enter circuit problem..."
        />
        <button onClick={handleSend} className="p-1 bg-cirser-accent text-black rounded hover:bg-opacity-80">
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}

// --- Main Layout ---
export default function App() {
  return (
    <div className="w-screen h-screen bg-cirser-dark text-white overflow-hidden relative font-sans">
      <SimulationStack />
      <RuleStack />
      <ParameterStack />

      {/* Validation Stack (Toast) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
        {/* <div className="bg-cirser-danger text-white px-4 py-2 rounded shadow-lg flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>KCL Violation at Node 2</span>
         </div> */}
      </div>
    </div>
  )
}
