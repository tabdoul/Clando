import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator,
    TextInput, RefreshControl, Linking, Modal, Image, Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { getUserId } from '../services/auth.service';

const CompteARebours = ({ dateConfirmation }) => {
    const [tempsRestant, setTempsRestant] = useState('');
    const [expire, setExpire] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!dateConfirmation) return;
            const confirmation = new Date(dateConfirmation);
            const expiration = new Date(confirmation.getTime() + 30 * 60 * 1000);
            const maintenant = new Date();
            const diff = expiration - maintenant;
            if (diff <= 0) {
                setExpire(true);
                setTempsRestant('Expire');
                clearInterval(interval);
            } else {
                const minutes = Math.floor(diff / 1000 / 60);
                const secondes = Math.floor((diff / 1000) % 60);
                setTempsRestant(`${minutes}m ${secondes < 10 ? '0' : ''}${secondes}s`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [dateConfirmation]);

    // ✅ On n'affiche plus rien si expiré
    if (expire) return null;

    return (
        <View style={styles.rebours}>
            <Ionicons name="time-outline" size={13} color="#888" />
            <Text style={styles.reboursText}>
                Temps restant pour payer : {tempsRestant}
            </Text>
        </View>
    );
};

export default function ReservationsScreen({ navigation }) {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [prixNouveau, setPrixNouveau] = useState({});
    const [ongletActif, setOngletActif] = useState('encours');

    const [showCopassagers, setShowCopassagers] = useState(false);
    const [copassagers, setCopassagers] = useState([]);
    const [loadingCopassagers, setLoadingCopassagers] = useState(false);
    const [reservationSelectionnee, setReservationSelectionnee] = useState(null);

    const [showModalPaiement, setShowModalPaiement] = useState(false);
    const [numeroPaiement, setNumeroPaiement] = useState('');
    const [reservationAPayer, setReservationAPayer] = useState(null);
    const [loadingPaiement, setLoadingPaiement] = useState(false);

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
            Alert.alert('Erreur', 'Impossible de charger les reservations');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await chargerReservations();
        setRefreshing(false);
    };

    const ouvrirModalPaiement = (reservation) => {
        setReservationAPayer(reservation);
        setNumeroPaiement('');
        setShowModalPaiement(true);
    };

    const initierPaiement = async () => {
        if (!numeroPaiement || numeroPaiement.trim() === '') {
            Alert.alert('Erreur', 'Veuillez entrer votre numero Orange Money');
            return;
        }
        setLoadingPaiement(true);
        try {
            await api.post(`/reservations/${reservationAPayer.id}/payer?numeroTelephone=${numeroPaiement.trim()}`);
            setShowModalPaiement(false);
            Alert.alert(
                'Demande envoyee !',
                'Vous allez recevoir une notification Orange Money. Confirmez avec votre code PIN.',
                [{ text: 'OK', onPress: () => chargerReservations() }]
            );
        } catch (err) {
            Alert.alert('Erreur', err.response?.data?.erreur || 'Erreur lors du paiement');
        } finally {
            setLoadingPaiement(false);
        }
    };

    const voirCopassagers = async (reservation) => {
        setReservationSelectionnee(reservation);
        setShowCopassagers(true);
        setLoadingCopassagers(true);
        try {
            const res = await api.get(`/reservations/trajet/${reservation.trajetId}/passagers`);
            const userId = await getUserId();
            setCopassagers(res.data.filter(p => Number(p.passagerId) !== Number(userId)));
        } catch (err) {
            Alert.alert('Erreur', 'Impossible de charger les copassagers');
        } finally {
            setLoadingCopassagers(false);
        }
    };

    const annuler = async (reservation) => {
        Alert.alert(
            'Annuler la reservation',
            reservation.statut === 'CONFIRMEE'
                ? "Des frais de 10% peuvent s'appliquer si le depart est dans moins de 2h."
                : 'Etes-vous sur de vouloir annuler ?',
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Annuler', style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await api.patch(`/reservations/${reservation.id}/annuler`);
                            chargerReservations();
                            Alert.alert('Annulee', response.data.message || 'Reservation annulee.');
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
        if (isNaN(prix) || prix <= 0) { Alert.alert('Erreur', 'Prix invalide'); return; }
        try {
            await api.patch(`/reservations/${id}/nouvelle-proposition?nouveauPrix=${prix}`);
            chargerReservations();
            Alert.alert('Proposition envoyee !');
        } catch (error) {
            Alert.alert('Erreur', error.response?.data?.erreur || 'Erreur');
        }
    };

    const getStatutStyle = (statut) => {
        switch (statut) {
            case 'CONFIRMEE': return { bg: '#252525', text: '#eee', label: 'Confirmee' };
            case 'EN_ATTENTE': return { bg: '#252525', text: '#888', label: 'En attente' };
            case 'ANNULEE': return { bg: '#252525', text: '#666', label: 'Annulee' };
            case 'REFUSEE': return { bg: '#252525', text: '#666', label: 'Refusee' };
            case 'PRIX_REFUSE': return { bg: '#252525', text: '#888', label: 'Prix refuse' };
            case 'TERMINEE': return { bg: '#252525', text: '#666', label: 'Terminee' };
            default: return { bg: '#252525', text: '#666', label: statut };
        }
    };

    // ✅ Indicateur coloré minimaliste selon statut
    const getStatutIndicateur = (statut) => {
        switch (statut) {
            case 'CONFIRMEE': return '#00b5e2';
            case 'EN_ATTENTE': return '#555';
            case 'ANNULEE': return '#333';
            case 'REFUSEE': return '#333';
            case 'PRIX_REFUSE': return '#555';
            case 'TERMINEE': return '#333';
            default: return '#333';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    };

    const renderReservation = (item) => {
        const statut = getStatutStyle(item.statut);
        const indicateur = getStatutIndicateur(item.statut);
        const doitPayer = item.statut === 'CONFIRMEE' && item.statutPaiement !== 'SUCCESS';
        const aPaye = item.statutPaiement === 'SUCCESS';

        return (
            <View key={item.id.toString()} style={styles.cardWrapper}>
                <View style={[styles.card, { borderLeftColor: indicateur }]}>

                    {/* En-tête */}
                    <View style={styles.cardHeader}>
                        <View style={styles.trajetRow}>
                            <Text style={styles.ville}>{item.villeDepart}</Text>
                            <Ionicons name="arrow-forward" size={13} color="#555" />
                            <Text style={styles.ville}>{item.villeArrivee}</Text>
                        </View>
                        <View style={[styles.statutBadge, { backgroundColor: statut.bg }]}>
                            <Text style={[styles.statutText, { color: statut.text }]}>{statut.label}</Text>
                        </View>
                    </View>

                    {/* Trajet passager */}
                    {item.departPassager && item.arriveePassager && (
                        <View style={styles.trajetPassager}>
                            <Ionicons name="location-outline" size={13} color="#666" />
                            <Text style={styles.trajetPassagerText}>
                                {item.departPassager} → {item.arriveePassager}
                            </Text>
                        </View>
                    )}

                    {/* Méta */}
                    <View style={styles.metaRow}>
                        <Ionicons name="calendar-outline" size={12} color="#555" />
                        <Text style={styles.metaText}>{formatDate(item.dateReservation)}</Text>
                        <Text style={styles.metaDot}>·</Text>
                        <Text style={styles.metaText}>{item.nbPlaces} place(s)</Text>
                        {item.prixPropose && (
                            <>
                                <Text style={styles.metaDot}>·</Text>
                                <Text style={styles.metaText}>
                                    {item.prixPropose.toLocaleString()} GNF propose
                                </Text>
                            </>
                        )}
                    </View>

                    {/* Compte à rebours — sobre, sans rouge */}
                    {doitPayer && item.dateConfirmation && (
                        <CompteARebours dateConfirmation={item.dateConfirmation} />
                    )}

                    {/* Paiement confirmé */}
                    {aPaye && (
                        <View style={styles.paiementOk}>
                            <Ionicons name="checkmark-circle" size={14} color="#00b5e2" />
                            <Text style={styles.paiementOkText}>
                                Paiement confirme · {item.prix?.toLocaleString()} GNF
                            </Text>
                        </View>
                    )}

                    {/* EN_ATTENTE */}
                    {item.statut === 'EN_ATTENTE' && (
                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.btnAnnuler} onPress={() => annuler(item)}>
                                <Text style={styles.btnAnnulerText}>Annuler la demande</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* CONFIRMEE non payée */}
                    {item.statut === 'CONFIRMEE' && doitPayer && (
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.btnPayer}
                                onPress={() => ouvrirModalPaiement(item)}>
                                <Ionicons name="phone-portrait-outline" size={16} color="white" />
                                <Text style={styles.btnPayerText}>Payer avec Orange Money</Text>
                            </TouchableOpacity>
                            <View style={styles.actionsSecondaires}>
                                <TouchableOpacity
                                    style={styles.btnSm}
                                    onPress={() => navigation.navigate('Chat', {
                                        reservationId: item.id,
                                        interlocuteur: { id: item.conducteurId, nom: item.conducteurNom, prenom: item.conducteurPrenom },
                                        userId: null
                                    })}>
                                    <Ionicons name="chatbubble-outline" size={13} color="#00b5e2" />
                                    <Text style={[styles.btnSmText, { color: '#00b5e2' }]}>Contacter</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.btnSm, styles.btnSmDanger]}
                                    onPress={() => annuler(item)}>
                                    <Ionicons name="close" size={13} color="#e74c3c" />
                                    <Text style={[styles.btnSmText, { color: '#e74c3c' }]}>Annuler</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* CONFIRMEE payée */}
                    {item.statut === 'CONFIRMEE' && aPaye && (
                        <View style={styles.actions}>
                            <View style={styles.actionsSecondaires}>
                                <TouchableOpacity
                                    style={[styles.btnSm, { flex: 1 }]}
                                    onPress={() => navigation.navigate('Chat', {
                                        reservationId: item.id,
                                        interlocuteur: { id: item.conducteurId, nom: item.conducteurNom, prenom: item.conducteurPrenom },
                                        userId: null
                                    })}>
                                    <Ionicons name="chatbubble-outline" size={13} color="#00b5e2" />
                                    <Text style={[styles.btnSmText, { color: '#00b5e2' }]}>Contacter</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.btnSm, { flex: 1 }]}
                                    onPress={() => voirCopassagers(item)}>
                                    <Ionicons name="people-outline" size={13} color="#888" />
                                    <Text style={[styles.btnSmText, { color: '#888' }]}>Copassagers</Text>
                                </TouchableOpacity>
                                {item.trajetDemarre && item.latitudeConducteur && (
                                    <TouchableOpacity
                                        style={[styles.btnSm, styles.btnSmBleu, { flex: 1 }]}
                                        onPress={() => Linking.openURL(`https://www.google.com/maps?q=${item.latitudeConducteur},${item.longitudeConducteur}`)}>
                                        <Ionicons name="navigate-outline" size={13} color="white" />
                                        <Text style={[styles.btnSmText, { color: 'white' }]}>Position</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}

                    {/* TERMINEE */}
                    {item.statut === 'TERMINEE' && (
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.btnAvis}
                                onPress={() => navigation.navigate('Avis', {
                                    conducteurId: item.conducteurId,
                                    conducteurNom: item.conducteurNom,
                                    conducteurPrenom: item.conducteurPrenom,
                                    trajetId: item.trajetId
                                })}>
                                <Ionicons name="star-outline" size={15} color="#888" />
                                <Text style={styles.btnAvisText}>Laisser un avis</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* PRIX_REFUSE */}
                    {item.statut === 'PRIX_REFUSE' && (
                        <View style={styles.prixRefuseContainer}>
                            <Text style={styles.prixRefuseTexte}>
                                Le conducteur a refuse votre prix — {2 - item.nbTentatives} tentative(s) restante(s)
                            </Text>
                            <View style={styles.nouvellePropositionRow}>
                                <TextInput
                                    style={styles.propositionInput}
                                    placeholder="Nouveau prix en GNF..."
                                    placeholderTextColor="#555"
                                    keyboardType="numeric"
                                    onChangeText={(v) => setPrixNouveau({ ...prixNouveau, [item.id]: v })}
                                    value={prixNouveau[item.id] || ''}
                                />
                                <TouchableOpacity style={styles.boutonProposer} onPress={() => nouvelleProposition(item.id)}>
                                    <Text style={styles.boutonProposerText}>Envoyer</Text>
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

    const reservationsEnCours = reservations.filter(r =>
        ['EN_ATTENTE', 'CONFIRMEE', 'PRIX_REFUSE'].includes(r.statut)
    );
    const reservationsHistorique = reservations.filter(r =>
        ['TERMINEE', 'ANNULEE', 'REFUSEE'].includes(r.statut)
    );
    const listeActive = ongletActif === 'encours' ? reservationsEnCours : reservationsHistorique;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mes reservations</Text>
            </View>

            <View style={styles.onglets}>
                <TouchableOpacity
                    style={[styles.onglet, ongletActif === 'encours' && styles.ongletActif]}
                    onPress={() => setOngletActif('encours')}>
                    <Text style={[styles.ongletText, ongletActif === 'encours' && styles.ongletTextActif]}>En cours</Text>
                    {reservationsEnCours.length > 0 && (
                        <View style={styles.ongletBadge}>
                            <Text style={styles.ongletBadgeText}>{reservationsEnCours.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.onglet, ongletActif === 'historique' && styles.ongletActif]}
                    onPress={() => setOngletActif('historique')}>
                    <Text style={[styles.ongletText, ongletActif === 'historique' && styles.ongletTextActif]}>Historique</Text>
                    {reservationsHistorique.length > 0 && (
                        <View style={[styles.ongletBadge, { backgroundColor: '#333' }]}>
                            <Text style={styles.ongletBadgeText}>{reservationsHistorique.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00b5e2" colors={["#00b5e2"]} />}>

                {listeActive.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Ionicons name={ongletActif === 'encours' ? 'ticket-outline' : 'archive-outline'} size={64} color="#333" />
                        <Text style={styles.emptyText}>
                            {ongletActif === 'encours' ? 'Aucune reservation en cours' : 'Aucun historique'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {ongletActif === 'encours' ? 'Vos reservations actives apparaitront ici' : 'Vos trajets termines et annules apparaitront ici'}
                        </Text>
                    </View>
                )}

                {listeActive.map((item) => renderReservation(item))}
                <View style={{ height: 30 }} />
            </ScrollView>

            {/* Modal copassagers */}
            <Modal visible={showCopassagers} transparent animationType="slide" onRequestClose={() => setShowCopassagers(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Copassagers</Text>
                                {reservationSelectionnee && (
                                    <Text style={styles.modalSubtitle}>
                                        {reservationSelectionnee.villeDepart} → {reservationSelectionnee.villeArrivee}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setShowCopassagers(false)}>
                                <Ionicons name="close" size={24} color="#eee" />
                            </TouchableOpacity>
                        </View>
                        {loadingCopassagers ? (
                            <ActivityIndicator color="#00b5e2" style={{ marginTop: 20 }} />
                        ) : copassagers.length === 0 ? (
                            <View style={styles.modalVide}>
                                <Ionicons name="people-outline" size={48} color="#333" />
                                <Text style={styles.modalVideText}>Aucun autre passager confirme</Text>
                            </View>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {copassagers.map((p) => {
                                    const initiales = `${(p.passagerPrenom || '?')[0]}${(p.passagerNom || '?')[0]}`.toUpperCase();
                                    return (
                                        <View key={p.id.toString()} style={styles.passagerCard}>
                                            {p.passagerPhoto ? (
                                                <Image source={{ uri: p.passagerPhoto }} style={styles.passagerAvatar} />
                                            ) : (
                                                <View style={styles.passagerAvatarPlaceholder}>
                                                    <Text style={styles.passagerInitiales}>{initiales}</Text>
                                                </View>
                                            )}
                                            <View style={styles.passagerInfos}>
                                                <Text style={styles.passagerNom}>{p.passagerPrenom} {p.passagerNom}</Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Modal paiement OM */}
            <Modal visible={showModalPaiement} transparent animationType="slide" onRequestClose={() => setShowModalPaiement(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Paiement</Text>
                                {reservationAPayer && (
                                    <Text style={styles.modalSubtitle}>
                                        {reservationAPayer.departPassager || reservationAPayer.villeDepart} → {reservationAPayer.arriveePassager || reservationAPayer.villeArrivee}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setShowModalPaiement(false)}>
                                <Ionicons name="close" size={24} color="#eee" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.paiementDetail}>
                            <View style={styles.paiementDetailLigne}>
                                <Text style={styles.paiementDetailLabel}>Prix trajet</Text>
                                <Text style={styles.paiementDetailValeur}>
                                    {reservationAPayer ? Math.round((reservationAPayer.prix || 0) / 1.13).toLocaleString() : 0} GNF
                                </Text>
                            </View>
                            <View style={styles.paiementDetailLigne}>
                                <Text style={styles.paiementDetailLabel}>Frais de service</Text>
                                <Text style={styles.paiementDetailValeur}>
                                    {reservationAPayer ? Math.round((reservationAPayer.prix || 0) - (reservationAPayer.prix || 0) / 1.13).toLocaleString() : 0} GNF
                                </Text>
                            </View>
                            <View style={styles.paiementDetailSeparator} />
                            <View style={styles.paiementDetailLigne}>
                                <Text style={[styles.paiementDetailLabel, { color: '#eee', fontWeight: 'bold' }]}>Total</Text>
                                <Text style={[styles.paiementDetailValeur, { color: '#00b5e2', fontWeight: 'bold', fontSize: 18 }]}>
                                    {reservationAPayer?.prix?.toLocaleString() || 0} GNF
                                </Text>
                            </View>
                        </View>

                        <View style={styles.paiementInfo}>
                            <Ionicons name="information-circle-outline" size={16} color="#888" />
                            <Text style={styles.paiementInfoTexte}>
                                Vous recevrez une notification Orange Money. Confirmez avec votre code PIN.
                            </Text>
                        </View>

                        <Text style={styles.paiementLabel}>Numéro Orange Money</Text>
                        <View style={styles.paiementInput}>
                            <Ionicons name="phone-portrait-outline" size={18} color="#888" />
                            <TextInput
                                style={styles.paiementInputText}
                                placeholder="Ex: 620000000"
                                placeholderTextColor="#555"
                                value={numeroPaiement}
                                onChangeText={setNumeroPaiement}
                                keyboardType="phone-pad"
                                maxLength={12}
                                returnKeyType="done"
                                onSubmitEditing={() => Keyboard.dismiss()}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.boutonConfirmerPaiement, loadingPaiement && { opacity: 0.7 }]}
                            onPress={initierPaiement}
                            disabled={loadingPaiement}>
                            {loadingPaiement ? (
                                <ActivityIndicator color="white" size={20} />
                            ) : (
                                <>
                                    <Ionicons name="phone-portrait-outline" size={18} color="white" />
                                    <Text style={styles.boutonConfirmerPaiementText}>Confirmer le paiement</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    loadingContainer: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
    header: { backgroundColor: '#1a1a1a', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#eee' },

    onglets: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
    onglet: { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
    ongletActif: { borderBottomWidth: 2, borderBottomColor: '#00b5e2' },
    ongletText: { fontSize: 14, fontWeight: '600', color: '#555' },
    ongletTextActif: { color: '#00b5e2' },
    ongletBadge: { backgroundColor: '#00b5e2', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    ongletBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 18, color: '#555', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#444', marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },

    cardWrapper: { paddingHorizontal: 16, marginTop: 12 },
    card: { backgroundColor: '#1e1e1e', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2a2a2a', borderLeftWidth: 3 },

    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    trajetRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    ville: { fontSize: 15, fontWeight: '600', color: '#ddd' },
    statutBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
    statutText: { fontSize: 11, fontWeight: '600' },

    trajetPassager: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
    trajetPassagerText: { fontSize: 12, color: '#666' },

    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8, flexWrap: 'wrap' },
    metaText: { fontSize: 12, color: '#555' },
    metaDot: { color: '#333', fontSize: 12 },

    rebours: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#252525', borderRadius: 8, padding: 8, marginBottom: 10 },
    reboursText: { fontSize: 12, color: '#888' },

    paiementOk: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#252525', borderRadius: 8, padding: 8, marginBottom: 10 },
    paiementOkText: { fontSize: 12, color: '#00b5e2', fontWeight: '600' },

    actions: { marginTop: 4 },

    btnPayer: {
        backgroundColor: '#00b5e2', borderRadius: 10, padding: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8,
    },
    btnPayerText: { color: 'white', fontSize: 14, fontWeight: 'bold' },

    actionsSecondaires: { flexDirection: 'row', gap: 8 },

    btnSm: {
        flex: 1, borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 8,
        paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    },
    btnSmDanger: { borderColor: '#e74c3c' },
    btnSmBleu: { backgroundColor: '#00b5e2', borderColor: '#00b5e2' },
    btnSmText: { fontSize: 12, fontWeight: '600' },

    btnAnnuler: {
        borderWidth: 1, borderColor: '#e74c3c', borderRadius: 10, padding: 10, alignItems: 'center',
    },
    btnAnnulerText: { color: '#e74c3c', fontSize: 13, fontWeight: '600' },

    btnAvis: {
        borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 10,
        padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    btnAvisText: { color: '#888', fontSize: 13, fontWeight: '600' },

    prixRefuseContainer: { backgroundColor: '#252525', borderRadius: 10, padding: 12, marginTop: 8, borderWidth: 1, borderColor: '#2a2a2a' },
    prixRefuseTexte: { fontSize: 13, color: '#888', marginBottom: 8 },
    nouvellePropositionRow: { flexDirection: 'row', gap: 8 },
    propositionInput: { flex: 1, backgroundColor: '#1e1e1e', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: '#eee', fontSize: 14, borderWidth: 1, borderColor: '#333' },
    boutonProposer: { backgroundColor: '#00b5e2', borderRadius: 8, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
    boutonProposerText: { color: 'white', fontSize: 13, fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: '#1e1e1e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '85%', borderTopWidth: 1, borderColor: '#2a2a2a' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#eee' },
    modalSubtitle: { fontSize: 13, color: '#888', marginTop: 4 },
    modalVide: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    modalVideText: { color: '#666', fontSize: 15 },
    passagerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#252525', borderRadius: 12, padding: 12, marginBottom: 8 },
    passagerAvatar: { width: 44, height: 44, borderRadius: 22 },
    passagerAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#252525', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333' },
    passagerInitiales: { color: '#888', fontSize: 16, fontWeight: '700' },
    passagerInfos: { flex: 1 },
    passagerNom: { color: '#eee', fontSize: 15, fontWeight: '600' },

    paiementDetail: { backgroundColor: '#252525', borderRadius: 12, padding: 16, marginBottom: 16 },
    paiementDetailLigne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    paiementDetailLabel: { fontSize: 13, color: '#888' },
    paiementDetailValeur: { fontSize: 13, color: '#ddd', textAlign: 'right' },
    paiementDetailSeparator: { height: 1, backgroundColor: '#333', marginVertical: 6 },
    paiementInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#252525', borderRadius: 10, padding: 12, marginBottom: 16 },
    paiementInfoTexte: { fontSize: 13, color: '#888', flex: 1, lineHeight: 20 },
    paiementLabel: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    paiementInput: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#252525', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: '#333', marginBottom: 20 },
    paiementInputText: { flex: 1, padding: 10, fontSize: 16, color: '#eee' },
    boutonConfirmerPaiement: { backgroundColor: '#00b5e2', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    boutonConfirmerPaiementText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

    separator: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 10 },
});