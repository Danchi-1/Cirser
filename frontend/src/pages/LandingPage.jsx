import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Brain, Shield, ArrowRight, Cpu, Layers, Activity } from 'lucide-react';
import useStore from '../store/useStore';

export default function LandingPage() {
    const { token } = useStore();

    return (
        <div className="min-h-screen bg-[#030712] text-white font-sans selection:bg-cyan-500/30 overflow-x-hidden relative">

            {/* Background Ambience */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Navigation */}
            <nav className="relative z-10 flex flex-col md:flex-row items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto gap-4 md:gap-0">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Cirser Logo" className="w-8 h-8 object-contain" />
                    <span className="text-xl font-bold tracking-tight">CIRSER</span>
                </div>
                <div className="flex flex-wrap justify-center items-center gap-6">
                    <Link to="/about" className="text-sm text-slate-400 hover:text-white transition-colors">How it Works</Link>
                    <a href="https://github.com/Danchi-1/Cirser" target="_blank" className="text-sm text-slate-400 hover:text-white transition-colors">GitHub</a>
                    <Link to={token ? "/workspace" : "/login"}>
                        <button className="glass-button px-4 py-2 rounded-lg text-sm font-medium">
                            {token ? "Launch App" : "Login"}
                        </button>
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 md:pt-32 md:px-12 flex flex-col md:flex-row items-center">

                {/* Left Content */}
                <div className="flex-1 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-4"
                    >
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        V1.0 NOW LIVE
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight leading-tight"
                    >
                        Engineering Logic, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">
                            Not Hallucination.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-lg text-slate-400 max-w-xl leading-relaxed"
                    >
                        Cirser is an AI reasoning engine grounded in formal electrical engineering rules.
                        It doesn't guess equations—it retrieves them from verified textbooks,
                        validates constraints, and solves them symbolically.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 pt-4"
                    >
                        <Link to={token ? "/workspace" : "/signup"}>
                            <button className="group bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                                {token ? "Enter Workspace" : "Start Solving"}
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </Link>

                        <Link to="/about">
                            <button className="px-8 py-4 rounded-xl font-medium border border-slate-700 hover:bg-slate-800 transition-colors text-slate-300">
                                Read the Docs
                            </button>
                        </Link>
                    </motion.div>
                </div>

                {/* Right Visual (Abstract Circuit/Rule Visualization) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="flex-1 w-full mt-20 md:mt-0 relative"
                >
                    <div className="relative z-10 glass-panel p-6 rounded-2xl border border-slate-700/50 transform md:rotate-[-5deg] md:translate-x-10 hover:rotate-0 transition-transform duration-500">
                        {/* Fake UI Mockup */}
                        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                            </div>
                            <div className="text-xs font-mono text-slate-500">RULE_ID: KVL_001</div>
                        </div>
                        <div className="space-y-4 font-mono text-sm">
                            <div className="flex gap-4">
                                <span className="text-violet-400">INPUT:</span>
                                <span className="text-slate-300">"Find voltage drop across R2."</span>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-cyan-400">RULE:</span>
                                <span className="text-emerald-400">Kirchhoff's Voltage Law (KVL)</span>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-purple-400">EQ:</span>
                                <span className="text-slate-300">Sum(v_rise) - Sum(v_drop) = 0</span>
                            </div>
                            <div className="p-3 bg-black/30 rounded border border-white/5 text-slate-400 mt-2">
                                Analysis: Loop 1 is closed. Applying KVL... <br />
                                Result: <span className="text-cyan-400 font-bold">4.5 V</span>
                            </div>
                        </div>
                    </div>

                    {/* Floating Icons */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="absolute -top-10 -right-4 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl"
                    >
                        <Brain className="text-violet-400" size={32} />
                    </motion.div>
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                        className="absolute bottom-10 -left-10 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl"
                    >
                        <Shield className="text-emerald-400" size={32} />
                    </motion.div>
                </motion.div>

            </main>

            {/* Features Grid */}
            <section className="max-w-7xl mx-auto px-6 pb-32 grid md:grid-cols-3 gap-8">
                {[
                    {
                        icon: <Cpu className="text-cyan-400" />,
                        title: "Symbolic Solver",
                        desc: "Math is delegated to SymPy, ensuring 100% algebraic correctness."
                    },
                    {
                        icon: <Layers className="text-violet-400" />,
                        title: "Rule-Grounded RAG",
                        desc: "Every answer cites a specific rule from a verified engineering corpus."
                    },
                    {
                        icon: <Activity className="text-emerald-400" />,
                        title: "Interactive Sim",
                        desc: "Visual feedback loop. Change parameters and verify laws in real-time."
                    }
                ].map((feature, i) => (
                    <div key={i} className="glass-panel p-6 rounded-2xl hover:bg-white/5 transition-colors">
                        <div className="mb-4 bg-slate-800/50 w-12 h-12 rounded-lg flex items-center justify-center border border-white/5">
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                        <p className="text-slate-400 leading-relaxed text-sm">{feature.desc}</p>
                    </div>
                ))}
            </section>

        </div>
    );
}
