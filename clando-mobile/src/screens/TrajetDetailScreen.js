import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, Alert, Image, ActivityIndicator,
    Linking, Modal, TextInput, Keyboard,
    KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { getUserId } from '../services/auth.service';

export default function TrajetDetailScreen({ route, navigation }) {
    const { trajet } = route.params;
    const [avis, setAvis] = useState([]);
    const [loadingAvis, setLoadingAvis] = useState(true);
    const [showPrixModal, setShowPrixModal] = useState(false);
    const [prixPropose, setPrixPropose] = useState(trajet.prix.toString());
    const [loading, setLoading] = useState(false);
    const [genreUtilisateur, setGenreUtilisateur] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [passagers, setPassagers] = useState([]);
    const [loadingPassagers, setLoadingPassagers] = useState(false);
    const pollingRef = useRef(null);

    useEffect(() => {
        chargerAvis();
        chargerGenreUtilisateur();
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    useEffect(() => {
        if (currentUserId !== null) {
            chargerPassagers();
        }
    }, [currentUserId]);

    const chargerGenreUtilisateur = async () => {
        try {
            const userId = await getUserId();
            console.log('userId brut:', userId);
            if (!userId) return;
             console.log('userId null, on sort');
            // Convertit en Number pour que la comparaison avec conducteurId fonctionne
            const res = await api.get(`/utilisateurs/${userId}`);
        console.log('genre:', res.data.genre);
        console.log('conducteurId trajet:', trajet.conducteurId);
            setCurrentUserId(Number(userId));
            const resUser = await api.get(`/utilisateurs/${userId}`);
            setGenreUtilisateur(res.data.genre);
        } catch (err) {
            console.log('Erreur chargement genre:', err);
        }
    };

    const chargerPassagers = async () => {
        setLoadingPassagers(true);
        try {
            const res = await api.get(`/reservations/trajet/${trajet.id}/passagers`);
             console.log('passagers recus:', JSON.stringify(res.data));
            setPassagers(res.data);
        } catch (err) {
            console.log('Erreur passagers:', err.message);
        } finally {
            setLoadingPassagers(false);
        }
    };

    const chargerAvis = async () => {
        try {
            const response = await api.get(`/avis/utilisateur/${trajet.conducteurId}`);
            setAvis(response.data);
        } catch (error) {
            setAvis([]);
        } finally {
            setLoadingAvis(false);
        }
    };

    const demarrerPolling = (reservationId) => {
        let tentatives = 0;
        const MAX_TENTATIVES = 20;

        pollingRef.current = setInterval(async () => {
            tentatives++;
            try {
                const res = await api.get(`/reservations/${reservationId}`);
                const statutPaiement = res.data.statutPaiement;

                if (statutPaiement === 'SUCCESS' || statutPaiement === 'PENDING') {
                    clearInterval(pollingRef.current);
                    setShowPrixModal(false);
                    Alert.alert(
                        'Reservation envoyee !',
                        'Votre paiement a ete recu. Votre reservation est en attente de confirmation du conducteur.',
                        [{
                            text: 'Voir mes reservations',
                            onPress: () => navigation.navigate('Main', { screen: 'Reservations' })
                        }]
                    );
                }

                if (tentatives >= MAX_TENTATIVES) {
                    clearInterval(pollingRef.current);
                    Alert.alert(
                        'Reservation en cours',
                        'Votre paiement est en cours de traitement. Consultez vos reservations dans quelques instants.',
                        [{
                            text: 'Voir mes reservations',
                            onPress: () => navigation.navigate('Main', { screen: 'Reservations' })
                        }]
                    );
                }
            } catch (err) {
                console.log('Erreur polling:', err.message);
            }
        }, 3000);
    };

    const formatHeure = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long'
        });
    };

    const handleReserverPress = () => {
        if (trajet.femmesUniquement && genreUtilisateur === 'HOMME') {
            Alert.alert(
                'Acces refuse',
                'Ce trajet est reserve aux femmes uniquement. Vous ne pouvez pas effectuer cette reservation.',
                [{ text: 'Compris', style: 'default' }]
            );
            return;
        }
        setShowPrixModal(true);
    };

    const reserver = async () => {
        Keyboard.dismiss();
        const userId = await getUserId();
        if (!userId) {
            Alert.alert('Erreur', 'Veuillez vous reconnecter');
            return;
        }

        const prixFinal = parseFloat(prixPropose);
        if (isNaN(prixFinal) || prixFinal <= 0) {
            Alert.alert('Erreur', 'Prix invalide');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/reservations', {
                nbPlaces: 1,
                passagerId: userId,
                trajetId: trajet.id,
                prixPropose: prixFinal !== trajet.prix ? prixFinal : null,
                numeroTelephone: 'GATEWAY'
            });

            const reservationId = response.data.id;
            const urlPaiement = response.data.urlPaiement;

            if (urlPaiement) {
                await Linking.openURL(urlPaiement);
                demarrerPolling(reservationId);
            } else {
                setShowPrixModal(false);
                Alert.alert(
                    'Reservation envoyee !',
                    'En attente de confirmation du conducteur.',
                    [{
                        text: 'Voir mes reservations',
                        onPress: () => navigation.navigate('Main', { screen: 'Reservations' })
                    }]
                );
            }
        } catch (error) {
            const msg = error.response?.data?.erreur || 'Erreur lors de la reservation';
            Alert.alert('Reservation impossible', msg);
        } finally {
            setLoading(false);
        }
    };

    const renderEtoiles = (note) => {
        return [1, 2, 3, 4, 5].map((i) => (
            <Ionicons
                key={i}
                name={i <= note ? 'star' : 'star-outline'}
                size={14}
                color="#f39c12"
            />
        ));
    };

    const estConducteur = currentUserId !== null && trajet.conducteurId === currentUserId;
    const aReservationConfirmee = passagers.some(p => Number(p.passagerId) === currentUserId);
    const passagersAffiches = (estConducteur || aReservationConfirmee) ? passagers : [];
    const estBloqueParGenre = trajet.femmesUniquement && genreUtilisateur === 'HOMME';
    console.log('currentUserId:', currentUserId, typeof currentUserId);
console.log('trajet.conducteurId:', trajet.conducteurId, typeof trajet.conducteurId);
console.log('estConducteur:', estConducteur);
console.log('passagers:', JSON.stringify(passagers));
console.log('aReservationConfirmee:', aReservationConfirmee);
console.log('passagersAffiches:', passagersAffiches.length);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#eee" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Details du trajet</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

                <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>{formatDate(trajet.dateHeureDepart)}</Text>
                    {trajet.femmesUniquement && (
                        <View style={styles.femmesUniquementBadge}>
                            <Text style={styles.femmesUniquementText}>Reserve aux femmes uniquement</Text>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <View style={styles.timeline}>
                        <View style={styles.timelineRow}>
                            <Text style={styles.timelineHeure}>{formatHeure(trajet.dateHeureDepart)}</Text>
                            <View style={styles.timelineCenter}>
                                <View style={styles.timelineDot} />
                                <View style={styles.timelineLine} />
                            </View>
                            <View style={styles.timelineInfo}>
                                <Text style={styles.timelineVille}>{trajet.villeDepart}</Text>
                                {trajet.itineraire && (
                                    <Text style={styles.timelineItineraire}>Via {trajet.itineraire}</Text>
                                )}
                            </View>
                        </View>
                        <View style={styles.timelineRow}>
                            <Text style={styles.timelineHeure}></Text>
                            <View style={styles.timelineCenter}>
                                <View style={[styles.timelineDot, styles.timelineDotArrivee]} />
                            </View>
                            <View style={styles.timelineInfo}>
                                <Text style={styles.timelineVille}>{trajet.villeArrivee}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.card}>
                        <View style={styles.infoRow}>
                            <Ionicons name="people-outline" size={18} color="#00b5e2" />
                            <Text style={styles.infoText}>
                                {trajet.placesDisponibles} place(s) disponible(s)
                            </Text>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.infoRow}>
                            <Ionicons name="car-outline" size={18} color="#00b5e2" />
                            <Text style={styles.infoText}>
                                {trajet.vehiculeMarque} {trajet.vehiculeModele}
                            </Text>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.infoRow}>
                            <Ionicons name="checkmark-circle-outline" size={18} color="#888" />
                            <Text style={styles.infoText}>
                                Reservation confirmee par le conducteur
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Section passagers confirmés */}
                {passagersAffiches.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {estConducteur
                                ? `Passagers confirmes (${passagersAffiches.length})`
                                : `Vous voyagez avec ${passagersAffiches.length} personne${passagersAffiches.length > 1 ? 's' : ''}`}
                        </Text>
                        {loadingPassagers ? (
                            <ActivityIndicator color="#00b5e2" />
                        ) : (
                            passagersAffiches.map((item) => {
                                const initiales = `${(item.passagerPrenom || '?')[0]}${(item.passagerNom || '?')[0]}`.toUpperCase();
                                return (
                                    <View key={item.id.toString()} style={styles.passagerCard}>
                                        {item.passagerPhoto ? (
                                            <Image source={{ uri: item.passagerPhoto }} style={styles.passagerAvatar} />
                                        ) : (
                                            <View style={styles.passagerAvatarPlaceholder}>
                                                <Text style={styles.passagerInitiales}>{initiales}</Text>
                                            </View>
                                        )}

                                        <View style={styles.passagerInfos}>
                                            <Text style={styles.passagerNom}>
                                                {item.passagerPrenom} {item.passagerNom}
                                            </Text>
                                            {/* Pas de numero, pas de places */}
                                        </View>

                                        <TouchableOpacity
                                            style={styles.passagerBtnChat}
                                            onPress={() => navigation.navigate('Chat', {
                                                reservationId: item.id,
                                                interlocuteur: {
                                                    id: estConducteur ? item.passagerId : trajet.conducteurId,
                                                    nom: estConducteur ? item.passagerNom : trajet.conducteurNom,
                                                    prenom: estConducteur ? item.passagerPrenom : trajet.conducteurPrenom,
                                                },
                                                userId: currentUserId,
                                            })}>
                                            <Ionicons name="chatbubble-outline" size={18} color="#00b5e2" />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })
                        )}
                    </View>
                )}

                {/* Profil conducteur */}
                <View style={styles.section}>
                    <View style={styles.card}>
                        <View style={styles.conducteurRow}>
                            <View style={styles.conducteurAvatar}>
                                {trajet.conducteurPhoto ? (
                                    <Image
                                        source={{ uri: trajet.conducteurPhoto }}
                                        style={styles.conducteurAvatarImage}
                                    />
                                ) : (
                                    <Text style={styles.conducteurAvatarText}>
                                        {trajet.conducteurPrenom?.charAt(0)}{trajet.conducteurNom?.charAt(0)}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.conducteurDetails}>
                                <Text style={styles.conducteurNom}>
                                    {trajet.conducteurPrenom} {trajet.conducteurNom}
                                </Text>
                                <View style={styles.conducteurStats}>
                                    <Ionicons name="star" size={14} color="#f39c12" />
                                    <Text style={styles.conducteurNote}>
                                        {trajet.noteMoyenneConducteur > 0
                                            ? trajet.noteMoyenneConducteur.toFixed(1)
                                            : 'Nouveau'}
                                    </Text>
                                    <Text style={styles.conducteurNbAvis}>
                                        • {avis.length} avis
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#444" />
                        </View>

                        <View style={styles.separator} />

                        <View style={styles.infoRow}>
                            <Ionicons name="shield-checkmark-outline" size={18} color="#2ecc71" />
                            <Text style={[styles.infoText, { color: '#2ecc71' }]}>Profil verifie</Text>
                        </View>

                        <View style={styles.separator} />

                        <TouchableOpacity
                            style={styles.boutonContacter}
                            onPress={() => navigation.navigate('Chat', {
                                reservationId: null,
                                interlocuteur: {
                                    id: trajet.conducteurId,
                                    nom: trajet.conducteurNom,
                                    prenom: trajet.conducteurPrenom
                                },
                                userId: null,
                                trajetId: trajet.id
                            })}>
                            <Ionicons name="chatbubble-outline" size={18} color="#00b5e2" />
                            <Text style={styles.boutonContacterText}>
                                Contacter {trajet.conducteurPrenom}
                            </Text>
                        </TouchableOpacity>

                        {/* Numero conducteur visible uniquement par passager confirme */}
                        {aReservationConfirmee && trajet.conducteurTelephone ? (
                            <Text style={styles.conducteurTel}>
                                {trajet.conducteurTelephone}
                            </Text>
                        ) : !estConducteur ? (
                            <Text style={styles.infoSecurite}>
                                Le numero sera visible apres confirmation
                            </Text>
                        ) : null}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Avis des passagers</Text>
                    {loadingAvis ? (
                        <ActivityIndicator size={20} color="#00b5e2" />
                    ) : avis.length === 0 ? (
                        <View style={styles.card}>
                            <Text style={styles.aucunAvis}>Aucun avis pour ce conducteur</Text>
                        </View>
                    ) : (
                        avis.slice(0, 5).map((a) => (
                            <View key={a.id.toString()} style={styles.avisItem}>
                                <View style={styles.avisHeader}>
                                    <Text style={styles.avisAuteur}>
                                        {a.auteurPrenom} {a.auteurNom}
                                    </Text>
                                    <View style={styles.avisEtoiles}>
                                        {renderEtoiles(a.note)}
                                    </View>
                                </View>
                                {a.commentaire ? (
                                    <Text style={styles.avisCommentaire}>{a.commentaire}</Text>
                                ) : null}
                            </View>
                        ))
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {trajet.statut === 'OUVERT' && trajet.placesDisponibles > 0 && (
                <View style={styles.bottomBar}>
                    <View style={styles.bottomPrix}>
                        <Text style={styles.bottomPrixLabel}>Prix</Text>
                        <Text style={styles.bottomPrixValeur}>{trajet.prix?.toLocaleString()} GNF</Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.boutonReserver,
                            estBloqueParGenre && styles.boutonReserverBloque
                        ]}
                        onPress={handleReserverPress}>
                        <Ionicons
                            name={estBloqueParGenre ? 'lock-closed-outline' : 'calendar-outline'}
                            size={18}
                            color="white"
                        />
                        <Text style={styles.boutonReserverText}>
                            {estBloqueParGenre ? 'Femmes uniquement' : 'Demande de reservation'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <Modal
                visible={showPrixModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowPrixModal(false)}>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ width: '100%' }}>
                        <View style={styles.modalCard}>
                            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                <Text style={styles.modalTitle}>Confirmer la reservation</Text>
                                <Text style={styles.modalSubtitle}>
                                    {trajet.villeDepart} → {trajet.villeArrivee}
                                </Text>

                                <View style={styles.modalPrixOriginal}>
                                    <Text style={styles.modalPrixLabel}>Prix affiche</Text>
                                    <Text style={styles.modalPrixValeur}>
                                        {trajet.prix?.toLocaleString()} GNF
                                    </Text>
                                </View>

                                <Text style={styles.modalLabel}>Votre proposition (optionnel)</Text>
                                <View style={styles.modalInput}>
                                    <TextInput
                                        style={styles.modalInputText}
                                        value={prixPropose}
                                        onChangeText={setPrixPropose}
                                        keyboardType="numeric"
                                        placeholderTextColor="#666"
                                        returnKeyType="done"
                                        onSubmitEditing={() => Keyboard.dismiss()}
                                    />
                                    <Text style={styles.modalDevise}>GNF</Text>
                                </View>

                                {pollingRef.current && (
                                    <View style={styles.pollingIndicator}>
                                        <ActivityIndicator size={14} color="#00b5e2" />
                                        <Text style={styles.pollingText}>
                                            En attente de confirmation du paiement...
                                        </Text>
                                    </View>
                                )}

                                <Text style={styles.modalInfo}>
                                    Vous serez redirige vers la page de paiement securisee
                                </Text>

                                <View style={styles.modalBoutons}>
                                    <TouchableOpacity
                                        style={styles.modalBoutonAnnuler}
                                        onPress={() => {
                                            Keyboard.dismiss();
                                            if (pollingRef.current) clearInterval(pollingRef.current);
                                            setShowPrixModal(false);
                                        }}>
                                        <Text style={styles.modalBoutonAnnulerText}>Annuler</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalBoutonConfirmer, loading && { opacity: 0.7 }]}
                                        onPress={reserver}
                                        disabled={loading}>
                                        <Text style={styles.modalBoutonConfirmerText}>
                                            {loading ? 'Chargement...' : 'Payer & Reserver'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    header: {
        backgroundColor: '#1a1a1a',
        paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#eee' },
    dateContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
    dateText: { fontSize: 20, fontWeight: 'bold', color: '#eee', textTransform: 'capitalize' },
    femmesUniquementBadge: {
        marginTop: 10, backgroundColor: '#1a0a2a', borderRadius: 10,
        paddingVertical: 8, paddingHorizontal: 14,
        borderWidth: 1, borderColor: '#9b59b6', alignSelf: 'flex-start',
    },
    femmesUniquementText: { color: '#9b59b6', fontSize: 13, fontWeight: '700' },
    section: { paddingHorizontal: 16, marginTop: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#eee', marginBottom: 10 },
    card: {
        backgroundColor: '#1e1e1e', borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: '#2a2a2a',
    },
    timeline: { backgroundColor: '#1e1e1e', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2a2a2a' },
    timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    timelineHeure: { fontSize: 16, fontWeight: 'bold', color: '#eee', width: 52 },
    timelineCenter: { alignItems: 'center', marginHorizontal: 12, width: 16 },
    timelineDot: {
        width: 12, height: 12, borderRadius: 6,
        backgroundColor: '#00b5e2', borderWidth: 2, borderColor: '#1e1e1e',
    },
    timelineDotArrivee: { backgroundColor: '#2ecc71' },
    timelineLine: { width: 2, height: 40, backgroundColor: '#333', marginTop: 4 },
    timelineInfo: { flex: 1 },
    timelineVille: { fontSize: 15, fontWeight: '600', color: '#eee' },
    timelineItineraire: { fontSize: 12, color: '#00b5e2', marginTop: 2 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    infoText: { fontSize: 14, color: '#aaa', flex: 1 },
    separator: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 4 },
    passagerCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#1e1e1e', borderRadius: 12, padding: 12,
        marginBottom: 8, borderWidth: 1, borderColor: '#2a2a2a', gap: 12,
    },
    passagerAvatar: { width: 44, height: 44, borderRadius: 22 },
    passagerAvatarPlaceholder: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#00b5e233',
        alignItems: 'center', justifyContent: 'center',
    },
    passagerInitiales: { color: '#00b5e2', fontSize: 16, fontWeight: '700' },
    passagerInfos: { flex: 1 },
    passagerNom: { color: '#eee', fontSize: 15, fontWeight: '600' },
    passagerBtnChat: {
        padding: 8, backgroundColor: '#00b5e21A', borderRadius: 20,
    },
    conducteurTel: {
        fontSize: 14, color: '#00b5e2', fontWeight: '600', marginTop: 8,
    },
    conducteurRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
    conducteurAvatar: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: '#00b5e2', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
    },
    conducteurAvatarImage: { width: 52, height: 52, borderRadius: 26 },
    conducteurAvatarText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    conducteurDetails: { flex: 1 },
    conducteurNom: { fontSize: 16, fontWeight: '600', color: '#eee' },
    conducteurStats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    conducteurNote: { fontSize: 14, color: '#f39c12', fontWeight: '600' },
    conducteurNbAvis: { fontSize: 12, color: '#666' },
    boutonContacter: {
        flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10,
    },
    boutonContacterText: { color: '#00b5e2', fontSize: 15, fontWeight: '600' },
    infoSecurite: { fontSize: 11, color: '#555', fontStyle: 'italic', marginTop: 4 },
    avisItem: {
        backgroundColor: '#1e1e1e', borderRadius: 10, padding: 12,
        marginBottom: 8, borderWidth: 1, borderColor: '#2a2a2a',
    },
    avisHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    avisAuteur: { fontSize: 13, fontWeight: '600', color: '#ddd' },
    avisEtoiles: { flexDirection: 'row', gap: 2 },
    avisCommentaire: { fontSize: 13, color: '#888', lineHeight: 18 },
    aucunAvis: { fontSize: 14, color: '#666', textAlign: 'center', paddingVertical: 16 },
    bottomBar: {
        position: 'absolute', bottom: 15, left: 16, right: 16,
        backgroundColor: '#1e1e1e', padding: 8,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderRadius: 16, borderWidth: 0.5, borderColor: '#2a2a2a',
        shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 10,
    },
    bottomPrix: { flex: 1 },
    bottomPrixLabel: { fontSize: 12, color: '#888' },
    bottomPrixValeur: { fontSize: 18, fontWeight: 'bold', color: '#00b5e2' },
    boutonReserver: {
        flex: 2, backgroundColor: '#00b5e2', borderRadius: 12,
        padding: 14, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8,
    },
    boutonReserverBloque: { backgroundColor: '#5a3a6a' },
    boutonReserverText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalCard: {
        backgroundColor: '#1e1e1e',
        borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 24, borderTopWidth: 1, borderColor: '#2a2a2a',
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#eee', marginBottom: 4 },
    modalSubtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
    modalPrixOriginal: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#252525', borderRadius: 10, padding: 12, marginBottom: 16,
    },
    modalPrixLabel: { fontSize: 14, color: '#888' },
    modalPrixValeur: { fontSize: 16, fontWeight: 'bold', color: '#00b5e2' },
    modalLabel: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    modalInput: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 10,
        paddingHorizontal: 12, backgroundColor: '#252525', marginBottom: 12,
    },
    modalInputText: { flex: 1, padding: 12, fontSize: 16, color: '#eee' },
    modalDevise: { color: '#888', fontSize: 14 },
    pollingIndicator: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#0a2a35', borderRadius: 8, padding: 10, marginBottom: 12,
    },
    pollingText: { fontSize: 13, color: '#00b5e2', flex: 1 },
    modalInfo: { fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
    modalBoutons: { flexDirection: 'row', gap: 12 },
    modalBoutonAnnuler: { flex: 1, borderWidth: 1, borderColor: '#444', borderRadius: 10, padding: 14, alignItems: 'center' },
    modalBoutonAnnulerText: { color: '#888', fontSize: 15, fontWeight: '600' },
    modalBoutonConfirmer: { flex: 1, backgroundColor: '#00b5e2', borderRadius: 10, padding: 14, alignItems: 'center' },
    modalBoutonConfirmerText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
});