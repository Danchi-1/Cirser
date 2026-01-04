import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Lock, Mail, User, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://cirser.onrender.com/api/v1';

            await axios.post(`${API_URL}/auth/signup`, {
                email,
                password,
                full_name: fullName
            });

            // Redirect to login after successful signup
            navigate('/login');

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Signup failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#030712] text-white font-sans flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="glass-panel w-full max-w-md p-8 rounded-2xl border border-white/5 relative z-10">
                <div className="flex flex-col items-center mb-8">
                    <Zap className="text-violet-400 fill-violet-400 mb-4" size={32} />
                    <h1 className="text-2xl font-bold">Initialize Access</h1>
                    <p className="text-slate-400 text-sm">Create your Cirser identity</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-slate-400 uppercase">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-slate-500" size={16} />
                            <input
                                type="text"
                                required
                                className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                                placeholder="Nikola Tesla"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                    </div>

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
                        className="w-full bg-violet-500 hover:bg-violet-400 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        {isLoading ? 'Processing...' : 'Create Account'}
                        {!isLoading && <ArrowRight size={18} />}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
                        Login here
                    </Link>
                </div>
            </div>
        </div>
    );
}
