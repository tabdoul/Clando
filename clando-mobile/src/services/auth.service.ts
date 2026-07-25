import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export const login = async (email: string, motDePasse: string) => {
    const response = await api.post('/auth/login', { email, motDePasse });
    const token = response.data.token;
    await AsyncStorage.setItem('wayvo_token', token);
    return response.data;
};

export const logout = async () => {
    await AsyncStorage.removeItem('wayvo_token');
    await AsyncStorage.removeItem('wayvo_user_id');
};

export const isLoggedIn = async () => {
    const token = await AsyncStorage.getItem('wayvo_token');
    return !!token;
};

export const getUserId = async () => {
    const id = await AsyncStorage.getItem('wayvo_user_id');
    return id ? parseInt(id) : null;
};

export const fetchUtilisateurByEmail = async (email: string) => {
    const response = await api.get('/utilisateurs');
    const user = response.data.find((u: { email: string; id: number }) => u.email === email);
    if (user) {
        await AsyncStorage.setItem('wayvo_user_id', user.id.toString());
    }
    return user;
};