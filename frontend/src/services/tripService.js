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

  removeUser: async (tripId, userId) => {
    const response = await api.delete(`/trips/${tripId}/users/${userId}`);
    return response.data;
  },

  suggest: async (data) => {
    const response = await api.post('/ai/suggest', data);
    return response.data;
  },

  addMessage: async (tripId, text) => {
    const response = await api.post(`/trips/${tripId}/messages`, { text });
    return response.data;
  },

  toggleLikeMessage: async (tripId, messageId) => {
    const response = await api.post(`/trips/${tripId}/messages/${messageId}/like`);
    return response.data;
  },
  
  generateImage: async (data) => {
    const response = await api.post('/ai/generate-image', data);
    return response.data;
  },

  generateLogo: async () => {
    const response = await api.post('/ai/generate-logo');
    return response.data;
  },

  uploadImage: async (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post(`/trips/${id}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default tripService;
