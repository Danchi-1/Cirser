import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MessageSquare, Trash2, Loader } from 'lucide-react';
import axios from 'axios';
import useStore from '../store/useStore';

export default function HistoryPage() {
    const navigate = useNavigate();
    const { token, setMessages, setSessionId, updateSimState } = useStore();
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_URL || 'https://cirser.onrender.com/api/v1';

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await axios.get(`${API_URL}/history/sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSessions(res.data);
        } catch (error) {
            console.error("Failed to load history", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadSession = async (sessionId) => {
        try {
            setIsLoading(true);
            const res = await axios.get(`${API_URL}/history/sessions/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const fullSession = res.data;

            // 1. Transform Messages
            // Backend returns list of { role, content, meta_audit }.
            // We need to shape them for Frontend UI (which expects 'audit' and 'steps' separate)
            const uiMessages = fullSession.messages.map(msg => {
                const audit = msg.meta_audit || {};
                return {
                    role: msg.role,
                    content: msg.content,
                    audit: audit, // Pass the whole object as audit
                    steps: audit.reasoning_steps || [], // Extract steps if present
                };
            });

            // 2. Hydrate Store
            setMessages(uiMessages);
            setSessionId(fullSession.id);

            // 3. Reset Simulation (Chat First, Sim Later strategy)
            updateSimState({ nodes: [], branches: [], params: {} });

            // 4. Navigate
            navigate('/workspace');

        } catch (error) {
            console.error("Failed to load session", error);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteSession = async (e, sessionId) => {
        e.stopPropagation();
        if (!window.confirm("Delete this engineering record?")) return;

        try {
            await axios.delete(`${API_URL}/history/sessions/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSessions(prev => prev.filter(s => s.id !== sessionId));
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#030712] text-white font-sans p-6 overflow-y-auto">
            {/* Background */}
            <div className="fixed inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/workspace')}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    >
                        <ArrowLeft className="text-cyan-500" />
                    </button>
                    <h1 className="text-3xl font-bold font-mono">Mission Log</h1>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-20">
                        <Loader className="animate-spin text-cyan-500" size={32} />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center p-20 glass-panel rounded-2xl border border-white/5">
                        <MessageSquare className="mx-auto mb-4 text-slate-600" size={48} />
                        <h3 className="text-xl font-bold text-slate-400">No Mission Logs</h3>
                        <p className="text-slate-500">Your engineering history is empty.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {sessions.map(session => (
                            <div
                                key={session.id}
                                onClick={() => loadSession(session.id)}
                                className="glass-panel p-5 rounded-xl border border-white/5 hover:border-cyan-500/30 hover:bg-white/5 transition-all cursor-pointer group flex justify-between items-center"
                            >
                                <div>
                                    <h3 className="font-bold text-lg text-cyan-50 truncate max-w-md md:max-w-xl">
                                        {session.title || "Untitled Session"}
                                    </h3>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-mono">
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(session.updated_at || session.created_at).toLocaleString()}
                                        </div>
                                        <div className="bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                                            ID: {session.id.slice(0, 8)}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => deleteSession(e, session.id)}
                                    className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-black/20 rounded-lg"
                                    title="Delete Log"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
