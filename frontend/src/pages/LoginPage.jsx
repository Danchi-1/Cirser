import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Lock, Mail, ArrowRight } from 'lucide-react';
import useStore from '../store/useStore';
import axios from 'axios';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { setToken } = useStore();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://cirser.onrender.com/api/v1';

            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const res = await axios.post(`${API_URL}/auth/login/access-token`, formData);

            if (res.data.access_token) {
                setToken(res.data.access_token);
                navigate('/workspace');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030712] text-white font-sans flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="glass-panel w-full max-w-md p-8 rounded-2xl border border-white/5 relative z-10">
                <div className="flex flex-col items-center mb-8">
                    <Zap className="text-cyan-400 fill-cyan-400 mb-4" size={32} />
                    <h1 className="text-2xl font-bold">Welcome Back</h1>
                    <p className="text-slate-400 text-sm">Enter the engineering workspace</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-slate-400 uppercase">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-500" size={16} />
                            <input
                                type="email"
                                required
                                className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                                placeholder="engineer@cirser.ai"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-mono text-slate-400 uppercase">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-500" size={16} />
                            <input
                                type="password"
                                required
                                className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        {isLoading ? 'Authenticating...' : 'Access Workspace'}
                        {!isLoading && <ArrowRight size={18} />}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                        Initialize Access
                    </Link>
                </div>
            </div>
        </div>
    );
}
