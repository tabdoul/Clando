import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator,
    RefreshControl, Image, TextInput, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { getUserId } from '../services/auth.service';

export default function NotificationsScreen({ navigation }) {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showContreOffreModal, setShowContreOffreModal] = useState(false);
    const [reservationSelectionnee, setReservationSelectionnee] = useState(null);
    const [contreOffre, setContreOffre] = useState('');
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
            item.prixPropose
                ? `Accepter la proposition de ${item.passagerPrenom} au prix de ${item.prixPropose?.toLocaleString()} GNF ?`
                : `Accepter la reservation de ${item.passagerPrenom} ${item.passagerNom} ?`,
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

    const ouvrirContreOffre = (item) => {
        setReservationSelectionnee(item);
        setContreOffre('');
        setShowContreOffreModal(true);
    };

    // ✅ CORRIGÉ — prixConducteur passé dans l'URL
    const envoyerContreOffre = async () => {
        const prix = parseFloat(contreOffre);
        if (isNaN(prix) || prix <= 0) {
            Alert.alert('Erreur', 'Veuillez entrer un prix valide');
            return;
        }
        setLoadingAction(true);
        try {
            await api.patch(
                `/reservations/${reservationSelectionnee.id}/negociation?accepter=false&prixConducteur=${prix}`
            );
            setShowContreOffreModal(false);
            chargerNotifications();
            Alert.alert(
                'Contre-offre envoyee !',
                `Votre proposition de ${prix.toLocaleString()} GNF a ete envoyee au passager.`
            );
        } catch (error) {
            Alert.alert('Erreur', "Impossible d'envoyer la contre-offre");
        } finally {
            setLoadingAction(false);
        }
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
                            // ✅ Pas de prixConducteur = refus simple
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
                        tintColor="#00b5e2"
                        colors={["#00b5e2"]}
                    />
                }>

                {reservations.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-outline" size={64} color="#333" />
                        <Text style={styles.emptyText}>Aucune demande en attente</Text>
                        <Text style={styles.emptySubtext}>
                            Les demandes de reservation apparaitront ici
                        </Text>
                    </View>
                )}

                {reservations.map((item) => (
                    <View key={item.id.toString()} style={styles.cardWrapper}>
                        <View style={styles.card}>

                            {/* Passager */}
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

                            {/* Trajet conducteur */}
                            <View style={styles.trajetConducteur}>
                                <View style={styles.trajetLigne}>
                                    <View style={styles.trajetDot} />
                                    <Text style={styles.trajetVille}>{item.villeDepart}</Text>
                                </View>
                                <View style={styles.trajetConnecteur}>
                                    <View style={styles.trajetConnecteurLigne} />
                                    <Ionicons name="arrow-down" size={12} color="#555" />
                                    <View style={styles.trajetConnecteurLigne} />
                                </View>
                                <View style={styles.trajetLigne}>
                                    <View style={[styles.trajetDot, styles.trajetDotArrivee]} />
                                    <Text style={styles.trajetVille}>{item.villeArrivee}</Text>
                                </View>
                            </View>

                            {/* Trajet passager */}
                            {item.departPassager && item.arriveePassager && (
                                <View style={styles.trajetPassagerContainer}>
                                    <Ionicons name="location-outline" size={14} color="#888" />
                                    <Text style={styles.trajetPassagerTexte}>
                                        {`Monte a `}
                                        <Text style={styles.trajetPassagerGras}>{item.departPassager}</Text>
                                        {` — Descend a `}
                                        <Text style={styles.trajetPassagerGras}>{item.arriveePassager}</Text>
                                    </Text>
                                </View>
                            )}

                            {/* Détails */}
                            <View style={styles.detailsBloc}>
                                <Ionicons name="person-outline" size={13} color="#555" />
                                <Text style={styles.detailText}>
                                    {`${item.nbPlaces} place(s) demandee(s)`}
                                </Text>
                            </View>

                            {/* Prix proposé */}
                            {item.prixPropose && (
                                <View style={styles.prixBloc}>
                                    <View style={styles.prixItem}>
                                        <Text style={styles.prixItemLabel}>Prix passager</Text>
                                        <Text style={styles.prixItemValeur}>
                                            {item.prixPropose?.toLocaleString()} GNF
                                        </Text>
                                    </View>
                                </View>
                            )}

                            <View style={styles.separator} />

                            {/* Bouton principal */}
                            <TouchableOpacity
                                style={styles.boutonAccepter}
                                onPress={() => accepter(item)}
                                disabled={loadingAction}>
                                <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                                <Text style={styles.boutonAccepterText}>
                                    {item.prixPropose ? 'Accepter ce prix' : 'Accepter la reservation'}
                                </Text>
                            </TouchableOpacity>

                            {/* Boutons secondaires */}
                            <View style={styles.boutonsSecondaires}>
                                <TouchableOpacity
                                    style={styles.boutonContreOffre}
                                    onPress={() => ouvrirContreOffre(item)}
                                    disabled={loadingAction}>
                                    <Ionicons name="swap-horizontal-outline" size={14} color="#888" />
                                    <Text style={styles.boutonContreOffreText}>Proposer mon prix</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.boutonRefuser}
                                    onPress={() => refuser(item)}
                                    disabled={loadingAction}>
                                    <Ionicons name="close-circle-outline" size={14} color="#e74c3c" />
                                    <Text style={styles.boutonRefuserText}>Refuser</Text>
                                </TouchableOpacity>
                            </View>

                        </View>
                    </View>
                ))}

                <View style={{ height: 30 }} />
            </ScrollView>

            {/* Modal contre-offre */}
            <Modal
                visible={showContreOffreModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowContreOffreModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Proposer mon prix</Text>
                            <TouchableOpacity onPress={() => setShowContreOffreModal(false)}>
                                <Ionicons name="close" size={24} color="#eee" />
                            </TouchableOpacity>
                        </View>

                        {reservationSelectionnee && (
                            <Text style={styles.modalSubtitle}>
                                {`Le passager a propose ${reservationSelectionnee.prixPropose?.toLocaleString()} GNF`}
                            </Text>
                        )}

                        <View style={styles.modalInfo}>
                            <Ionicons name="information-circle-outline" size={16} color="#888" />
                            <Text style={styles.modalInfoText}>
                                Entrez le prix que vous souhaitez. Le passager pourra l'accepter ou refuser.
                            </Text>
                        </View>

                        <Text style={styles.modalLabel}>Votre prix</Text>
                        <View style={styles.modalInput}>
                            <Ionicons name="cash-outline" size={18} color="#888" />
                            <TextInput
                                style={styles.modalInputText}
                                placeholder="Ex: 45000"
                                placeholderTextColor="#555"
                                value={contreOffre}
                                onChangeText={setContreOffre}
                                keyboardType="numeric"
                                returnKeyType="done"
                                autoFocus
                            />
                            <Text style={styles.modalDevise}>GNF</Text>
                        </View>

                        <View style={styles.modalBoutons}>
                            <TouchableOpacity
                                style={styles.modalBoutonAnnuler}
                                onPress={() => setShowContreOffreModal(false)}>
                                <Text style={styles.modalBoutonAnnulerText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBoutonConfirmer, loadingAction && { opacity: 0.7 }]}
                                onPress={envoyerContreOffre}
                                disabled={loadingAction}>
                                {loadingAction ? (
                                    <ActivityIndicator color="white" size={18} />
                                ) : (
                                    <Text style={styles.modalBoutonConfirmerText}>Envoyer</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    loadingContainer: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: '#1a1a1a', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#eee', flex: 1 },
    badge: { backgroundColor: '#00b5e2', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
    badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyText: { fontSize: 18, color: '#555', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#444', marginTop: 4, textAlign: 'center', lineHeight: 20 },

    cardWrapper: { paddingHorizontal: 16, marginTop: 12 },
    card: {
        backgroundColor: '#1e1e1e', borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: '#2a2a2a',
    },

    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
    avatarContainer: { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' },
    avatar: {
        width: 46, height: 46, borderRadius: 23,
        backgroundColor: '#252525', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#333',
    },
    avatarImage: { width: 46, height: 46, borderRadius: 23 },
    avatarText: { color: '#888', fontSize: 15, fontWeight: 'bold' },
    passagerInfo: { flex: 1 },
    passagerNom: { fontSize: 15, fontWeight: '700', color: '#eee' },
    passagerSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
    demandeDate: { fontSize: 11, color: '#444', marginTop: 2 },

    separator: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 12 },

    trajetConducteur: { marginBottom: 10 },
    trajetLigne: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    trajetDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00b5e2' },
    trajetDotArrivee: { backgroundColor: '#444' },
    trajetVille: { fontSize: 15, fontWeight: '600', color: '#ddd', flex: 1 },
    trajetConnecteur: {
        flexDirection: 'row', alignItems: 'center',
        marginLeft: 3, gap: 4, marginVertical: 4,
    },
    trajetConnecteurLigne: { flex: 1, height: 1, backgroundColor: '#2a2a2a' },

    trajetPassagerContainer: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: '#252525', borderRadius: 10, padding: 10, marginBottom: 10,
    },
    trajetPassagerTexte: { fontSize: 13, color: '#888', flex: 1, lineHeight: 20 },
    trajetPassagerGras: { color: '#ddd', fontWeight: '600' },

    detailsBloc: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    detailText: { fontSize: 13, color: '#666' },

    prixBloc: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#252525', borderRadius: 10, padding: 12, marginBottom: 4,
    },
    prixItem: { alignItems: 'center' },
    prixItemLabel: { fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: 1 },
    prixItemValeur: { fontSize: 18, fontWeight: 'bold', color: '#00b5e2', marginTop: 4 },

    boutonAccepter: {
        backgroundColor: '#00b5e2', borderRadius: 10, padding: 13,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, marginBottom: 8,
    },
    boutonAccepterText: { color: 'white', fontSize: 14, fontWeight: 'bold' },

    boutonsSecondaires: { flexDirection: 'row', gap: 8 },
    boutonContreOffre: {
        flex: 1, borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 10,
        paddingVertical: 10, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    boutonContreOffreText: { color: '#888', fontSize: 13, fontWeight: '600' },
    boutonRefuser: {
        flex: 1, borderWidth: 1, borderColor: '#e74c3c', borderRadius: 10,
        paddingVertical: 10, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    boutonRefuserText: { color: '#e74c3c', fontSize: 13, fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalCard: {
        backgroundColor: '#1e1e1e', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 24, borderTopWidth: 1, borderColor: '#2a2a2a',
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 8,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#eee' },
    modalSubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
    modalInfo: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: '#252525', borderRadius: 10, padding: 12, marginBottom: 16,
    },
    modalInfoText: { fontSize: 13, color: '#888', flex: 1, lineHeight: 20 },
    modalLabel: {
        fontSize: 12, fontWeight: '600', color: '#888',
        marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1,
    },
    modalInput: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#252525', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 4,
        borderWidth: 1, borderColor: '#333', marginBottom: 20,
    },
    modalInputText: { flex: 1, padding: 10, fontSize: 16, color: '#eee' },
    modalDevise: { color: '#666', fontSize: 14 },
    modalBoutons: { flexDirection: 'row', gap: 12 },
    modalBoutonAnnuler: {
        flex: 1, borderWidth: 1, borderColor: '#333',
        borderRadius: 10, padding: 14, alignItems: 'center',
    },
    modalBoutonAnnulerText: { color: '#666', fontSize: 15, fontWeight: '600' },
    modalBoutonConfirmer: {
        flex: 1, backgroundColor: '#00b5e2',
        borderRadius: 10, padding: 14, alignItems: 'center',
    },
    modalBoutonConfirmerText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
});