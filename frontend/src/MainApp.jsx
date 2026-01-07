import React, { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment, ContactShadows } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from './store/useStore'
import { Send, Cpu, Activity, Database, AlertCircle, RefreshCw, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Menu, X, Box, MessageSquare, RotateCw } from 'lucide-react';
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
// Re-Simulate Logic
const ThinkingProcess = ({ audit, steps }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { updateSimState } = useStore();

  // Helper to format values
  const formatValue = (val) => {
    if (typeof val === 'object' && val !== null) {
      return Object.entries(val).map(([k, v]) => <div key={k} className="ml-2">• <span className="font-semibold text-slate-400">{k}:</span> {v}</div>);
    }
    return val;
  };

  if (!audit && (!steps || steps.length === 0)) return null;

  const handleReSimulate = () => {
    // Logic to restore simulation from the saved plan
    // The plan is in 'audit' (which is the 'plan' from backend)

    // 1. Extract variables
    // This logic mimics the original handling in the main chat response
    let nodes = [];
    const variables = audit.variable || "";

    if (variables && variables.startsWith("EVAL")) {
      // Parse EVAL string: "EVAL, Z_c=0.833, Z_3=10"
      const parts = variables.replace("EVAL,", "").split(",");
      nodes = parts.map((p, i) => {
        const [key, val] = p.split("=").map(s => s.trim());
        if (!key) return null;
        return {
          id: `node-${i}`,
          label: key,
          value: val,
          type: 'resistor', // generic fallback
          position: [Math.cos(i) * 2, Math.sin(i) * 2, 0] // circular layout
        };
      }).filter(n => n);
    } else if (variables) {
      // Legacy or symbolic list handling
      const parts = variables.split(",");
      nodes = parts.map((key, i) => ({
        id: `node-${i}`,
        label: key.trim(),
        value: "?",
        type: 'impedance',
        position: [Math.cos(i) * 2, Math.sin(i) * 2, 0]
      }));
    }

    if (nodes.length > 0) {
      updateSimState({ nodes, branches: [], params: { equation: audit.equation } });
    }
  };

  return (
    <div className="mt-3 mb-2 rounded-lg overflow-hidden border border-white/10 bg-black/20">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 text-xs font-mono text-slate-400 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${audit ? 'bg-green-500' : 'bg-amber-500'}`} />
          <span>ENGINEERING PROCESS {audit?.action ? `[${audit.action}]` : ''}</span>
        </div>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 border-t border-white/10 text-xs space-y-3 bg-black/40">
              {/* Re-Simulate Button (Only if we have a plan) */}
              {audit && audit.variable && (
                <button
                  onClick={handleReSimulate}
                  className="w-full py-1.5 mb-2 bg-cyan-900/30 border border-cyan-500/30 text-cyan-400 rounded hover:bg-cyan-900/50 transition-colors flex items-center justify-center gap-2 font-bold"
                >
                  <RotateCw size={12} />
                  RE-SIMULATE 3D MODEL
                </button>
              )}

              {/* AUDIT: Definition */}
              {audit?.parameter_definition && (
                <div>
                  <span className="text-slate-500 block mb-1">DEFINITION</span>
                  <div className="text-cyan-300 bg-cyan-900/20 p-2 rounded border border-cyan-500/10">
                    {formatValue(audit.parameter_definition)}
                  </div>
                </div>
              )}

              {/* AUDIT: Physics */}
              {audit?.physical_interpretation && (
                <div>
                  <span className="text-slate-500 block mb-1">PHYSICAL INTERPRETATION</span>
                  <div className="text-slate-300">{audit.physical_interpretation}</div>
                </div>
              )}

              {/* AUDIT: Rule Check */}
              {audit?.applicability_check && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-500">RULE CHECK</span>
                    {audit.applicability_check.conditions_met ?
                      <span className="text-green-400 flex items-center gap-1"><CheckCircle2 size={10} /> PASS</span> :
                      <span className="text-red-400 flex items-center gap-1"><AlertTriangle size={10} /> FAIL</span>
                    }
                  </div>
                  <div className="text-slate-400 italic border-l-2 border-slate-700 pl-2">
                    "{audit.applicability_check.justification}"
                  </div>
                </div>
              )}

              {/* STEPS TRACE */}
              {steps && steps.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/5">
                  <span className="text-slate-500 block mb-2">DERIVATION STEPS</span>
                  <div className="space-y-2">
                    {steps.map((step, idx) => (
                      <div key={idx} className="relative pl-3 border-l border-slate-800">
                        <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-slate-800" />
                        <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold">
                          <span>{step.phase}</span>
                          {step.rule_id && <span>{step.rule_id.slice(0, 8)}</span>}
                        </div>
                        <div className="text-slate-300">{step.thought}</div>
                        {step.equation && step.phase !== 'EXECUTION' && (
                          <code className="block mt-1 bg-black/50 p-1 rounded text-amber-400 font-mono">
                            {step.equation}
                          </code>
                        )}
                        {step.result && (
                          <div className="mt-1 text-green-400 font-bold">
                            → {step.result}
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
};
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
                {/* Preprocess logic: Ensure LaTeX blocks are dollar-wrapped */}
                {(() => {
                  if (!m.content) return "";
                  // 1. Fix standard LaTeX block/inline delimiters to Dollar signs for remark-math
                  let processed = m.content
                    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$1$$') // \[ ... \] -> $$ ... $$
                    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$'); // \( ... \) -> $ ... $

                  // 2. Heuristic: Wrap common naked math commands if they aren't already wrapped
                  // This is aggressive but needed if AI just outputs "\frac{1}{2}"
                  // Look for backslash followed by command, not inside $
                  // (Simpler approach: Just rely on delimiters first. If user wants aggressive, we add more).
                  // For now, let's just clean newlines in equations.
                  return processed;
                })()}
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
                <button
                  onClick={() => { navigate('/history'); setIsOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Clock size={14} /> Mission Logs
                </button>
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
  const [mobileView, setMobileView] = useState('chat'); // 'chat' | 'sim'
  const simNodes = useStore(s => s.simState.nodes || []);

  return (
    <div className="w-screen h-screen relative bg-[#030712] text-white overflow-hidden font-sans selection:bg-cyan-500/30">

      {/* 3D Background Layer */}
      <SimulationStack />

      {/* Foreground UI Layer */}
      <div className={`absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-end transition-opacity duration-500 ${mobileView === 'sim' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {/* Top Layer is managed absolute by RuleStack */}
        <UserMenu />
        <RuleStack />

        {/* Bottom Layer: Main Interaction Zone */}
        {/* Mobile: Full Height. Desktop: 40vh */}
        <div className={`flex flex-col md:flex-row gap-4 md:gap-6 items-stretch md:items-end pointer-events-auto pb-6 md:pb-0 transition-all duration-300
            ${mobileView === 'chat' ? 'h-[90vh] md:h-[40vh]' : 'h-0 md:h-[40vh] overflow-hidden'}
        `}>
          {/* Chat takes majority */}
          <div className="flex-1 md:flex-[2] h-full min-h-0">
            <ChatInterface />
          </div>

          {/* Controls takes minority */}
          <div className="flex-none md:flex-1 h-auto md:h-3/4 min-h-0 hidden md:block">
            <ControlStack />
          </div>
        </div>
      </div>

      {/* Mobile Simulation Controls Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none md:hidden p-6 flex flex-col justify-end">
        {/* If in Chat Mode & Sim Exists -> Show 'View Sim' Button */}
        {mobileView === 'chat' && simNodes.length > 0 && (
          <div className="absolute bottom-24 right-6 pointer-events-auto">
            <button
              onClick={() => setMobileView('sim')}
              className="bg-cyan-500 text-black font-bold p-4 rounded-full shadow-lg shadow-cyan-500/40 animate-bounce flex items-center gap-2"
            >
              <Zap size={20} fill="black" />
              <span>View 3D</span>
            </button>
          </div>
        )}

        {/* If in Sim Mode -> Show 'Back' Button */}
        {mobileView === 'sim' && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-auto">
            <button
              onClick={() => setMobileView('chat')}
              className="glass-button px-6 py-3 rounded-full flex items-center gap-2 text-white border-2 border-cyan-500/50 hover:bg-cyan-500/10 backdrop-blur-md"
            >
              <ChevronRight className="rotate-180" size={20} />
              <span>Back to Reasoning</span>
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
