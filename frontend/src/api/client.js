import axios from "axios";

/**
 * The shared axios instance used for every API call in the app. Handles
 * two things automatically so we don't have to do it in every component:
 * attaches the JWT to every request if one's saved, and if a request ever
 * comes back 401 (session expired/invalid), clears the saved session and
 * bounces to the login page.
 */
const client = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || ""}/api` });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("crewup_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("crewup_token");
      localStorage.removeItem("crewup_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default client;
