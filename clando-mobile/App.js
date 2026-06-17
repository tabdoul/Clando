import 'react-native-gesture-handler';
import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { isLoggedIn } from './src/services/auth.service';
import { setUnauthorizedCallback } from './src/services/api';
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
const Stack = createStackNavigator();

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
    }, []);

    const checkAuth = async () => {
        const connected = await isLoggedIn();
        setLoggedIn(connected);
        setLoading(false);
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
            </Stack.Navigator>
        </NavigationContainer>
    );
}