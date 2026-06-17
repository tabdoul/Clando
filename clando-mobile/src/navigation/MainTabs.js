import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { getUserId } from '../services/auth.service';

import RechercheScreen from '../screens/RechercheScreen';
import PublierScreen from '../screens/PublierScreen';
import ReservationsScreen from '../screens/ReservationsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfilScreen from '../screens/ProfilScreen';

const Tab = createBottomTabNavigator();

function BoutonSOS() {
    const navigation = useNavigation();
    return (
        <TouchableOpacity
            style={styles.boutonSOS}
            onPress={() => navigation.navigate('SOS')}>
            <Ionicons name="warning" size={20} color="white" />
            <Text style={styles.boutonSOSText}>SOS</Text>
        </TouchableOpacity>
    );
}

export default function MainTabs() {
    const [nbMessages, setNbMessages] = useState(0);

   useEffect(() => {
    chargerNbMessages();
    const interval = setInterval(chargerNbMessages, 5000);
    return () => clearInterval(interval);
}, []);

    const chargerNbMessages = async () => {
        try {
            const userId = await getUserId();
            if (!userId) return;
            const response = await api.get(`/messages/non-lus/${userId}`);
            setNbMessages(response.data.nbNonLus);
        } catch (error) {
            console.log('Erreur badge messages');
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <Tab.Navigator
                screenOptions={{
                    tabBarActiveTintColor: '#00b5e2',
                    tabBarInactiveTintColor: '#666',
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: '#1a1a1a',
                        borderTopColor: '#2a2a2a',
                        borderTopWidth: 1,
                        paddingBottom: 20,
                        paddingTop: 4,
                        height: 75,
                    }
                }}>
                <Tab.Screen
                    name="Recherche"
                    component={RechercheScreen}
                    options={{
                        tabBarLabel: 'Rechercher',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="search" size={size} color={color} />
                        )
                    }}
                />
                <Tab.Screen
                    name="Publier"
                    component={PublierScreen}
                    options={{
                        tabBarLabel: 'Publier',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="add-circle-outline" size={size} color={color} />
                        )
                    }}
                />
                <Tab.Screen
                    name="Reservations"
                    component={ReservationsScreen}
                    options={{
                        tabBarLabel: 'Réservations',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="ticket-outline" size={size} color={color} />
                        )
                    }}
                />
                <Tab.Screen
                    name="Messages"
                    component={MessagesScreen}
                    options={{
                        tabBarLabel: 'Messages',
                        tabBarIcon: ({ color, size }) => (
                            <View>
                                <Ionicons name="chatbubble-outline" size={size} color={color} />
                                {nbMessages > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>
                                            {nbMessages > 9 ? '9+' : nbMessages}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )
                    }}
                />
                <Tab.Screen
                    name="Profil"
                    component={ProfilScreen}
                    options={{
                        tabBarLabel: 'Profil',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="person-outline" size={size} color={color} />
                        )
                    }}
                />
            </Tab.Navigator>

            <BoutonSOS />
        </View>
    );
}

const styles = StyleSheet.create({
    boutonSOS: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        backgroundColor: '#e74c3c',
        borderRadius: 30,
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        elevation: 8,
        shadowColor: '#e74c3c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    boutonSOSText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: '#e74c3c',
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    badgeText: {
        color: 'white',
        fontSize: 9,
        fontWeight: 'bold',
    },
});