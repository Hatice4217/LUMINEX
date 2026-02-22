// LUMINEX - API Configuration
// Bu dosya hem frontend hem backend için API URL konfigürasyonunu içerir

// Environment bazlı API URL
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;

  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }

  // Production (Render)
  if (hostname.includes('onrender.com')) {
    return 'https://luminex-backend.onrender.com/api';
  }

  // Production (Custom domain)
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `https://${hostname}/api`;
  }

  // Default fallback
  return 'http://localhost:3000/api';
};

// Export olarak kullanıma
export const API_BASE_URL = getApiBaseUrl();

// Backend'e fetch request wrapper
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // LocalStorage'dan token al
  const token = localStorage.getItem('authToken');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 401 Unauthorized ise token'ı temizle
  if (response.status === 401) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('loggedInUser');
    window.location.href = '/login.html';
  }

  return response;
};

// Global scope'a ata (geri kodlardan erişilebilsin)
if (typeof window !== 'undefined') {
  window.API_BASE_URL = API_BASE_URL;
  window.getApiBaseUrl = getApiBaseUrl;
  window.apiRequest = apiRequest;
}
