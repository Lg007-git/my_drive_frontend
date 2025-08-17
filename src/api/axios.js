// api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/",
});

// Interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // or from cookies/context
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // console.log(token);
    }
    return config;
  },  
  (error) => Promise.reject(error)
);

export default api;
