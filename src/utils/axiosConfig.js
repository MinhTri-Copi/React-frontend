import axios from 'axios';

const BASE_URL = 'http://localhost:8082/api';

// Create axios instance
const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 600000, // 10 minutes timeout (for CV review which can take 5-10 minutes)
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor - Add JWT token to headers
axiosInstance.interceptors.request.use(
    (config) => {
        // Increase timeout for CV review endpoint (can take 5-10 minutes)
        if (config.url && config.url.includes('/candidate/review-cv')) {
            config.timeout = 600000; // 10 minutes
        }
        
        // Get token from localStorage or sessionStorage
        const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                // If userData has token, add it to headers
                if (userData.token) {
                    config.headers.Authorization = `Bearer ${userData.token}`;
                    console.log('JWT Token added to request:', config.url);
                } else {
                    console.warn('User data found but no token:', userData);
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        } else {
            console.warn('No user data found in storage for request:', config.url);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


// Response interceptor - Handle token expiration
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            // Handle 401 Unauthorized (token expired or invalid)
            if (error.response.status === 401) {
                // Clear user data and redirect to login
                localStorage.removeItem('user');
                sessionStorage.removeItem('user');
                
                // Only redirect if not already on login page
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;

