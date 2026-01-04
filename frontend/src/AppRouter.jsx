import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AboutPage from './pages/AboutPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import MainApp from './MainApp'
import useStore from './store/useStore'
import './index.css'

function ProtectedRoute({ children }) {
    const { token } = useStore();
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route
                    path="/workspace"
                    element={
                        <ProtectedRoute>
                            <MainApp />
                        </ProtectedRoute>
                    }
                />
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    )
}
