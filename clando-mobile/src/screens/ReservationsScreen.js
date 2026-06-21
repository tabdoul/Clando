import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator,
    TextInput, RefreshControl, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { getUserId } from '../services/auth.service';

export default function ReservationsScreen({ navigation }) {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [prixNouveau, setPrixNouveau] = useState({});
    const [ongletActif, setOngletActif] = useState('encours');

    useFocusEffect(
        React.useCallback(() => {
            chargerReservations();
        }, [])
    );

    const chargerReservations = async () => {
        try {
            const userId = await getUserId();
            if (!userId) return;
            const response = await api.get(`/reservations/passager/${userId}`);
            setReservations(response.data);
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de charger les réservations');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await chargerReservations();
        setRefreshing(false);
    };

    const reservationsEnCours = reservations.filter(r =>
        ['EN_ATTENTE', 'CONFIRMEE', 'PRIX_REFUSE'].includes(r.statut)
    );

    const reservationsHistorique = reservations.filter(r =>
        ['TERMINEE', 'ANNULEE', 'REFUSEE'].includes(r.statut)
    );

    const annuler = async (reservation) => {
        const estConfirmee = reservation.statut === 'CONFIRMEE';
        Alert.alert(
            'Annuler la réservation',
            estConfirmee
                ? "Votre réservation est confirmée. Des frais d'annulation de 10% peuvent s'appliquer si le départ est dans moins de 2h."
                : 'Êtes-vous sûr de vouloir annuler cette réservation ?',
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Annuler la réservation',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await api.patch(`/reservations/${reservation.id}/annuler`);
                            chargerReservations();
                            Alert.alert('Réservation annulée', response.data.message || 'Votre réservation a été annulée.');
                        } catch (error) {
                            Alert.alert('Erreur', error.response?.data?.erreur || "Impossible d'annuler");
                        }
                    }
                }
            ]
        );
    };

    const nouvelleProposition = async (id) => {
        const prix = parseFloat(prixNouveau[id]);
        if (isNaN(prix) || prix <= 0) {
            Alert.alert('Erreur', 'Prix invalide');
            return;
        }
        try {
            await api.patch(`/reservations/${id}/nouvelle-proposition?nouveauPrix=${prix}`);
            chargerReservations();
            Alert.alert('Proposition envoyée !');
        } catch (error) {
            Alert.alert('Erreur', error.response?.data?.erreur || 'Erreur');
        }
    };

    const getStatutStyle = (statut) => {
        switch (statut) {
            case 'CONFIRMEE': return { bg: '#1a3a2a', text: '#2ecc71', label: 'Confirmée' };
            case 'EN_ATTENTE': return { bg: '#3a2a1a', text: '#f39c12', label: 'En attente' };
            case 'ANNULEE': return { bg: '#3a1a1a', text: '#e74c3c', label: 'Annulée' };
            case 'REFUSEE': return { bg: '#3a1a1a', text: '#e74c3c', label: 'Refusée' };
            case 'PRIX_REFUSE': return { bg: '#2a1a2a', text: '#9b59b6', label: 'Prix refusé' };
            case 'TERMINEE': return { bg: '#1a2a3a', text: '#00b5e2', label: 'Terminée' };
            default: return { bg: '#2a2a2a', text: '#888', label: statut };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const renderReservation = (item) => {
        const statut = getStatutStyle(item.statut);
        return (
            <View key={item.id.toString()} style={styles.cardWrapper}>
                <View style={styles.card}>
                    <View style={styles.cardTop}>
                        <View style={styles.trajetInfo}>
                            <Text style={styles.ville}>{item.villeDepart}</Text>
                            <View style={styles.ligne}>
                                <View style={styles.ligneBar} />
                                <Ionicons name="car-outline" size={16} color="#00b5e2" />
                                <View style={styles.ligneBar} />
                            </View>
                            <Text style={styles.ville}>{item.villeArrivee}</Text>
                        </View>
                        <View style={[styles.statutBadge, { backgroundColor: statut.bg }]}>
                            <Text style={[styles.statutText, { color: statut.text }]}>
                                {statut.label}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.cardBottom}>
                        <View style={styles.details}>
                            <View style={styles.detailRow}>
                                <Ionicons name="calendar-outline" size={14} color="#666" />
                                <Text style={styles.detailText}>
                                    Réservé le {formatDate(item.dateReservation)}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Ionicons name="person-outline" size={14} color="#666" />
                                <Text style={styles.detailText}>
                                    {item.nbPlaces} place(s)
                                </Text>
                            </View>
                            {item.prixPropose && (
                                <View style={styles.detailRow}>
                                    <Ionicons name="cash-outline" size={14} color="#00b5e2" />
                                    <Text style={[styles.detailText, { color: '#00b5e2' }]}>
                                        Prix proposé : {item.prixPropose?.toLocaleString()} GNF
                                    </Text>
                                </View>
                            )}
                            {item.statutPaiement === 'SUCCESS' && (
                                <View style={styles.detailRow}>
                                    <Ionicons name="checkmark-circle" size={14} color="#2ecc71" />
                                    <Text style={[styles.detailText, { color: '#2ecc71' }]}>
                                        Paiement confirmé
                                    </Text>
                                </View>
                            )}
                            {item.statutPaiement === 'PENDING' && (
                                <View style={styles.detailRow}>
                                    <Ionicons name="time-outline" size={14} color="#f39c12" />
                                    <Text style={[styles.detailText, { color: '#f39c12' }]}>
                                        Paiement en attente
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.boutonsContainer}>
                            {item.statut === 'CONFIRMEE' && (
                                <TouchableOpacity
                                    style={styles.boutonContacter}
                                    onPress={() => navigation.navigate('Chat', {
                                        reservationId: item.id,
                                        interlocuteur: {
                                            id: item.conducteurId,
                                            nom: item.conducteurNom,
                                            prenom: item.conducteurPrenom
                                        },
                                        userId: null
                                    })}>
                                    <Ionicons name="chatbubble-outline" size={14} color="#00b5e2" />
                                    <Text style={styles.boutonContacterText}>Contacter</Text>
                                </TouchableOpacity>
                            )}

                            {item.statut === 'TERMINEE' && (
                                <TouchableOpacity
                                    style={styles.boutonAvis}
                                    onPress={() => navigation.navigate('Avis', {
                                        conducteurId: item.conducteurId,
                                        conducteurNom: item.conducteurNom,
                                        conducteurPrenom: item.conducteurPrenom,
                                        trajetId: item.trajetId
                                    })}>
                                    <Ionicons name="star-outline" size={14} color="#f39c12" />
                                    <Text style={styles.boutonAvisText}>Laisser un avis</Text>
                                </TouchableOpacity>
                            )}

                            {(item.statut === 'EN_ATTENTE' || item.statut === 'CONFIRMEE') && (
                                <TouchableOpacity
                                    style={styles.boutonAnnuler}
                                    onPress={() => annuler(item)}>
                                    <Text style={styles.boutonAnnulerText}>Annuler</Text>
                                </TouchableOpacity>
                            )}

                            {item.urlPaiement && item.statutPaiement === 'PENDING' && (
                                <TouchableOpacity
                                    style={styles.boutonPayer}
                                    onPress={() => Linking.openURL(item.urlPaiement)}>
                                    <Ionicons name="card-outline" size={14} color="white" />
                                    <Text style={styles.boutonPayerText}>Payer</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {item.statut === 'PRIX_REFUSE' && (
                        <View style={styles.prixRefuseContainer}>
                            <Text style={styles.prixRefuseTexte}>
                                Prix refusé — Faites une nouvelle proposition
                            </Text>
                            <Text style={styles.tentativesRestantes}>
                                {2 - item.nbTentatives} tentative(s) restante(s)
                            </Text>
                            <View style={styles.nouvellePropositionRow}>
                                <TextInput
                                    style={styles.propositionInput}
                                    placeholder="Nouveau prix..."
                                    placeholderTextColor="#666"
                                    keyboardType="numeric"
                                    onChangeText={(v) => setPrixNouveau({ ...prixNouveau, [item.id]: v })}
                                    value={prixNouveau[item.id] || ''}
                                />
                                <TouchableOpacity
                                    style={styles.boutonProposer}
                                    onPress={() => nouvelleProposition(item.id)}>
                                    <Text style={styles.boutonProposerText}>Proposer</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size={36} color="#00b5e2" />
            </View>
        );
    }

    const listeActive = ongletActif === 'encours' ? reservationsEnCours : reservationsHistorique;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mes réservations</Text>
            </View>

            {/* Onglets */}
            <View style={styles.onglets}>
                <TouchableOpacity
                    style={[styles.onglet, ongletActif === 'encours' && styles.ongletActif]}
                    onPress={() => setOngletActif('encours')}>
                    <Text style={[styles.ongletText, ongletActif === 'encours' && styles.ongletTextActif]}>
                        En cours
                    </Text>
                    {reservationsEnCours.length > 0 && (
                        <View style={styles.ongletBadge}>
                            <Text style={styles.ongletBadgeText}>{reservationsEnCours.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.onglet, ongletActif === 'historique' && styles.ongletActif]}
                    onPress={() => setOngletActif('historique')}>
                    <Text style={[styles.ongletText, ongletActif === 'historique' && styles.ongletTextActif]}>
                        Historique
                    </Text>
                    {reservationsHistorique.length > 0 && (
                        <View style={[styles.ongletBadge, { backgroundColor: '#444' }]}>
                            <Text style={styles.ongletBadgeText}>{reservationsHistorique.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
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

                {listeActive.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name={ongletActif === 'encours' ? 'ticket-outline' : 'archive-outline'}
                            size={64} color="#444" />
                        <Text style={styles.emptyText}>
                            {ongletActif === 'encours' ? 'Aucune réservation en cours' : 'Aucun historique'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {ongletActif === 'encours'
                                ? 'Vos réservations actives apparaîtront ici'
                                : 'Vos trajets terminés et annulés apparaîtront ici'}
                        </Text>
                    </View>
                )}

                {listeActive.map((item) => renderReservation(item))}

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
        paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#eee' },
    onglets: {
        flexDirection: 'row',
        backgroundColor: '#1a1a1a',
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
    },
    onglet: {
        flex: 1, paddingVertical: 14,
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'row', gap: 6,
    },
    ongletActif: {
        borderBottomWidth: 2, borderBottomColor: '#00b5e2',
    },
    ongletText: { fontSize: 14, fontWeight: '600', color: '#666' },
    ongletTextActif: { color: '#00b5e2' },
    ongletBadge: {
        backgroundColor: '#00b5e2', borderRadius: 10,
        minWidth: 18, height: 18, alignItems: 'center',
        justifyContent: 'center', paddingHorizontal: 4,
    },
    ongletBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 18, color: '#666', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#444', marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },
    cardWrapper: { paddingHorizontal: 16, marginTop: 12 },
    card: {
        backgroundColor: '#1e1e1e', borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: '#2a2a2a',
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    trajetInfo: { flex: 1, alignItems: 'center', marginRight: 12 },
    ville: { fontSize: 15, fontWeight: '600', color: '#ddd' },
    ligne: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 5 },
    ligneBar: { flex: 1, height: 1, backgroundColor: '#333' },
    statutBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
    statutText: { fontSize: 12, fontWeight: '600' },
    separator: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 12 },
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    details: { gap: 6, flex: 1 },
    detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    detailText: { fontSize: 13, color: '#888' },
    boutonsContainer: { flexDirection: 'column', gap: 8, alignItems: 'flex-end' },
    boutonContacter: {
        borderWidth: 1, borderColor: '#00b5e2', borderRadius: 20,
        paddingVertical: 6, paddingHorizontal: 14,
        flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    boutonContacterText: { color: '#00b5e2', fontSize: 13, fontWeight: '600' },
    boutonAvis: {
        borderWidth: 1, borderColor: '#f39c12', borderRadius: 20,
        paddingVertical: 6, paddingHorizontal: 14,
        flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    boutonAvisText: { color: '#f39c12', fontSize: 13, fontWeight: '600' },
    boutonAnnuler: {
        borderWidth: 1, borderColor: '#e74c3c', borderRadius: 20,
        paddingVertical: 6, paddingHorizontal: 16,
    },
    boutonAnnulerText: { color: '#e74c3c', fontSize: 13, fontWeight: '600' },
    boutonPayer: {
        backgroundColor: '#00b5e2', borderRadius: 20,
        paddingVertical: 6, paddingHorizontal: 14,
        flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    boutonPayerText: { color: 'white', fontSize: 13, fontWeight: '600' },
    prixRefuseContainer: {
        backgroundColor: '#2a1a1a', borderRadius: 10, padding: 12,
        marginTop: 12, borderWidth: 1, borderColor: '#e74c3c',
    },
    prixRefuseTexte: { fontSize: 13, color: '#e74c3c', fontWeight: '600' },
    tentativesRestantes: { fontSize: 12, color: '#888', marginTop: 4, marginBottom: 8 },
    nouvellePropositionRow: { flexDirection: 'row', gap: 8 },
    propositionInput: {
        flex: 1, backgroundColor: '#252525', borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 8, color: '#eee',
        fontSize: 14, borderWidth: 1, borderColor: '#333',
    },
    boutonProposer: {
        backgroundColor: '#00b5e2', borderRadius: 8,
        paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
    },
    boutonProposerText: { color: 'white', fontSize: 13, fontWeight: 'bold' },
});