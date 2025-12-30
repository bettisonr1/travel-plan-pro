import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import MyTrips from './components/MyTrips';
import Login from './pages/Login';
import Register from './pages/Register';
import TripDetail from './pages/TripDetail';
import UserProfile from './pages/UserProfile';
import authService from './services/authService';
import tripService from './services/tripService';
import Button from './components/Button';

// Wrapper component to handle layout for authenticated routes
const Layout = ({ children, user, onLogout }) => {
  const [logoUrl, setLogoUrl] = useState(null);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);

  const handleGenerateLogo = async () => {
    if (isGeneratingLogo) return;
    setIsGeneratingLogo(true);
    try {
        const response = await tripService.generateLogo();
        if (response.success && response.imageUrl) {
            const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace('/api', '');
            setLogoUrl(`${baseUrl}${response.imageUrl}`);
        }
    } catch (error) {
        console.error("Failed to generate logo", error);
    } finally {
        setIsGeneratingLogo(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex justify-between items-center">
          <div className="flex-1">
             <Link to="/" className="text-gray-500 hover:text-gray-900 transition-colors inline-block" aria-label="Home">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
               </svg>
             </Link>
          </div>
          <div className="flex-1 text-center flex flex-col items-center justify-center">
            {logoUrl ? (
                <div className="relative group inline-block">
                    <img src={logoUrl} alt="Travel Planner Logo" className="h-24 md:h-28 w-auto object-contain mx-auto rounded-lg shadow-sm" />
                    <button 
                        onClick={() => setLogoUrl(null)}
                        className="absolute -top-2 -right-2 bg-gray-200 rounded-full p-1 hover:bg-gray-300 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Reset Logo"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
             ) : (
                <div className="flex items-center justify-center gap-3">
                    <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                      Travel <span className="text-blue-600">Planner</span>
                    </h1>
                    <button 
                        onClick={handleGenerateLogo}
                        disabled={isGeneratingLogo}
                        className={`text-gray-400 hover:text-purple-600 transition-colors p-1 rounded-full hover:bg-purple-50 ${isGeneratingLogo ? 'animate-spin text-purple-600' : ''}`}
                        title="Generate AI Logo"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                    </button>
                </div>
             )}
          </div>
          <div className="flex-1 flex justify-end items-center gap-4">
            <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity" title="Edit Profile">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                style={{ backgroundColor: user.avatarColor || '#3B82F6' }}
              >
                {user.firstname?.[0]?.toUpperCase()}
              </div>
              <span className="text-gray-600 font-medium">Hi, {user.firstname}!</span>
            </Link>
            <Button onClick={onLogout} variant="secondary" className="text-sm py-1 px-3">
              Logout
            </Button>
          </div>
        </header>
        {children}
        <footer className="mt-20 text-center text-gray-400 text-sm">
          <p>Built with Controller-Service-Repository-Model pattern</p>
        </footer>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function AppContent() {
  const [user, setUser] = useState(authService.getCurrentUser());

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/register" 
        element={!user ? <Register onLogin={handleLogin} /> : <Navigate to="/" replace />} 
      />
      
      <Route path="/" element={
        <ProtectedRoute user={user}>
          <Layout user={user} onLogout={handleLogout}>
            <div className="mb-12 text-center -mt-8">
              <p className="max-w-2xl mx-auto text-xl text-gray-500">
                Plan your next adventures with ease.
              </p>
            </div>
            <main>
              <MyTrips />
            </main>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/trips/:id" element={
        <ProtectedRoute user={user}>
          <Layout user={user} onLogout={handleLogout}>
            <TripDetail />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute user={user}>
          <Layout user={user} onLogout={handleLogout}>
            <UserProfile user={user} onUpdate={handleUpdateUser} />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
