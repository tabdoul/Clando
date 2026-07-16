import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import { getUserId } from '../services/auth.service';

import RechercheScreen from '../screens/RechercheScreen';
import PublierScreen from '../screens/PublierScreen';
import ReservationsScreen from '../screens/ReservationsScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfilScreen from '../screens/ProfilScreen';

const Tab = createBottomTabNavigator();

const C = { primary: '#182D5A', primaryLight: '#EEF2F7', surface: '#FFFFFF', border: '#F0F0F0', textMuted: '#888888', red: '#E52424' };
const ICON_SIZE = 22;

function BoutonSOS({ bottom }) {
    const navigation = useNavigation();
    return (
        <TouchableOpacity style={[styles.boutonSOS, { bottom }]} onPress={() => navigation.navigate('SOS')}>
            <Ionicons name="warning" size={18} color="white" />
            <Text style={styles.boutonSOSText}>SOS</Text>
        </TouchableOpacity>
    );
}

export default function MainTabs() {
    const [nbMessages, setNbMessages] = useState(0);
    const insets = useSafeAreaInsets();
    const hauteurNavbar = 55 + insets.bottom;
    const paddingBasNavbar = insets.bottom > 0 ? insets.bottom : 12;

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
                        paddingBottom: paddingBasNavbar,
                        paddingTop: 8,
                        height: hauteurNavbar,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: 0.06,
                        shadowRadius: 8,
                        elevation: 10,
                    },
                    tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
                    tabBarItemStyle: { paddingTop: 2 },
                }}>

                <Tab.Screen name="Recherche" component={RechercheScreen} options={{
                    tabBarLabel: ({ color }) => <Text style={[styles.label, { color }]} numberOfLines={1} adjustsFontSizeToFit>Rechercher</Text>,
                    tabBarIcon: ({ focused }) => (
                        <View style={[styles.pill, focused && styles.pillActive]}>
                            <Ionicons name={focused ? 'search' : 'search-outline'} size={ICON_SIZE} color={focused ? C.primary : C.textMuted} />
                        </View>
                    )
                }} />

                <Tab.Screen name="Publier" component={PublierScreen} options={{
                    tabBarLabel: ({ color }) => <Text style={[styles.label, { color }]} numberOfLines={1} adjustsFontSizeToFit>Publier</Text>,
                    tabBarIcon: ({ focused }) => (
                        <View style={[styles.pill, focused && styles.pillActive]}>
                            <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={ICON_SIZE} color={focused ? C.primary : C.textMuted} />
                        </View>
                    ),
                }} />

                <Tab.Screen name="Reservations" component={ReservationsScreen} options={{
                    tabBarLabel: ({ color }) => <Text style={[styles.label, { color }]} numberOfLines={1} adjustsFontSizeToFit>Réservations</Text>,
                    tabBarIcon: ({ focused }) => (
                        <View style={[styles.pill, focused && styles.pillActive]}>
                            <Ionicons name={focused ? 'ticket' : 'ticket-outline'} size={ICON_SIZE} color={focused ? C.primary : C.textMuted} />
                        </View>
                    )
                }} />

                <Tab.Screen name="Messages" component={MessagesScreen} options={{
                    tabBarLabel: ({ color }) => <Text style={[styles.label, { color }]} numberOfLines={1} adjustsFontSizeToFit>Messages</Text>,
                    tabBarIcon: ({ focused }) => (
                        <View style={[styles.pill, focused && styles.pillActive]}>
                            <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={ICON_SIZE} color={focused ? C.primary : C.textMuted} />
                            {nbMessages > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{nbMessages > 9 ? '9+' : nbMessages}</Text></View>}
                        </View>
                    )
                }} />

                <Tab.Screen name="Profil" component={ProfilScreen} options={{
                    tabBarLabel: ({ color }) => <Text style={[styles.label, { color }]} numberOfLines={1} adjustsFontSizeToFit>Profil</Text>,
                    tabBarIcon: ({ focused }) => (
                        <View style={[styles.pill, focused && styles.pillActive]}>
                            <Ionicons name={focused ? 'person' : 'person-outline'} size={ICON_SIZE} color={focused ? C.primary : C.textMuted} />
                        </View>
                    )
                }} />
            </Tab.Navigator>

            <BoutonSOS bottom={hauteurNavbar + 15} />
        </View>
    );
}

const styles = StyleSheet.create({
    label: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    pill: { width: 56, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
    pillActive: { backgroundColor: '#EEF2F7' },
    boutonSOS: { position: 'absolute', right: 20, backgroundColor: C.red, borderRadius: 30, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6, elevation: 8, shadowColor: C.red, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
    boutonSOSText: { color: 'white', fontSize: 13, fontWeight: 'bold' },
    badge: { position: 'absolute', top: -2, right: 2, backgroundColor: C.red, borderRadius: 10, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
    badgeText: { color: 'white', fontSize: 9, fontWeight: 'bold' },
});