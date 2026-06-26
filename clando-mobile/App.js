import 'react-native-gesture-handler';
import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Alert, Linking } from 'react-native';
import { isLoggedIn, getUserId } from './src/services/auth.service';
import { setUnauthorizedCallback } from './src/services/api';
import api from './src/services/api';
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
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import TrajetDetailScreen from './src/screens/TrajetDetailScreen';

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
    const navigationRef = useRef(null);

    useEffect(() => {
        checkAuth();
        setUnauthorizedCallback(() => {
            if (navigationRef.current) {
                navigationRef.current.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            }
        });

        //  Gère le deep link quand l'app est déjà ouverte
        const subscription = Linking.addEventListener('url', ({ url }) => {
            handleDeepLink(url);
        });

        //  Gère le deep link quand l'app s'ouvre depuis un lien
        Linking.getInitialURL().then((url) => {
            if (url) handleDeepLink(url);
        });

        return () => subscription.remove();
    }, []);

    // ✅ Traite le deep link et navigue vers Réservations
    const handleDeepLink = (url) => {
        if (!url) return;
        console.log('Deep link reçu:', url);

        if (url.includes('paiement-succes')) {
            // Petite attente pour que la navigation soit prête
            setTimeout(() => {
                if (navigationRef.current) {
                    // Affiche l'alerte de confirmation
                    Alert.alert(
                        '✅ Réservation envoyée !',
                        'Votre paiement a été reçu. Votre réservation est en attente de confirmation du conducteur.',
                        [
                            {
                                text: 'Voir mes réservations',
                                onPress: () => {
                                    navigationRef.current.navigate('Main', {
                                        screen: 'Reservations'
                                    });
                                }
                            }
                        ]
                    );
                }
            }, 500);
        }
    };

    const checkAuth = async () => {
        const connected = await isLoggedIn();
        setLoggedIn(connected);
        setLoading(false);
        if (connected) {
            await enregistrerPushToken();
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
                console.log('Push token enregistré:', token.data);
            }
        } catch (error) {
            console.log('Push token non disponible:', error.message);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
                <ActivityIndicator size={36} color="#00b5e2" />
            </View>
        );
    }

    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator
                screenOptions={{ headerShown: false }}
                initialRouteName={loggedIn ? 'Main' : 'Login'}>
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
            </Stack.Navigator>
        </NavigationContainer>
    );
}