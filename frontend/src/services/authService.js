import api from './api';

const login = async (email, password) => {
  const response = await api.post('/users/login', { email, password });
  if (response.data.success) {
    localStorage.setItem('user', JSON.stringify(response.data.data));
  }
  return response.data;
};

const register = async (userData) => {
  const response = await api.post('/users/register', userData);
  if (response.data.success) {
    localStorage.setItem('user', JSON.stringify(response.data.data));
  }
  return response.data;
};

const logout = () => {
  localStorage.removeItem('user');
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

const getAllUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

const authService = {
  login,
  register,
  logout,
  getCurrentUser,
  getAllUsers,
};

export default authService;
