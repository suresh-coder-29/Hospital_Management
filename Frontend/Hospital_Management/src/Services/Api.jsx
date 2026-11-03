
import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
    timeout: 15000,
    headers: {
        Accept: "application/json",
    },
});

// Refresh request-ku old access token attach aaga koodathu
const refreshAPI = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
    timeout: 15000,
    headers: {
        Accept: "application/json",
    },
});

// Add access token to API requests
API.interceptors.request.use(
    (config) => {
        const url = config.url || "";

        // Login request-ku old token send panna vendam
        if (url.includes("accounts/login/")) {
            if (config.headers) {
                delete config.headers.Authorization;
            }

            return config;
        }

        const token = localStorage.getItem("access");

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

let isRefreshing = false;
let refreshSubscribers = [];

// Wait pannura requests-ai list-la add pannum
const subscribeTokenRefresh = (callback) => {
    refreshSubscribers.push(callback);
};

// Refresh success aana waiting requests-ku new token send pannum
const notifySubscribers = (token) => {
    refreshSubscribers.forEach((callback) => {
        callback(token, null);
    });

    refreshSubscribers = [];
};

// Refresh fail aana waiting requests-ai reject pannum
const clearSubscribers = (error) => {
    refreshSubscribers.forEach((callback) => {
        callback(null, error);
    });

    refreshSubscribers = [];
};

// Handle expired access token
API.interceptors.response.use(
    (response) => {
        return response;
    },

    async (error) => {
        const originalRequest = error.config;

        if (!error.response || !originalRequest) {
            return Promise.reject(error);
        }

        const url = originalRequest.url || "";

        const isLoginRequest = url.includes("accounts/login/");
        const isRefreshRequest = url.includes("accounts/token/refresh/");

        // Login request 401 aana refresh panna vendam
        if (isLoginRequest) {
            return Promise.reject(error);
        }

        // Refresh request error-ai inga handle panna vendam
        if (isRefreshRequest) {
            return Promise.reject(error);
        }

        // 401 illana refresh panna vendam
        if (error.response.status !== 401) {
            return Promise.reject(error);
        }

        // Same request-ai repeated-ah retry panna koodathu
        if (originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        const refreshToken = localStorage.getItem("refresh");

        // Refresh token illana login page-ku redirect pannum
        if (!refreshToken) {
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            localStorage.removeItem("role");
            localStorage.removeItem("user_id");

            window.location.href = "/login";

            return Promise.reject(error);
        }

        // Already oru request token refresh pannitu iruntha,
        // intha request new token varum varaikkum wait pannum
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                subscribeTokenRefresh((token, refreshError) => {
                    if (refreshError || !token) {
                        reject(refreshError || error);
                        return;
                    }

                    originalRequest.headers =
                        originalRequest.headers || {};

                    originalRequest.headers.Authorization =
                        `Bearer ${token}`;

                    resolve(API(originalRequest));
                });
            });
        }

        isRefreshing = true;

        try {
            // Get a new access token using refresh token
            const response = await refreshAPI.post(
                "accounts/token/refresh/",
                {
                    refresh: refreshToken,
                }
            );

            const newAccessToken = response.data.access;

            if (!newAccessToken) {
                throw new Error("New access token was not received");
            }

            // Save new access token
            localStorage.setItem("access", newAccessToken);

            // Save rotated refresh token, if backend returns one
            if (response.data.refresh) {
                localStorage.setItem(
                    "refresh",
                    response.data.refresh
                );
            }

            // Waiting requests-ku new token send pannum
            notifySubscribers(newAccessToken);

            // Original request-ai new token-oda retry pannum
            originalRequest.headers =
                originalRequest.headers || {};

            originalRequest.headers.Authorization =
                `Bearer ${newAccessToken}`;

            return API(originalRequest);

        } catch (refreshError) {
            // Refresh token expire or invalid aana
            clearSubscribers(refreshError);

            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            localStorage.removeItem("role");
            localStorage.removeItem("user_id");

            window.location.href = "/login";

            return Promise.reject(refreshError);

        } finally {
            isRefreshing = false;
        }
    }
);

export default API;
