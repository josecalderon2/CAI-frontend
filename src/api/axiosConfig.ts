// src/lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});

// Interceptor: antes de cada request agrega el token (mejorado)
api.interceptors.request.use((config) => {
  // Asegurar que config.headers existe
  if (!config.headers) {
    config.headers = {};
  }

  // Obtener token y agregarlo si existe
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
  }

  return config;
});
