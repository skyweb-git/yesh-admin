const getApiBaseUrl = (): string => {
  // If running in local browser, default to localhost:5000
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000';
  }
  return (import.meta.env.VITE_API_BASE_URL || 'https://api.yasheduacademy.com').replace(/\/+$/, '');
};

export const API_BASE_URL: string = getApiBaseUrl();
