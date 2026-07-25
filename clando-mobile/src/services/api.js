import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.169:8080/api';
let onUnauthorizedCallback = null;

export const setUnauthorizedCallback = (callback) => {
    onUnauthorizedCallback = callback;
};

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('wayvo_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await AsyncStorage.removeItem('wayvo_token');
            await AsyncStorage.removeItem('wayvo_user_id');
            if (onUnauthorizedCallback) {
                onUnauthorizedCallback();
            }
        }
        return Promise.reject(error);
    }
);

export default api;