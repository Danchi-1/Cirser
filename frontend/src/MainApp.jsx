import React, { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment, ContactShadows } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from './store/useStore'
import {
  Send, Activity, BookOpen, Settings, AlertCircle,
  Cpu, Zap, X, ChevronRight, Play, RefreshCw
} from 'lucide-react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

// --- 1. Simulation Stack (The 3D World) ---
function SimulationStack() {
  const { simState } = useStore()

  return (
    <div className="absolute inset-0 z-0 bg-[#030712] bg-grid-pattern">
      <Canvas camera={{ position: [6, 4, 8], fov: 45 }}>
        <fog attach="fog" args={['#030712', 10, 30]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#38bdf8" />
        <pointLight position={[-10, -5, -10]} intensity={0.5} color="#8b5cf6" />

        <Grid
          infiniteGrid
          cellColor="#1e293b"
          sectionColor="#334155"
          fadeDistance={40}
          cellSize={1}
          sectionSize={5}
        />

        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />

        {/* Placeholder Nodes with Glow */}
        <group>
          {simState.nodes && simState.nodes.map((node, i) => (
            <mesh key={i} position={[i * 3 - 3, 0.5, 0]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial
                color="#0ea5e9"
                emissive="#0ea5e9"
                emissiveIntensity={0.5}
                roughness={0.2}
                metalness={0.8}
              />
            </mesh>
          ))}

          {/* Central "Chip" Representation if empty */}
          {!simState.nodes?.length && (
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[2, 0.2, 2]} />
              <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
            </mesh>
          )}
        </group>

        <ContactShadows opacity={0.5} scale={20} blur={2} far={4.5} />
      </Canvas>

      {/* Title Overlay */}
      <div className="absolute top-6 left-6 pointer-events-none">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Cirser" className="w-10 h-10 object-contain" />
          <h1 className="text-4xl font-mono font-bold text-white tracking-tighter">
            CIRSER
          </h1>
        </div>
        <p className="text-cyan-200/50 text-sm font-mono mt-1 ml-1">AI-POWERED REASONING ENGINE</p>
      </div>
    </div>
  )
}

// --- 2. Rule Stack (Context Aware Panel) ---
function RuleStack() {
  const { activeRules } = useStore()

  return (
    <div className="absolute top-6 right-6 z-10 w-96 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {activeRules.map((rule) => (
          <motion.div
            key={rule.rule_id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glass-panel p-5 rounded-xl pointer-events-auto border-l-4 border-l-emerald-500"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                ACTIVE RULE
              </span>
              <span className="text-xs text-slate-400 font-mono">{rule.rule_id}</span>
            </div>
            <h3 className="font-bold text-white text-lg leading-tight mb-2">{rule.rule_name}</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{rule.formal_definition}</p>

            <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-slate-500">
              <BookOpen size={12} />
              <span>{rule.source.title}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// --- 3. Chat Interface (Bottom Left) ---
function ChatInterface() {
  const { messages, addMessage, setActiveRules, token } = useStore();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input };
    addMessage(userMsg);
    setInput("");
    setIsLoading(true);

    try {
      // Use deployed URL or local fallback
      const API_URL = import.meta.env.VITE_API_URL || 'https://cirser.onrender.com/api/v1';

      const res = await axios.post(
        `${API_URL}/chat/message`,
        { message: userMsg.content },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status === 'success') {
        const plan = res.data.plan;

        addMessage({
          role: 'assistant',
          content: plan.action === 'SOLVE_SYMBOLIC'
            ? `${plan.thought}\n\n**Equation:** $${plan.equation}$\n\n**Result:** $${res.data.result}$`
            : plan.thought
        });

        if (res.data.candidates) {
          setActiveRules(res.data.candidates);
        }
      } else {
        addMessage({ role: 'assistant', content: "Error: " + res.data.message });
      }
    } catch (e) {
      console.error(e);
      addMessage({ role: 'assistant', content: "Connection failed. Please check backend status." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="glass-panel w-full h-full rounded-2xl flex flex-col overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 opacity-50">
            <Cpu size={32} />
            <p className="text-sm font-mono">AWAITING INPUT</p>
          </div>
        )}

        {messages.map((m, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user'
              ? 'bg-cyan-600/20 border border-cyan-500/30 text-cyan-50 rounded-br-none'
              : 'bg-slate-800/50 border border-slate-700 text-slate-200 rounded-bl-none'
              }`}>
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                className="prose prose-invert prose-sm max-w-none"
              >
                {m.content}
              </ReactMarkdown>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/50 p-2 px-4 rounded-full flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-black/20 border-t border-white/5 flex gap-2">
        <input
          className="glass-input flex-1 rounded-xl px-4 py-2.5 text-sm font-sans placeholder-slate-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Describe a circuit problem..."
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading}
          className="bg-cyan-500 hover:bg-cyan-400 text-black p-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  )
}

// --- 4. Controls Stack (Bottom Right) ---
function ControlStack() {
  return (
    <div className="glass-panel w-full h-full rounded-2xl p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-6 text-slate-300 border-b border-white/5 pb-2">
        <Settings size={16} />
        <h3 className="text-xs font-bold uppercase tracking-wider">Parameters</h3>
      </div>

      <div className="space-y-6 flex-1">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <label className="text-slate-400">Frequency</label>
            <span className="font-mono text-cyan-400">60 Hz</span>
          </div>
          <input type="range" className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <label className="text-slate-400">Voltage Source</label>
            <span className="font-mono text-purple-400">12 V</span>
          </div>
          <input type="range" className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
        </div>
      </div>

      <div className="mt-auto">
        <button className="glass-button w-full py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium">
          <Play size={14} />
          Run Simulation
        </button>
      </div>
    </div>
  )
}

// --- Main Layout ---
export default function MainApp() {
  return (
    <div className="w-screen h-screen relative bg-[#030712] text-white overflow-hidden font-sans selection:bg-cyan-500/30">

      {/* 3D Background Layer */}
      <SimulationStack />

      {/* Foreground UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-end">
        {/* Top Layer is managed absolute by RuleStack */}
        <RuleStack />

        {/* Bottom Layer: Main Interaction Zone */}
        <div className="flex gap-6 h-[40vh] items-end pointer-events-auto">
          {/* Chat takes majority */}
          <div className="flex-[2] h-full">
            <ChatInterface />
          </div>

          {/* Controls takes minority */}
          <div className="flex-1 h-3/4">
            <ControlStack />
          </div>
        </div>
      </div>

    </div>
  )
}
