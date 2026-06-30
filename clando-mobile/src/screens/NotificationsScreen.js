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
import { colors, spacing, radius, shadows } from '../../constants/theme';

export default function NotificationsScreen({ navigation }) {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);

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

    const accepter = async (item) => {
        Alert.alert(
            'Confirmer la reservation',
            `Accepter la reservation de ${item.passagerPrenom} ${item.passagerNom} ?`,
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui, accepter',
                    onPress: async () => {
                        setLoadingAction(true);
                        try {
                            await api.patch(`/reservations/${item.id}/negociation?accepter=true`);
                            chargerNotifications();
                            Alert.alert(
                                'Reservation confirmee !',
                                `${item.passagerPrenom} a 30 minutes pour effectuer le paiement.`
                            );
                        } catch (error) {
                            Alert.alert('Erreur', "Impossible d'accepter");
                        } finally {
                            setLoadingAction(false);
                        }
                    }
                }
            ]
        );
    };

    const refuser = async (item) => {
        Alert.alert(
            'Refuser la reservation',
            `Etes-vous sur de vouloir refuser la reservation de ${item.passagerPrenom} ${item.passagerNom} ?`,
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui, refuser', style: 'destructive',
                    onPress: async () => {
                        setLoadingAction(true);
                        try {
                            await api.patch(`/reservations/${item.id}/negociation?accepter=false`);
                            chargerNotifications();
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible de refuser');
                        } finally {
                            setLoadingAction(false);
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size={36} color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Demandes de reservation</Text>
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
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }>

                {reservations.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-outline" size={64} color={colors.border} />
                        <Text style={styles.emptyText}>Aucune demande en attente</Text>
                        <Text style={styles.emptySubtext}>
                            Les demandes de reservation apparaitront ici
                        </Text>
                    </View>
                )}

                {reservations.map((item) => (
                    <View key={item.id.toString()} style={styles.cardWrapper}>
                        <View style={styles.card}>

                            <View style={styles.cardTop}>
                                <View style={styles.avatarContainer}>
                                    {item.passagerPhoto ? (
                                        <Image source={{ uri: item.passagerPhoto }} style={styles.avatarImage} />
                                    ) : (
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarText}>
                                                {`${item.passagerPrenom?.charAt(0)}${item.passagerNom?.charAt(0)}`}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.passagerInfo}>
                                    <Text style={styles.passagerNom}>
                                        {`${item.passagerPrenom} ${item.passagerNom}`}
                                    </Text>
                                    <Text style={styles.passagerSubtitle}>
                                        souhaite rejoindre votre trajet
                                    </Text>
                                    <Text style={styles.demandeDate}>
                                        {`Demande le ${formatDate(item.dateReservation)}`}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.separator} />

                            <View style={styles.trajetConducteur}>
                                <View style={styles.trajetLigne}>
                                    <View style={styles.trajetDot} />
                                    <Text style={styles.trajetVille}>{item.villeDepart}</Text>
                                </View>
                                <View style={styles.trajetConnecteur}>
                                    <View style={styles.trajetConnecteurLigne} />
                                    <Ionicons name="arrow-down" size={12} color={colors.textMuted} />
                                    <View style={styles.trajetConnecteurLigne} />
                                </View>
                                <View style={styles.trajetLigne}>
                                    <View style={[styles.trajetDot, styles.trajetDotArrivee]} />
                                    <Text style={styles.trajetVille}>{item.villeArrivee}</Text>
                                </View>
                            </View>

                            {item.departPassager && item.arriveePassager && (
                                <View style={styles.trajetPassagerContainer}>
                                    <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                                    <Text style={styles.trajetPassagerTexte}>
                                        {`Monte a `}
                                        <Text style={styles.trajetPassagerGras}>{item.departPassager}</Text>
                                        {` — Descend a `}
                                        <Text style={styles.trajetPassagerGras}>{item.arriveePassager}</Text>
                                    </Text>
                                </View>
                            )}

                            <View style={styles.detailsBloc}>
                                <Ionicons name="person-outline" size={13} color={colors.textMuted} />
                                <Text style={styles.detailText}>
                                    {`${item.nbPlaces} place(s) demandee(s)`}
                                </Text>
                            </View>

                            <View style={styles.separator} />

                            <TouchableOpacity
                                style={styles.boutonAccepter}
                                onPress={() => accepter(item)}
                                disabled={loadingAction}>
                                <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                                <Text style={styles.boutonAccepterText}>Accepter la reservation</Text>
                            </TouchableOpacity>

                            <View style={styles.boutonsSecondaires}>
                                <TouchableOpacity
                                    style={styles.boutonRefuser}
                                    onPress={() => refuser(item)}
                                    disabled={loadingAction}>
                                    <Ionicons name="close-circle-outline" size={14} color={colors.red} />
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
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: spacing.xl,
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', flex: 1 },
    badge: { backgroundColor: colors.red, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
    badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyText: { fontSize: 18, color: colors.textMuted, marginTop: 16 },
    emptySubtext: { fontSize: 14, color: colors.textDisabled, marginTop: 4, textAlign: 'center', lineHeight: 20 },

    cardWrapper: { paddingHorizontal: spacing.lg, marginTop: 12 },
    card: {
        backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg,
        borderWidth: 1, borderColor: colors.border,
        ...shadows.card,
    },

    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
    avatarContainer: { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' },
    avatar: {
        width: 46, height: 46, borderRadius: 23,
        backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: colors.border,
    },
    avatarImage: { width: 46, height: 46, borderRadius: 23 },
    avatarText: { color: colors.textMuted, fontSize: 15, fontWeight: 'bold' },
    passagerInfo: { flex: 1 },
    passagerNom: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    passagerSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    demandeDate: { fontSize: 11, color: colors.textDisabled, marginTop: 2 },

    separator: { height: 1, backgroundColor: colors.separator, marginVertical: 12 },

    trajetConducteur: { marginBottom: 10 },
    trajetLigne: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    trajetDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
    trajetDotArrivee: { backgroundColor: colors.accent },
    trajetVille: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, flex: 1 },
    trajetConnecteur: {
        flexDirection: 'row', alignItems: 'center',
        marginLeft: 3, gap: 4, marginVertical: 4,
    },
    trajetConnecteurLigne: { flex: 1, height: 1, backgroundColor: colors.separator },

    trajetPassagerContainer: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: colors.surfaceSecondary, borderRadius: radius.sm, padding: 10, marginBottom: 10,
    },
    trajetPassagerTexte: { fontSize: 13, color: colors.textMuted, flex: 1, lineHeight: 20 },
    trajetPassagerGras: { color: colors.textPrimary, fontWeight: '600' },

    detailsBloc: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    detailText: { fontSize: 13, color: colors.textMuted },

    boutonAccepter: {
        backgroundColor: colors.accent, borderRadius: radius.sm, padding: 13,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, marginBottom: 8,
    },
    boutonAccepterText: { color: 'white', fontSize: 14, fontWeight: 'bold' },

    boutonsSecondaires: { flexDirection: 'row', gap: 8 },

    boutonRefuser: {
        flex: 1, borderWidth: 1, borderColor: colors.red, borderRadius: radius.sm,
        paddingVertical: 10, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    boutonRefuserText: { color: colors.red, fontSize: 13, fontWeight: '600' },
});