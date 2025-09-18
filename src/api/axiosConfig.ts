import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:3000',
});

//interceptor to add token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers!['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default api;
