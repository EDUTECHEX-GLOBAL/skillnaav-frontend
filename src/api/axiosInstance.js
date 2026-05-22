import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  console.log("🚀 API Request:", `${config.baseURL}${config.url}`);
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ API Error:", error?.response || error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;