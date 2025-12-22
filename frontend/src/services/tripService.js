import api from './api';

const tripService = {
  getAll: async () => {
    const response = await api.get('/trips');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/trips/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/trips', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/trips/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/trips/${id}`);
    return response.data;
  },

  addUser: async (tripId, userId) => {
    const response = await api.post(`/trips/${tripId}/users`, { userId });
    return response.data;
  },
};

export default tripService;
