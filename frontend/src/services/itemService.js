import api from './api';

const itemService = {
  getAll: async () => {
    const response = await api.get('/items');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/items/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/items', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/items/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  },
};

export default itemService;
