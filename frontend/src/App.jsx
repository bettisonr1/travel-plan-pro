import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MyTrips from './components/MyTrips';
import Login from './pages/Login';
import TripDetail from './pages/TripDetail';
import authService from './services/authService';
import Button from './components/Button';

function App() {
  const [user, setUser] = useState(authService.getCurrentUser());

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-12 flex justify-between items-center">
            <div className="flex-1"></div>
            <div className="flex-1 text-center">
              <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                Travel <span className="text-blue-600">Planner</span>
              </h1>
            </div>
            <div className="flex-1 flex justify-end items-center gap-4">
              <span className="text-gray-600">Hi, {user.firstname}!</span>
              <Button onClick={handleLogout} variant="secondary" className="text-sm py-1 px-3">
                Logout
              </Button>
            </div>
          </header>
          
          <Routes>
            <Route path="/" element={
              <>
                <div className="mb-12 text-center -mt-8">
                  <p className="max-w-2xl mx-auto text-xl text-gray-500">
                    Plan your next adventures with ease.
                  </p>
                </div>
                <main>
                  <MyTrips />
                </main>
              </>
            } />
            <Route path="/trips/:id" element={<TripDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <footer className="mt-20 text-center text-gray-400 text-sm">
            <p>Built with Controller-Service-Repository-Model pattern</p>
          </footer>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
