import 'react-native-gesture-handler';
import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isLoggedIn, getUserId } from './src/services/auth.service';
import { setUnauthorizedCallback } from './src/services/api';
import api from './src/services/api';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { colors } from './constants/theme';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MainTabs from './src/navigation/MainTabs';
import ResultatsScreen from './src/screens/ResultatsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ChatScreen from './src/screens/ChatScreen';
import SOSScreen from './src/screens/SOSScreen';
import AvisScreen from './src/screens/AvisScreen';
import DocumentsScreen from './src/screens/DocumentsScreen';
import AideScreen from './src/screens/AideScreen';
import TrajetDetailScreen from './src/screens/TrajetDetailScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import OnboardingScreen from './src/screens/OnboardingScreen'; 

const Stack = createStackNavigator();

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export default function App() {
    const [loading, setLoading] = useState(true);
    const [loggedIn, setLoggedIn] = useState(false);
    const [onboardingVu, setOnboardingVu] = useState(null); // ✅
    const navigationRef = useRef(null);

    useEffect(() => {
        initialiser();
        setUnauthorizedCallback(() => {
            if (navigationRef.current) {
                navigationRef.current.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            }
        });

        const subscription = Linking.addEventListener('url', ({ url }) => {
            handleDeepLink(url);
        });

        Linking.getInitialURL().then((url) => {
            if (url) handleDeepLink(url);
        });

        return () => subscription.remove();
    }, []);

    const initialiser = async () => {
       // await AsyncStorage.removeItem('wayvo_onboarding_vu');
        // ✅ Vérifie onboarding et auth en parallèle
        const [connected, vu] = await Promise.all([
            isLoggedIn(),
            AsyncStorage.getItem('wayvo_onboarding_vu')
        ]);
        setLoggedIn(connected);
        setOnboardingVu(!!vu);
        setLoading(false);
        if (connected) {
            await enregistrerPushToken();
        }
    };

    const handleDeepLink = (url) => {
        if (!url) return;
        if (url.includes('paiement-succes')) {
            setTimeout(() => {
                if (navigationRef.current) {
                    Alert.alert(
                        '✅ Réservation envoyée !',
                        'Votre paiement a été reçu. Votre réservation est en attente de confirmation du conducteur.',
                        [{
                            text: 'Voir mes réservations',
                            onPress: () => {
                                navigationRef.current.navigate('Main', { screen: 'Reservations' });
                            }
                        }]
                    );
                }
            }, 500);
        }
    };

    const enregistrerPushToken = async () => {
        try {
            if (!Device.isDevice) return;
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') return;
            const projectId = Constants.expoConfig?.extra?.eas?.projectId;
            if (!projectId) return;
            const token = await Notifications.getExpoPushTokenAsync({ projectId });
            const userId = await getUserId();
            if (userId && token.data) {
                await api.patch(`/utilisateurs/${userId}/push-token?token=${encodeURIComponent(token.data)}`);
            }
        } catch (error) {
            console.log('Push token non disponible:', error.message);
        }
    };

    // ✅ Détermine l'écran initial
    const getInitialRoute = () => {
        if (!onboardingVu) return 'Onboarding';
        if (loggedIn) return 'Main';
        return 'Login';
    };

    if (loading || onboardingVu === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size={36} color={colors.accent} />
            </View>
        );
    }

    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator
                initialRouteName={getInitialRoute()}
                screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen name="Resultats" component={ResultatsScreen} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                <Stack.Screen name="Chat" component={ChatScreen} />
                <Stack.Screen name="SOS" component={SOSScreen} />
                <Stack.Screen name="Avis" component={AvisScreen} />
                <Stack.Screen name="Documents" component={DocumentsScreen} />
                <Stack.Screen name="Aide" component={AideScreen} />
                <Stack.Screen name="TrajetDetail" component={TrajetDetailScreen} />
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}