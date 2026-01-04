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
        set({ token: null });
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
