import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle, Database } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#030712] text-white font-sans selection:bg-cyan-500/30 overflow-x-hidden relative p-8 md:p-12">

            {/* Background */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

            <div className="max-w-3xl mx-auto">
                <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={16} />
                    Back to Home
                </Link>

                <h1 className="text-4xl md:text-5xl font-bold mb-6">How Cirser Works</h1>
                <p className="text-xl text-slate-400 mb-12 leading-relaxed">
                    Cirser is an experiment in <strong>Rule-Grounded AI</strong>. Instead of letting a Large Language Model (LLM) "guess" the answer, we force it to act as an orchestrator that must retrieve and apply formal rules.
                </p>

                <div className="space-y-12">
                    {/* Step 1 */}
                    <section className="relative pl-8 border-l border-cyan-500/20">
                        <div className="absolute -left-[17px] top-0 w-8 h-8 bg-[#030712] border border-cyan-500 rounded-full flex items-center justify-center text-cyan-500 text-sm font-bold">1</div>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <Database className="text-cyan-400" size={20} />
                            Retrieval (RAG)
                        </h2>
                        <p className="text-slate-400 mb-4">
                            When you ask a question, the system searches a Vector Database (ChromaDB) for relevant engineering rules (e.g., Ohm's Law, KVL, Thevenin's Theorem).
                        </p>
                        <div className="bg-slate-900/50 p-4 rounded-lg font-mono text-xs text-slate-300 border border-white/5">
                            Query: "Voltage across parallel resistors?" <br />
                            <span className="text-emerald-500">Found: Rule_Parallel_Resistors (Similarity: 0.92)</span>
                        </div>
                    </section>

                    {/* Step 2 */}
                    <section className="relative pl-8 border-l border-violet-500/20">
                        <div className="absolute -left-[17px] top-0 w-8 h-8 bg-[#030712] border border-violet-500 rounded-full flex items-center justify-center text-violet-500 text-sm font-bold">2</div>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <BookOpen className="text-violet-400" size={20} />
                            Reasoning & Planning
                        </h2>
                        <p className="text-slate-400">
                            The AI Agent (Qwen 2.5) receives the rules and the user query. It is instructed <strong>NOT to solve the math</strong>, but to output a "Plan" that selects the correct equation and variables.
                        </p>
                    </section>

                    {/* Step 3 */}
                    <section className="relative pl-8 border-l border-emerald-500/20">
                        <div className="absolute -left-[17px] top-0 w-8 h-8 bg-[#030712] border border-emerald-500 rounded-full flex items-center justify-center text-emerald-500 text-sm font-bold">3</div>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <CheckCircle className="text-emerald-400" size={20} />
                            Symbolic Execution
                        </h2>
                        <p className="text-slate-400 mb-4">
                            The plan is passed to a Python Symbolic Solver (SymPy). This engine creates the algebraic graphs and solves for the unknowns numerically or symbolically, ensuring 100% mathematical precision.
                        </p>
                    </section>
                </div>

                <div className="mt-16 pt-16 border-t border-white/10 text-center">
                    <h3 className="text-2xl font-bold mb-4">Ready to try it?</h3>
                    <Link to="/workspace">
                        <button className="bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-cyan-500/20">
                            Launch Workspace
                        </button>
                    </Link>
                </div>

            </div>
        </div>
    );
}
