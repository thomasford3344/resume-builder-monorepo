import axios, { type AxiosInstance } from "axios";

class ApiClient {
  private static instance: ApiClient;
  private axiosInstance: AxiosInstance;
  private static logoutHandler?: () => void;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      timeout: 20000,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // optional if you deal with cookies/sessions
    });

    // Optional: Add interceptors here
    this.axiosInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn("Unauthorized - redirecting to login...");
          // e.g., handle logout or redirect
          ApiClient.logoutHandler?.();
        }
        return Promise.reject(error);
      }
    );
  }

  public static registerLogoutHandler(handler: () => void) {
    ApiClient.logoutHandler = handler;
  }

  public static getInstance(): AxiosInstance {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance.axiosInstance;
  }
}

export default ApiClient;
