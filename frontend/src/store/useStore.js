import { create } from 'zustand'

const useStore = create((set) => ({
    // Auth State
    token: localStorage.getItem('cirser_token') || null,
    setToken: (token) => {
        localStorage.setItem('cirser_token', token);
        set({ token });
    },
    logout: () => {
        localStorage.removeItem('cirser_token');
        set({ token: null, user: null });
    },

    user: null,
    fetchUser: async () => {
        const token = localStorage.getItem('cirser_token');
        if (!token) return;

        try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://cirser.onrender.com/api/v1';
            const response = await fetch(`${API_URL.replace(/\/$/, '')}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const userData = await response.json();
                set({ user: userData });
            }
        } catch (error) {
            console.error("Failed to fetch user", error);
        }
    },

    // Chat State

    // Chat State
    messages: [{ role: 'assistant', content: 'Connected to Cirser Core. State your problem.' }],
    addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),

    // Simulation State (The "Truth" from Backend)
    simState: {
        nodes: [],
        branches: [],
        params: {},
    },
    updateSimState: (newState) => set({ simState: newState }),

    // Rule State
    activeRules: [], // List of Rule objects
    setActiveRules: (rules) => set({ activeRules: rules }),

    // UI State
    selectedNode: null,
    setSelectedNode: (nodeId) => set({ selectedNode: nodeId }),
}))

export default useStore
