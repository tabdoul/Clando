import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ScrollView, Alert, Image, ActivityIndicator,
    Modal, TextInput, Keyboard,
    KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { getUserId } from '../services/auth.service';

export default function TrajetDetailScreen({ route, navigation }) {
    const { trajet, villeDepart, villeArrivee } = route.params;
    const [avis, setAvis] = useState([]);
    const [loadingAvis, setLoadingAvis] = useState(true);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [prixPropose, setPrixPropose] = useState(
        (trajet.prixConducteur ?? trajet.prix).toString()
    );
    const [loading, setLoading] = useState(false);
    const [genreUtilisateur, setGenreUtilisateur] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [passagers, setPassagers] = useState([]);
    const [loadingPassagers, setLoadingPassagers] = useState(false);

    const departPassager = villeDepart || trajet.villeDepart;
    const arriveePassager = villeArrivee || trajet.villeArrivee;

    useEffect(() => {
        chargerAvis();
        chargerGenreUtilisateur();
    }, []);

    useEffect(() => {
        if (currentUserId !== null) chargerPassagers();
    }, [currentUserId]);

    const chargerGenreUtilisateur = async () => {
        try {
            const userId = await getUserId();
            if (!userId) return;
            const res = await api.get(`/utilisateurs/${userId}`);
            setCurrentUserId(Number(userId));
            setGenreUtilisateur(res.data.genre);
        } catch (err) {}
    };

    const chargerPassagers = async () => {
        setLoadingPassagers(true);
        try {
            const res = await api.get(`/reservations/trajet/${trajet.id}/passagers`);
            setPassagers(res.data);
        } catch (err) {}
        finally { setLoadingPassagers(false); }
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

    const formatHeure = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const handleReserverPress = () => {
        if (trajet.femmesUniquement && genreUtilisateur === 'HOMME') {
            Alert.alert('Acces refuse', 'Ce trajet est reserve aux femmes uniquement.');
            return;
        }
        setShowConfirmModal(true);
    };

    const reserver = async () => {
        Keyboard.dismiss();
        const userId = await getUserId();
        if (!userId) { Alert.alert('Erreur', 'Veuillez vous reconnecter'); return; }
        const prixFinal = parseFloat(prixPropose);
        if (isNaN(prixFinal) || prixFinal <= 0) { Alert.alert('Prix invalide', 'Veuillez entrer un prix valide'); return; }
        setLoading(true);
        try {
            await api.post('/reservations', {
                nbPlaces: 1,
                passagerId: userId,
                trajetId: trajet.id,
                prixPropose: prixFinal !== trajet.prixConducteur ? prixFinal : null,
                departPassager,
                arriveePassager,
            });
            setShowConfirmModal(false);
            Alert.alert(
                'Demande envoyee !',
                `Le conducteur ${trajet.conducteurPrenom} va examiner votre demande. Vous aurez 30 minutes pour payer apres confirmation.`,
                [{ text: 'Voir mes reservations', onPress: () => navigation.navigate('Main', { screen: 'Reservations' }) }]
            );
        } catch (error) {
            Alert.alert('Reservation impossible', error.response?.data?.erreur || 'Impossible d\'envoyer la demande.');
        } finally {
            setLoading(false);
        }
    };

    const noteMoyenne = avis.length > 0
        ? (avis.reduce((sum, a) => sum + a.note, 0) / avis.length).toFixed(1)
        : null;

    const renderEtoiles = (note, taille = 14) => [1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={i <= note ? 'star' : 'star-outline'} size={taille} color="#f39c12" />
    ));

    const estConducteur = currentUserId !== null && trajet.conducteurId === currentUserId;
    const aReservationConfirmee = passagers.some(p => Number(p.passagerId) === currentUserId);
    const passagersAffiches = (estConducteur || aReservationConfirmee) ? passagers : [];
    const estBloqueParGenre = trajet.femmesUniquement && genreUtilisateur === 'HOMME';
    const prixDifferent = parseFloat(prixPropose) !== trajet.prixConducteur && !isNaN(parseFloat(prixPropose));

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#eee" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerVille} numberOfLines={1}>{trajet.villeDepart}</Text>
                    <Ionicons name="arrow-forward" size={14} color="#00b5e2" />
                    <Text style={styles.headerVille} numberOfLines={1}>{trajet.villeArrivee}</Text>
                </View>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

                <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>{formatDate(trajet.dateHeureDepart)}</Text>
                    {trajet.femmesUniquement && (
                        <View style={styles.femmesUniquementBadge}>
                            <Ionicons name="female" size={13} color="#9b59b6" />
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
                                    <Text style={styles.timelineItineraire}>{`Via ${trajet.itineraire}`}</Text>
                                )}
                            </View>
                        </View>
                        <View style={styles.timelineRow}>
                            <Text style={styles.timelineHeure}>{''}</Text>
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
                            <View style={styles.infoIcone}>
                                <Ionicons name="people-outline" size={18} color="#00b5e2" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Places disponibles</Text>
                                <Text style={[styles.infoValeur, trajet.placesDisponibles === 1 && { color: '#e74c3c' }]}>
                                    {`${trajet.placesDisponibles} ${trajet.placesDisponibles > 1 ? 'places disponibles' : 'place disponible'}${trajet.placesDisponibles === 1 ? ' — Derniere place !' : ''}`}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.infoRow}>
                            <View style={styles.infoIcone}>
                                <Ionicons name="car-outline" size={18} color="#00b5e2" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Vehicule</Text>
                                <Text style={styles.infoValeur}>{`${trajet.vehiculeMarque} ${trajet.vehiculeModele}`}</Text>
                            </View>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.infoRow}>
                            <View style={styles.infoIcone}>
                                <Ionicons name="wallet-outline" size={18} color="#2ecc71" />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Paiement</Text>
                                <Text style={styles.infoValeur}>Apres confirmation · Orange Money</Text>
                            </View>
                        </View>
                    </View>
                </View>

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
                                            <Text style={styles.passagerNom}>{`${item.passagerPrenom} ${item.passagerNom}`}</Text>
                                            {estConducteur && item.departPassager && item.arriveePassager && (
                                                <Text style={styles.passagerTrajet}>
                                                    {`${item.departPassager} → ${item.arriveePassager}`}
                                                </Text>
                                            )}
                                        </View>
                                        {estConducteur && (
                                            <TouchableOpacity
                                                style={styles.passagerBtnChat}
                                                onPress={() => navigation.navigate('Chat', {
                                                    reservationId: item.id,
                                                    interlocuteur: { id: item.passagerId, nom: item.passagerNom, prenom: item.passagerPrenom },
                                                    userId: currentUserId,
                                                })}>
                                                <Ionicons name="chatbubble-outline" size={18} color="#00b5e2" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })
                        )}
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Votre conducteur</Text>
                    <View style={styles.card}>
                        <View style={styles.conducteurRow}>
                            <View style={styles.conducteurAvatar}>
                                {trajet.conducteurPhoto ? (
                                    <Image source={{ uri: trajet.conducteurPhoto }} style={styles.conducteurAvatarImage} />
                                ) : (
                                    <Text style={styles.conducteurAvatarText}>
                                        {`${trajet.conducteurPrenom?.charAt(0)}${trajet.conducteurNom?.charAt(0)}`}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.conducteurDetails}>
                                <Text style={styles.conducteurNom}>{`${trajet.conducteurPrenom} ${trajet.conducteurNom}`}</Text>
                                <View style={styles.conducteurStats}>
                                    {noteMoyenne ? (
                                        <>
                                            <Ionicons name="star" size={14} color="#f39c12" />
                                            <Text style={styles.conducteurNote}>{noteMoyenne}</Text>
                                            <Text style={styles.conducteurNbAvis}>{`(${avis.length} avis)`}</Text>
                                        </>
                                    ) : (
                                        <Text style={styles.conducteurNbAvis}>Nouveau conducteur</Text>
                                    )}
                                </View>
                                <View style={styles.conducteurBadges}>
                                    <View style={styles.badgeVerifie}>
                                        <Ionicons name="shield-checkmark-outline" size={12} color="#2ecc71" />
                                        <Text style={styles.badgeVerifieText}>Verifie</Text>
                                    </View>
                                    {trajet.nbTrajetsTerminesConducteur > 0 && (
                                        <View style={styles.badgeTrajets}>
                                            <Text style={styles.badgeTrajetsText}>
                                                {`${trajet.nbTrajetsTerminesConducteur} trajet${trajet.nbTrajetsTerminesConducteur > 1 ? 's' : ''}`}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        <View style={styles.separator} />

                        <TouchableOpacity
                            style={styles.boutonContacter}
                            onPress={() => navigation.navigate('Chat', {
                                reservationId: null,
                                interlocuteur: { id: trajet.conducteurId, nom: trajet.conducteurNom, prenom: trajet.conducteurPrenom },
                                userId: null,
                                trajetId: trajet.id
                            })}>
                            <Ionicons name="chatbubble-outline" size={18} color="#00b5e2" />
                            <Text style={styles.boutonContacterText}>{`Envoyer un message a ${trajet.conducteurPrenom}`}</Text>
                        </TouchableOpacity>

                        {aReservationConfirmee && trajet.conducteurTelephone ? (
                            <View style={styles.telContainer}>
                                <Ionicons name="call-outline" size={16} color="#00b5e2" />
                                <Text style={styles.conducteurTel}>{trajet.conducteurTelephone}</Text>
                            </View>
                        ) : !estConducteur ? (
                            <Text style={styles.infoSecurite}>
                                Le numero sera visible apres confirmation de votre reservation
                            </Text>
                        ) : null}
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.avisHeader}>
                        <Text style={styles.sectionTitle}>Avis des passagers</Text>
                        {noteMoyenne && (
                            <View style={styles.noteMoyenneContainer}>
                                <Text style={styles.noteMoyenneValeur}>{noteMoyenne}</Text>
                                <View style={styles.noteMoyenneEtoiles}>
                                    {renderEtoiles(Math.round(noteMoyenne), 12)}
                                </View>
                                <Text style={styles.noteMoyenneTotal}>{`${avis.length} avis`}</Text>
                            </View>
                        )}
                    </View>

                    {loadingAvis ? (
                        <ActivityIndicator size={20} color="#00b5e2" />
                    ) : avis.length === 0 ? (
                        <View style={styles.card}>
                            <Text style={styles.aucunAvis}>Ce conducteur n'a pas encore recu d'avis</Text>
                        </View>
                    ) : (
                        avis.slice(0, 5).map((a) => (
                            <View key={a.id.toString()} style={styles.avisItem}>
                                <View style={styles.avisTop}>
                                    <View style={styles.avisAvatarContainer}>
                                        <View style={styles.avisAvatar}>
                                            <Text style={styles.avisAvatarText}>
                                                {`${(a.auteurPrenom || '?')[0]}${(a.auteurNom || '?')[0]}`}
                                            </Text>
                                        </View>
                                        <Text style={styles.avisAuteur}>{`${a.auteurPrenom} ${a.auteurNom}`}</Text>
                                    </View>
                                    <View style={styles.avisEtoiles}>{renderEtoiles(a.note)}</View>
                                </View>
                                {a.commentaire ? (
                                    <Text style={styles.avisCommentaire}>{`"${a.commentaire}"`}</Text>
                                ) : null}
                            </View>
                        ))
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {trajet.statut === 'OUVERT' && trajet.placesDisponibles > 0 && !estConducteur && (
                <View style={styles.bottomBar}>
                    <View style={styles.bottomPrix}>
                        <Text style={styles.bottomPrixLabel}>Prix</Text>
                        <Text style={styles.bottomPrixValeur}>{`${trajet.prixConducteur?.toLocaleString()} GNF`}</Text>
                        <Text style={styles.bottomPlaces}>
                            {trajet.placesDisponibles > 1 ? `${trajet.placesDisponibles} places restantes` : '1 place restante'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.boutonReserver, estBloqueParGenre && styles.boutonReserverBloque]}
                        onPress={handleReserverPress}>
                        <Ionicons
                            name={estBloqueParGenre ? 'lock-closed-outline' : 'calendar-outline'}
                            size={18} color="white"
                        />
                        <Text style={styles.boutonReserverText}>
                            {estBloqueParGenre ? 'Femmes uniquement' : 'Reserver ce trajet'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <Modal
                visible={showConfirmModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowConfirmModal(false)}>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
                        <View style={styles.modalCard}>
                            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                                <Text style={styles.modalTitle}>Confirmer la reservation</Text>
                                <Text style={styles.modalSubtitle}>{`avec ${trajet.conducteurPrenom} ${trajet.conducteurNom}`}</Text>

                                <View style={styles.modalTrajetPassager}>
                                    <Text style={styles.modalTrajetTitre}>Votre trajet</Text>
                                    <View style={styles.modalTrajetLigne}>
                                        <Ionicons name="location-outline" size={16} color="#00b5e2" />
                                        <Text style={styles.modalTrajetTexte}>{departPassager}</Text>
                                    </View>
                                    <View style={styles.modalTrajetSeparateur}>
                                        <View style={styles.modalTrajetBarre} />
                                        <Ionicons name="arrow-down-outline" size={14} color="#444" />
                                        <View style={styles.modalTrajetBarre} />
                                    </View>
                                    <View style={styles.modalTrajetLigne}>
                                        <Ionicons name="location" size={16} color="#2ecc71" />
                                        <Text style={styles.modalTrajetTexte}>{arriveePassager}</Text>
                                    </View>
                                </View>

                                <View style={styles.modalInfo}>
                                    <Ionicons name="information-circle-outline" size={16} color="#00b5e2" />
                                    <Text style={styles.modalInfoText}>
                                        Le conducteur doit confirmer votre demande. Une fois confirme, vous aurez 30 minutes pour payer via Orange Money.
                                    </Text>
                                </View>

                                <View style={styles.modalPrixOriginal}>
                                    <Text style={styles.modalPrixLabel}>Prix du trajet</Text>
                                    <Text style={styles.modalPrixValeur}>{`${trajet.prixConducteur?.toLocaleString()} GNF`}</Text>
                                </View>

                                <Text style={styles.modalLabel}>Proposer un autre prix (optionnel)</Text>
                                <Text style={styles.modalLabelSub}>Vous pouvez negocier le prix avec le conducteur</Text>

                                <View style={[styles.modalInput, prixDifferent && { borderColor: '#f39c12' }]}>
                                    <Ionicons name="cash-outline" size={18} color={prixDifferent ? '#f39c12' : '#888'} />
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

                                {prixDifferent && (
                                    <Text style={styles.modalNegocInfo}>
                                        {`Vous proposez ${parseFloat(prixPropose).toLocaleString()} GNF au lieu de ${trajet.prixConducteur?.toLocaleString()} GNF`}
                                    </Text>
                                )}

                                <View style={[styles.modalBoutons, { marginTop: 20 }]}>
                                    <TouchableOpacity
                                        style={styles.modalBoutonAnnuler}
                                        onPress={() => { Keyboard.dismiss(); setShowConfirmModal(false); }}>
                                        <Text style={styles.modalBoutonAnnulerText}>Annuler</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalBoutonConfirmer, loading && { opacity: 0.7 }]}
                                        onPress={reserver}
                                        disabled={loading}>
                                        <Text style={styles.modalBoutonConfirmerText}>
                                            {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
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
        backgroundColor: '#1a1a1a', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
    },
    backButton: { padding: 4 },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' },
    headerVille: { fontSize: 16, fontWeight: 'bold', color: '#eee', maxWidth: 120 },
    dateContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    dateText: { fontSize: 18, fontWeight: 'bold', color: '#eee', textTransform: 'capitalize' },
    femmesUniquementBadge: {
        marginTop: 8, backgroundColor: '#1a0a2a', borderRadius: 10,
        paddingVertical: 6, paddingHorizontal: 12, flexDirection: 'row',
        alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#9b59b6', alignSelf: 'flex-start',
    },
    femmesUniquementText: { color: '#9b59b6', fontSize: 12, fontWeight: '700' },
    section: { paddingHorizontal: 16, marginTop: 12 },
    sectionTitle: { fontSize: 15, fontWeight: '600', color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    card: { backgroundColor: '#1e1e1e', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2a2a2a' },
    timeline: { backgroundColor: '#1e1e1e', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2a2a2a' },
    timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    timelineHeure: { fontSize: 18, fontWeight: 'bold', color: '#eee', width: 56 },
    timelineCenter: { alignItems: 'center', marginHorizontal: 12, width: 16 },
    timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#00b5e2', borderWidth: 2, borderColor: '#1e1e1e' },
    timelineDotArrivee: { backgroundColor: '#2ecc71' },
    timelineLine: { width: 2, height: 40, backgroundColor: '#333', marginTop: 4 },
    timelineInfo: { flex: 1 },
    timelineVille: { fontSize: 16, fontWeight: '600', color: '#eee' },
    timelineItineraire: { fontSize: 12, color: '#00b5e2', marginTop: 2 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
    infoIcone: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#252525', alignItems: 'center', justifyContent: 'center' },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 12, color: '#666', marginBottom: 2 },
    infoValeur: { fontSize: 14, color: '#ddd', fontWeight: '500' },
    separator: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 2 },
    passagerCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#1e1e1e', borderRadius: 12, padding: 12,
        marginBottom: 8, borderWidth: 1, borderColor: '#2a2a2a', gap: 12,
    },
    passagerAvatar: { width: 44, height: 44, borderRadius: 22 },
    passagerAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#252525', alignItems: 'center', justifyContent: 'center' },
    passagerInitiales: { color: '#888', fontSize: 16, fontWeight: '700' },
    passagerInfos: { flex: 1 },
    passagerNom: { color: '#eee', fontSize: 15, fontWeight: '600' },
    passagerTrajet: { color: '#888', fontSize: 12, marginTop: 2 },
    passagerBtnChat: { padding: 8, backgroundColor: '#00b5e21A', borderRadius: 20 },
    conducteurRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4 },
    conducteurAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#252525', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
    conducteurAvatarImage: { width: 60, height: 60, borderRadius: 30 },
    conducteurAvatarText: { color: '#888', fontSize: 20, fontWeight: 'bold' },
    conducteurDetails: { flex: 1 },
    conducteurNom: { fontSize: 16, fontWeight: '700', color: '#eee', marginBottom: 4 },
    conducteurStats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
    conducteurNote: { fontSize: 14, color: '#f39c12', fontWeight: '600' },
    conducteurNbAvis: { fontSize: 12, color: '#666' },
    conducteurBadges: { flexDirection: 'row', gap: 6 },
    badgeVerifie: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#252525', borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8 },
    badgeVerifieText: { color: '#888', fontSize: 11, fontWeight: '600' },
    badgeTrajets: { backgroundColor: '#252525', borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8 },
    badgeTrajetsText: { color: '#888', fontSize: 11, fontWeight: '600' },
    boutonContacter: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
    boutonContacterText: { color: '#00b5e2', fontSize: 14, fontWeight: '600' },
    telContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    conducteurTel: { fontSize: 14, color: '#00b5e2', fontWeight: '600' },
    infoSecurite: { fontSize: 12, color: '#555', fontStyle: 'italic', marginTop: 6, lineHeight: 18 },
    avisHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    noteMoyenneContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1e1e1e', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: '#2a2a2a' },
    noteMoyenneValeur: { fontSize: 16, fontWeight: 'bold', color: '#f39c12' },
    noteMoyenneEtoiles: { flexDirection: 'row', gap: 2 },
    noteMoyenneTotal: { fontSize: 11, color: '#666' },
    avisItem: { backgroundColor: '#1e1e1e', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#2a2a2a' },
    avisTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    avisAvatarContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avisAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#252525', alignItems: 'center', justifyContent: 'center' },
    avisAvatarText: { color: '#888', fontSize: 12, fontWeight: '700' },
    avisAuteur: { fontSize: 13, fontWeight: '600', color: '#ddd' },
    avisEtoiles: { flexDirection: 'row', gap: 2 },
    avisCommentaire: { fontSize: 13, color: '#aaa', lineHeight: 20, fontStyle: 'italic' },
    aucunAvis: { fontSize: 14, color: '#666', textAlign: 'center', paddingVertical: 16 },
    bottomBar: {
        position: 'absolute', bottom: 15, left: 16, right: 16,
        backgroundColor: '#1e1e1e', padding: 10,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderRadius: 16, borderWidth: 0.5, borderColor: '#2a2a2a',
        shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 10,
    },
    bottomPrix: { flex: 1 },
    bottomPrixLabel: { fontSize: 11, color: '#888' },
    bottomPrixValeur: { fontSize: 20, fontWeight: 'bold', color: '#00b5e2' },
    bottomPlaces: { fontSize: 11, color: '#666', marginTop: 1 },
    boutonReserver: {
        flex: 2, backgroundColor: '#00b5e2', borderRadius: 12,
        padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    boutonReserverBloque: { backgroundColor: '#5a3a6a' },
    boutonReserverText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalCard: {
        backgroundColor: '#1e1e1e', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 24, maxHeight: '90%', borderTopWidth: 1, borderColor: '#2a2a2a',
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#eee', marginBottom: 2 },
    modalSubtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
    modalTrajetPassager: { backgroundColor: '#252525', borderRadius: 12, padding: 14, marginBottom: 14 },
    modalTrajetTitre: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontWeight: '600' },
    modalTrajetLigne: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    modalTrajetTexte: { fontSize: 15, fontWeight: '600', color: '#eee' },
    modalTrajetSeparateur: { flexDirection: 'row', alignItems: 'center', marginLeft: 26, gap: 4, marginVertical: 6 },
    modalTrajetBarre: { flex: 1, height: 1, backgroundColor: '#333' },
    modalInfo: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: '#0a2a35', borderRadius: 10, padding: 12, marginBottom: 14,
    },
    modalInfoText: { fontSize: 13, color: '#00b5e2', flex: 1, lineHeight: 20 },
    modalPrixOriginal: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#252525', borderRadius: 10, padding: 12, marginBottom: 14,
    },
    modalPrixLabel: { fontSize: 14, color: '#888' },
    modalPrixValeur: { fontSize: 18, fontWeight: 'bold', color: '#00b5e2' },
    modalLabel: { fontSize: 13, fontWeight: '600', color: '#ddd', marginBottom: 2 },
    modalLabelSub: { fontSize: 12, color: '#666', marginBottom: 8 },
    modalInput: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 10,
        paddingHorizontal: 12, backgroundColor: '#252525', marginBottom: 4,
    },
    modalInputText: { flex: 1, padding: 12, fontSize: 15, color: '#eee' },
    modalDevise: { color: '#888', fontSize: 14 },
    modalNegocInfo: { fontSize: 12, color: '#f39c12', marginBottom: 4, fontStyle: 'italic' },
    modalBoutons: { flexDirection: 'row', gap: 12 },
    modalBoutonAnnuler: { flex: 1, borderWidth: 1, borderColor: '#444', borderRadius: 10, padding: 14, alignItems: 'center' },
    modalBoutonAnnulerText: { color: '#888', fontSize: 15, fontWeight: '600' },
    modalBoutonConfirmer: { flex: 1, backgroundColor: '#00b5e2', borderRadius: 10, padding: 14, alignItems: 'center' },
    modalBoutonConfirmerText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
});