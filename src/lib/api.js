import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? '/api';
const api = axios.create({ baseURL: BASE, timeout: 20000 });

export const getPortfolio    = (positions) =>
  positions
    ? api.post('/portfolio', { positions }).then(r => r.data)
    : api.get('/portfolio').then(r => r.data);

export const getAnalysis     = (ticker, range) => api.get(`/analysis/${ticker}`, { params: { range } }).then(r => r.data);
export const getNews         = (ticker)        => api.get(`/news/${ticker}`).then(r => r.data);
export const getQuote        = (ticker)        => api.get(`/quote/${ticker}`).then(r => r.data);
export const getLivePrice    = (ticker)        => api.get(`/price/${ticker}`).then(r => r.data);
