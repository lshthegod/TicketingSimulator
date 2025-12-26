import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // 쿠키 등 인증 정보 포함
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;