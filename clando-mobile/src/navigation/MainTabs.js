import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { getUserId } from '../services/auth.service';

import RechercheScreen from '../screens/RechercheScreen';
import PublierScreen from '../screens/PublierScreen';
import ReservationsScreen from '../screens/ReservationsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfilScreen from '../screens/ProfilScreen';

const Tab = createBottomTabNavigator();

const C = {
    primary: '#182D5A',
    primaryLight: '#EEF2F7',
    surface: '#FFFFFF',
    border: '#F0F0F0',
    textMuted: '#888888',
    red: '#E52424',
};

const ICON_SIZE = 22;

function BoutonSOS() {
    const navigation = useNavigation();
    return (
        <TouchableOpacity
            style={styles.boutonSOS}
            onPress={() => navigation.navigate('SOS')}>
            <Ionicons name="warning" size={18} color="white" />
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
        } catch {}
    };

    return (
        <View style={{ flex: 1 }}>
            <Tab.Navigator
                screenOptions={{
                    tabBarActiveTintColor: C.primary,
                    tabBarInactiveTintColor: C.textMuted,
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: C.surface,
                        borderTopColor: C.border,
                        borderTopWidth: 1,
                        paddingBottom: 20,
                        paddingTop: 6,
                        height: 75,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: 0.06,
                        shadowRadius: 8,
                        elevation: 10,
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '600',
                        marginTop: 2,
                    },
                    tabBarItemStyle: {
                        paddingTop: 4,
                    },
                }}>

                <Tab.Screen
                    name="Recherche"
                    component={RechercheScreen}
                    options={{
                        tabBarLabel: ({ focused, color }) => (
                            <Text style={{ fontSize: 11, fontWeight: '600', color }}>
                                Rechercher
                            </Text>
                        ),
                        tabBarIcon: ({ focused }) => (
                            <View style={[styles.pill, focused && styles.pillActive]}>
                                <Ionicons
                                    name={focused ? 'search' : 'search-outline'}
                                    size={ICON_SIZE}
                                    color={focused ? C.primary : C.textMuted}
                                />
                            </View>
                        )
                    }}
                />

                <Tab.Screen
                    name="Publier"
                    component={PublierScreen}
                    options={{
                        tabBarLabel: ({ focused, color }) => (
                            <Text style={{ fontSize: 11, fontWeight: '600', color }}>
                                Publier
                            </Text>
                        ),
                        tabBarIcon: ({ focused }) => (
                            <View style={[styles.pill, focused && styles.pillActive]}>
                                <Ionicons
                                    name={focused ? 'add-circle' : 'add-circle-outline'}
                                    size={ICON_SIZE}
                                    color={focused ? C.primary : C.textMuted}
                                />
                            </View>
                        ),
                    }}
                />

                <Tab.Screen
                    name="Reservations"
                    component={ReservationsScreen}
                    options={{
                        tabBarLabel: ({ focused, color }) => (
                            <Text style={{ fontSize: 11, fontWeight: '600', color }}>
                                Réservations
                            </Text>
                        ),
                        tabBarIcon: ({ focused }) => (
                            <View style={[styles.pill, focused && styles.pillActive]}>
                                <Ionicons
                                    name={focused ? 'ticket' : 'ticket-outline'}
                                    size={ICON_SIZE}
                                    color={focused ? C.primary : C.textMuted}
                                />
                            </View>
                        )
                    }}
                />

                <Tab.Screen
                    name="Messages"
                    component={MessagesScreen}
                    options={{
                        tabBarLabel: ({ focused, color }) => (
                            <Text style={{ fontSize: 11, fontWeight: '600', color }}>
                                Messages
                            </Text>
                        ),
                        tabBarIcon: ({ focused }) => (
                            <View style={[styles.pill, focused && styles.pillActive]}>
                                <Ionicons
                                    name={focused ? 'chatbubble' : 'chatbubble-outline'}
                                    size={ICON_SIZE}
                                    color={focused ? C.primary : C.textMuted}
                                />
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
                        tabBarLabel: ({ focused, color }) => (
                            <Text style={{ fontSize: 11, fontWeight: '600', color }}>
                                Profil
                            </Text>
                        ),
                        tabBarIcon: ({ focused }) => (
                            <View style={[styles.pill, focused && styles.pillActive]}>
                                <Ionicons
                                    name={focused ? 'person' : 'person-outline'}
                                    size={ICON_SIZE}
                                    color={focused ? C.primary : C.textMuted}
                                />
                            </View>
                        )
                    }}
                />
            </Tab.Navigator>

            <BoutonSOS />
        </View>
    );
}

const styles = StyleSheet.create({
    // ── Pill LinkedIn style ───────────────────────────────
    pill: {
        width: 56,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    pillActive: {
        backgroundColor: '#EEF2F7',
    },

    // ── SOS ──────────────────────────────────────────────
    boutonSOS: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        backgroundColor: C.red,
        borderRadius: 30,
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        elevation: 8,
        shadowColor: C.red,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    boutonSOSText: {
        color: 'white',
        fontSize: 13,
        fontWeight: 'bold',
    },

    // ── Badge messages ────────────────────────────────────
    badge: {
        position: 'absolute',
        top: -2,
        right: 2,
        backgroundColor: C.red,
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