import React, { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment, ContactShadows } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from './store/useStore'
import {
  Send, Activity, BookOpen, Settings, AlertCircle,
  Cpu, Zap, X, ChevronRight, Play, RefreshCw, User, LogOut
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
            <mesh key={i} position={node.position || [i * 3 - 3, 0.5, 0]}>
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
      <div className="absolute top-6 left-6 pointer-events-none z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)] bg-black/20 backdrop-blur-sm">
            <img src="/logo.png" alt="Cirser" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl md:text-4xl font-mono font-bold text-white tracking-tighter drop-shadow-lg">
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
    <div className="absolute top-20 right-6 z-10 w-96 flex flex-col gap-3 pointer-events-none">
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

// --- 2.5 Thinking Process (Collapsible) ---
function ThinkingProcess({ audit, steps }) {
  const [isOpen, setIsOpen] = useState(false);

  // Helper to format values
  const formatValue = (val) => {
    if (typeof val === 'object' && val !== null) {
      return Object.entries(val).map(([k, v]) => <div key={k} className="ml-2">• <span className="font-semibold text-slate-400">{k}:</span> {v}</div>);
    }
    return val;
  };

  if (!audit && (!steps || steps.length === 0)) return null;

  return (
    <div className="mb-4 rounded-xl overflow-hidden border border-cyan-500/20 bg-cyan-950/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-xs font-mono text-cyan-400 hover:bg-cyan-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity size={14} />
          <span>ENGINEERING PROCESS</span>
        </div>
        <ChevronRight size={14} className={`transition-transformDuration-200 ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 text-sm space-y-4 border-t border-cyan-500/20">
              {/* Audit Phase */}
              {audit && (audit.parameter_definition || audit.applicability_check) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phase 1: Definition & Rules</h4>
                  <div className="bg-black/20 p-3 rounded-lg border border-white/5 space-y-2">
                    {audit.parameter_definition && (
                      <div><span className="text-cyan-200 font-mono text-xs">DEF:</span> <span className="text-slate-300">{formatValue(audit.parameter_definition)}</span></div>
                    )}
                    {audit.physical_interpretation && (
                      <div><span className="text-cyan-200 font-mono text-xs">PHY:</span> <span className="text-slate-300">{formatValue(audit.physical_interpretation)}</span></div>
                    )}
                    {audit.applicability_check && (
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2 text-xs">
                          <span className={audit.applicability_check.conditions_met ? "text-emerald-400" : "text-red-400"}>
                            {audit.applicability_check.conditions_met ? "✔ RULES MET" : "❌ RULES VIOLATED"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Steps Phase */}
              {steps && steps.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phase 2-3: Derivation</h4>
                  <div className="space-y-2">
                    {steps.map((step, idx) => (
                      <div key={idx} className="bg-black/20 p-3 rounded-lg border border-white/5">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-mono text-slate-500">STEP {step.step} ({step.phase})</span>
                        </div>
                        <p className="text-slate-300 mb-2">{step.thought}</p>
                        {step.equation && step.result && (
                          <div className="font-mono text-xs bg-black/40 p-2 rounded text-cyan-100 overflow-x-auto">
                            {step.equation} = {step.result}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
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

        // --- VISUALIZATION BRIDGE ---
        // Extract entities to visualize from the plan
        // 1. From Variables (e.g. "EVAL, Z_a=10")
        const newNodes = [];

        if (plan.variable && plan.variable.startsWith("EVAL")) {
          // Parse "EVAL, var=val, var2=val2"
          const pairs = plan.variable.replace("EVAL", "").split(",").map(s => s.trim()).filter(s => s);
          pairs.forEach((p, i) => {
            const [k, v] = p.split("=");
            if (k) newNodes.push({ id: k, val: v });
          });
        }

        // 2. From Parameter Definition (e.g. "Z11")
        if (plan.parameter_definition) {
          if (typeof plan.parameter_definition === 'object') {
            Object.keys(plan.parameter_definition).forEach(k => {
              if (!newNodes.find(n => n.id === k)) newNodes.push({ id: k, val: '?' });
            });
          }
        }

        // Update Simulation State if we found anything
        if (newNodes.length > 0) {
          useStore.getState().updateSimState({
            nodes: newNodes.map((n, i) => ({
              id: n.id,
              position: [(i - newNodes.length / 2) * 2, 0.5, 0], // Spread them out
              type: 'component',
              value: n.val
            })),
            branches: [],
            params: {}
          });
        }

        const finalContent = plan.thought || "Analysis complete.";

        // Pass structured data to the UI components
        addMessage({
          role: 'assistant',
          content: finalContent,
          audit: plan,
          steps: res.data.reasoning_steps
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

              {/* Engineering Process Collapsible */}
              {m.role === 'assistant' && (
                <ThinkingProcess audit={m.audit} steps={m.steps} />
              )}

              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 break-words"
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

// --- 5. Header / User Menu (Top Right) ---
function UserMenu() {
  const { logout, token, user, fetchUser } = useStore()
  const [isOpen, setIsOpen] = useState(false)

  // Fetch user on mount if we have a token but no user data
  useEffect(() => {
    if (token && !user) {
      fetchUser();
    }
  }, [token, user]);

  if (!token) return null;

  return (
    <div className="absolute top-6 right-6 z-50 pointer-events-auto">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20 hover:scale-105 transition-transform"
        >
          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-xs text-cyan-400">
            {user ? (user.full_name ? user.full_name[0].toUpperCase() : user.email[0].toUpperCase()) : <User size={20} />}
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden"
            >
              <div className="p-3 border-b border-white/5">
                <p className="text-xs text-slate-500 font-mono uppercase">Signed In As</p>
                <p className="text-sm font-bold text-white truncate">{user ? (user.full_name || user.email) : 'Loading...'}</p>
              </div>
              <div className="p-1">
                <button className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors">
                  <User size={14} /> Profile
                </button>
                <button
                  onClick={() => { logout(); setIsOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
        <UserMenu />
        <RuleStack />

        {/* Bottom Layer: Main Interaction Zone */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-[75vh] md:h-[40vh] items-stretch md:items-end pointer-events-auto pb-6 md:pb-0">
          {/* Chat takes majority */}
          <div className="flex-1 md:flex-[2] h-1/2 md:h-full min-h-0">
            <ChatInterface />
          </div>

          {/* Controls takes minority */}
          <div className="flex-none md:flex-1 h-auto md:h-3/4 min-h-0">
            <ControlStack />
          </div>
        </div>
      </div>

    </div>
  )
}
