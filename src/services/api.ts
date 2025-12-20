import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000", // Đổi port theo backend của bạn
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor để xử lý lỗi chung (optional)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default api;
