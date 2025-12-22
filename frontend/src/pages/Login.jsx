import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import Button from '../components/Button';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await authService.login(email, password);
      if (data.success) {
        onLogin(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  const devUsers = [
    { email: 'john@example.com', password: 'password123', name: 'John Doe' },
    { email: 'jane@example.com', password: 'password123', name: 'Jane Smith' },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-600">Travel Planner Login</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-800 font-semibold">
              Register here
            </Link>
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4 text-center">
            Dev Credentials (for testing)
          </h3>
          <div className="space-y-2">
            {devUsers.map((user) => (
              <div 
                key={user.email} 
                className="p-3 bg-blue-50 rounded-md cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => {
                  setEmail(user.email);
                  setPassword(user.password);
                }}
              >
                <p className="text-sm font-medium text-blue-800">{user.name}</p>
                <p className="text-xs text-blue-600">Email: {user.email}</p>
                <p className="text-xs text-blue-600">Password: {user.password}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
