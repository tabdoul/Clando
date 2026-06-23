import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator,
    RefreshControl, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { getUserId } from '../services/auth.service';

export default function NotificationsScreen({ navigation }) {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            chargerNotifications();
        }, [])
    );

    const chargerNotifications = async () => {
        try {
            const userId = await getUserId();
            if (!userId) return;
            const response = await api.get(`/reservations/conducteur/${userId}/en-attente`);
            setReservations(response.data);
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de charger les notifications');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await chargerNotifications();
        setRefreshing(false);
    };

    const accepter = async (id) => {
        try {
            await api.patch(`/reservations/${id}/negociation?accepter=true`);
            chargerNotifications();
        } catch (error) {
            Alert.alert('Erreur', "Impossible d'accepter");
        }
    };

    const refuser = async (id) => {
        Alert.alert('Refuser', 'Êtes-vous sûr ?', [
            { text: 'Non', style: 'cancel' },
            {
                text: 'Oui',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.patch(`/reservations/${id}/negociation?accepter=false`);
                        chargerNotifications();
                    } catch (error) {
                        Alert.alert('Erreur', 'Impossible de refuser');
                    }
                }
            }
        ]);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size={36} color="#00b5e2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#eee" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                {reservations.length > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{reservations.length}</Text>
                    </View>
                )}
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#00b5e2"
                        colors={["#00b5e2"]}
                    />
                }>

                {reservations.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-outline" size={64} color="#444" />
                        <Text style={styles.emptyText}>Aucune notification</Text>
                        <Text style={styles.emptySubtext}>
                            Les demandes de réservation apparaîtront ici
                        </Text>
                    </View>
                )}

                {reservations.map((item) => (
                    <View key={item.id.toString()} style={styles.cardWrapper}>
                        <View style={styles.card}>

                            <View style={styles.cardTop}>
                                <View style={styles.avatarContainer}>
                                    {item.passagerPhoto ? (
                                        <Image
                                            source={{ uri: item.passagerPhoto }}
                                            style={styles.avatarImage}
                                        />
                                    ) : (
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarText}>
                                                {item.passagerPrenom?.charAt(0)}{item.passagerNom?.charAt(0)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.passagerInfo}>
                                    <Text style={styles.passagerNom}>
                                        {item.passagerPrenom} {item.passagerNom}
                                    </Text>
                                    <Text style={styles.passagerSubtitle}>
                                        veut réserver votre trajet
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.separator} />

                            {/* Trajet du conducteur */}
                            <View style={styles.trajetRow}>
                                <Ionicons name="car-outline" size={16} color="#00b5e2" />
                                <Text style={styles.trajetText}>
                                    {item.villeDepart} → {item.villeArrivee}
                                </Text>
                            </View>

                            {/* ✅ Trajet du passager */}
                            {item.departPassager && item.arriveePassager && (
                                <View style={styles.trajetPassagerContainer}>
                                    <Ionicons name="person-outline" size={14} color="#f39c12" />
                                    <Text style={styles.trajetPassagerTexte}>
                                        Passager : {item.departPassager} → {item.arriveePassager}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.detailRow}>
                                <Ionicons name="calendar-outline" size={14} color="#666" />
                                <Text style={styles.detailText}>
                                    Demande du {formatDate(item.dateReservation)}
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Ionicons name="person-outline" size={14} color="#666" />
                                <Text style={styles.detailText}>
                                    {item.nbPlaces} place(s) demandée(s)
                                </Text>
                            </View>

                            {item.prixPropose && (
                                <View style={styles.prixNegociation}>
                                    <Text style={styles.prixLabel}>Prix proposé par le passager</Text>
                                    <Text style={styles.prixValeur}>
                                        {item.prixPropose?.toLocaleString()} GNF
                                    </Text>
                                </View>
                            )}

                            <View style={styles.separator} />

                            <View style={styles.boutons}>
                                <TouchableOpacity
                                    style={styles.boutonAccepter}
                                    onPress={() => accepter(item.id)}>
                                    <Ionicons name="checkmark" size={16} color="white" />
                                    <Text style={styles.boutonAccepterText}>
                                        {item.prixPropose ? 'Accepter le prix' : 'Accepter'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.boutonRefuser}
                                    onPress={() => refuser(item.id)}>
                                    <Ionicons name="close" size={16} color="#e74c3c" />
                                    <Text style={styles.boutonRefuserText}>Refuser</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ))}

                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    loadingContainer: {
        flex: 1, backgroundColor: '#121212',
        justifyContent: 'center', alignItems: 'center'
    },
    header: {
        backgroundColor: '#1a1a1a',
        paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#eee', flex: 1 },
    badge: {
        backgroundColor: '#e74c3c', borderRadius: 12,
        paddingHorizontal: 8, paddingVertical: 2,
    },
    badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyText: { fontSize: 18, color: '#666', marginTop: 16 },
    emptySubtext: {
        fontSize: 14, color: '#444', marginTop: 4,
        textAlign: 'center', lineHeight: 20
    },
    cardWrapper: { paddingHorizontal: 16, marginTop: 12 },
    card: {
        backgroundColor: '#1e1e1e', borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: '#2a2a2a',
        borderLeftWidth: 3, borderLeftColor: '#00b5e2',
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarContainer: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
    avatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#00b5e2', alignItems: 'center', justifyContent: 'center',
    },
    avatarImage: { width: 44, height: 44, borderRadius: 22 },
    avatarText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    passagerInfo: { flex: 1 },
    passagerNom: { fontSize: 15, fontWeight: '600', color: '#eee' },
    passagerSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
    separator: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 12 },
    trajetRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    trajetText: { fontSize: 14, fontWeight: '600', color: '#ddd' },
    trajetPassagerContainer: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#2a2a1a', borderRadius: 8,
        padding: 8, marginBottom: 8,
    },
    trajetPassagerTexte: { fontSize: 13, color: '#f39c12', flex: 1 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    detailText: { fontSize: 13, color: '#888' },
    prixNegociation: {
        backgroundColor: '#0a2a35', borderRadius: 10, padding: 12,
        marginTop: 8, borderWidth: 1, borderColor: '#00b5e2',
    },
    prixLabel: {
        fontSize: 12, color: '#888',
        textTransform: 'uppercase', letterSpacing: 1,
    },
    prixValeur: { fontSize: 18, fontWeight: 'bold', color: '#00b5e2', marginTop: 4 },
    boutons: { flexDirection: 'row', gap: 12 },
    boutonAccepter: {
        flex: 1, backgroundColor: '#00b5e2', borderRadius: 10,
        paddingVertical: 10, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    boutonAccepterText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
    boutonRefuser: {
        flex: 1, borderWidth: 1, borderColor: '#e74c3c', borderRadius: 10,
        paddingVertical: 10, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    boutonRefuserText: { color: '#e74c3c', fontSize: 14, fontWeight: '600' },
});