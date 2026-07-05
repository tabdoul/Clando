import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, ActivityIndicator,
    Alert, RefreshControl, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { getUserId } from '../services/auth.service';
import { colors, spacing, radius, shadows } from '../../constants/theme';

export default function MessagesScreen({ navigation }) {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userId, setUserId] = useState(null);

    useFocusEffect(
        React.useCallback(() => {
            chargerConversations();
        }, [])
    );

    const chargerConversations = async () => {
        try {
            const id = await getUserId();
            setUserId(id);
            if (!id) return;

            const response = await api.get(`/messages/conversations/${id}`);

            const grouped = {};
            response.data.forEach(msg => {
                const resId = msg.reservationId;
                if (!grouped[resId]) {
                    grouped[resId] = {
                        reservationId: resId,
                        dernierMessage: msg,
                        nbNonLus: 0,
                        interlocuteur: msg.expediteurId === id
                            ? {
                                id: msg.destinataireId,
                                nom: msg.destinataireNom,
                                prenom: msg.destinatairePrenom,
                                photo: msg.destinatairePhoto
                            }
                            : {
                                id: msg.expediteurId,
                                nom: msg.expediteurNom,
                                prenom: msg.expediteurPrenom,
                                photo: msg.expediteurPhoto
                            }
                    };
                }
                if (msg.destinataireId === id && !msg.lu) {
                    grouped[resId].nbNonLus++;
                }
            });

            setConversations(Object.values(grouped));
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de charger les messages');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await chargerConversations();
        setRefreshing(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const maintenant = new Date();
        const diff = maintenant - date;
        const heures = Math.floor(diff / (1000 * 60 * 60));
        if (heures < 24) return `${heures}h`;
        const jours = Math.floor(heures / 24);
        return `${jours}j`;
    };

    const getInitiales = (nom, prenom) => {
        return `${prenom?.charAt(0) || ''}${nom?.charAt(0) || ''}`.toUpperCase();
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
                <Text style={styles.headerTitle}>Messages</Text>
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

                {conversations.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubble-outline" size={64} color={colors.border} />
                        <Text style={styles.emptyText}>Aucun message</Text>
                        <Text style={styles.emptySubtext}>
                            Vos conversations apparaîtront ici après une réservation confirmée
                        </Text>
                    </View>
                )}

                {conversations.map((conv) => {
                    const nbNonLus = conv.nbNonLus || 0;
                    return (
                        <TouchableOpacity
                            key={conv.reservationId.toString()}
                            style={styles.convItem}
                            onPress={() => navigation.navigate('Chat', {
                                reservationId: conv.reservationId,
                                interlocuteur: conv.interlocuteur,
                                userId
                            })}>

                            <View style={styles.avatar}>
                                {conv.interlocuteur.photo ? (
                                    <Image
                                        source={{ uri: conv.interlocuteur.photo }}
                                        style={styles.avatarImage}
                                    />
                                ) : (
                                    <Text style={styles.avatarText}>
                                        {getInitiales(conv.interlocuteur.nom, conv.interlocuteur.prenom)}
                                    </Text>
                                )}
                            </View>

                            <View style={styles.convInfo}>
                                <View style={styles.convHeader}>
                                    <Text style={[styles.convNom, nbNonLus > 0 && styles.convNomNonLu]}>
                                        {conv.interlocuteur.prenom} {conv.interlocuteur.nom}
                                    </Text>
                                    <Text style={styles.convDate}>
                                        {formatDate(conv.dernierMessage.dateEnvoi)}
                                    </Text>
                                </View>
                                <View style={styles.convFooter}>
                                    <Text
                                        style={[styles.convDernierMessage, nbNonLus > 0 && styles.convMessageNonLu]}
                                        numberOfLines={1}>
                                        {conv.dernierMessage.contenu}
                                    </Text>
                                    {nbNonLus > 0 && (
                                        <View style={styles.badgeNonLu}>
                                            <Text style={styles.badgeNonLuText}>
                                                {nbNonLus > 9 ? '9+' : nbNonLus}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}

                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    loadingContainer: {
        flex: 1, backgroundColor: '#ffffff',
        justifyContent: 'center', alignItems: 'center'
    },
    header: {
        backgroundColor: '#182D5A',
        paddingTop: 60, paddingBottom: 20, paddingHorizontal: spacing.xl,
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    emptyContainer: {
        alignItems: 'center', marginTop: 80, paddingHorizontal: 40,
    },
    emptyText: { fontSize: 18, color: '#888888', marginTop: 16 },
    emptySubtext: {
        fontSize: 14, color: '#cccccc', marginTop: 4,
        textAlign: 'center', lineHeight: 20,
    },
    convItem: {
        flexDirection: 'row', alignItems: 'center',
        padding: spacing.lg, borderBottomWidth: 1,
        borderBottomColor: '#EEF2F7', gap: 12,
    },
    avatarImage: { width: 48, height: 48, borderRadius: 24 },
    avatar: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: '#182D5A', alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    convInfo: { flex: 1 },
    convHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 4,
    },
    convNom: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
    convNomNonLu: { fontWeight: 'bold', color: '#1a1a1a' },
    convDate: { fontSize: 12, color: '#888888' },
    convFooter: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
    },
    convDernierMessage: { fontSize: 13, color: '#888888', flex: 1 },
    convMessageNonLu: { color: '#1a1a1a', fontWeight: '600' },
    badgeNonLu: {
        backgroundColor: '#182D5A', borderRadius: 10,
        minWidth: 18, height: 18, alignItems: 'center',
        justifyContent: 'center', paddingHorizontal: 4, marginLeft: 8,
    },
    badgeNonLuText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
});