import { create } from 'zustand'

const useStore = create((set) => ({
    // Auth State
    token: localStorage.getItem('token') || null,
    setToken: (token) => {
        localStorage.setItem('token', token);
        set({ token });
    },

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
