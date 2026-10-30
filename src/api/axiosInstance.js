import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE,
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  console.log("🚀 API Request:", `${config.baseURL}${config.url}`);
  if (!config.headers) config.headers = {};
  if (!config.headers.Authorization && !config.headers.authorization) {
    const token =
      localStorage.getItem("schoolAdminToken") ||
      localStorage.getItem("adminToken") ||
      localStorage.getItem("userToken") ||
      localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error?.config?.url || "";
    const isExpected404 = error?.response?.status === 404 && url.includes("/api/schedule/get-schedule");

    if (!isExpected404) {
      console.error("❌ API Error:", error?.response || error.message);
    }

    if (error?.response?.status === 401 && error?.response?.data?.code === "ADMIN_ACCOUNT_INACTIVE") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminInfo");
      window.location.href = "/admin/login";
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;