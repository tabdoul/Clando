import React, { useState, useEffect } from 'react';
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

    // ✅ NOUVEAU — genre de l'utilisateur connecté
    const [genreUtilisateur, setGenreUtilisateur] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        chargerAvis();
        chargerGenreUtilisateur();
    }, []);

    // ✅ NOUVEAU — charge le genre au montage
    const chargerGenreUtilisateur = async () => {
        try {
            const userId = await getUserId();
            if (!userId) return;
            setCurrentUserId(userId);
            const res = await api.get(`/utilisateurs/${userId}`);
            setGenreUtilisateur(res.data.genre); // "HOMME" ou "FEMME"
        } catch (err) {
            console.log('Erreur chargement genre:', err);
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

    // ✅ NOUVEAU — vérifie le genre avant d'ouvrir le modal
    const handleReserverPress = () => {
        if (trajet.femmesUniquement && genreUtilisateur === 'HOMME') {
            Alert.alert(
                '🚫 Accès refusé',
                'Ce trajet est réservé aux femmes uniquement.\n\nVous ne pouvez pas effectuer cette réservation.',
                [{ text: 'Compris', style: 'default' }]
            );
            return; // ← on s'arrête ici, modal jamais ouvert, 0 paiement
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

            setShowPrixModal(false);

            if (response.data.urlPaiement) {
                await Linking.openURL(response.data.urlPaiement);
            } else {
                Alert.alert('Réservation envoyée !', 'En attente de confirmation du conducteur.');
            }
        } catch (error) {
            // ✅ Gère aussi le cas où le backend bloque (double sécurité)
            const msg = error.response?.data?.erreur || 'Erreur lors de la réservation';
            Alert.alert('Réservation impossible', msg);
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

    // ✅ NOUVEAU — détermine si le bouton réserver doit afficher un avertissement
    const estBloqueParGenre = trajet.femmesUniquement && genreUtilisateur === 'HOMME';

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#eee" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Détails du trajet</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

                {/* Date */}
                <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>{formatDate(trajet.dateHeureDepart)}</Text>
                    {/* ✅ NOUVEAU — badge femmes dans le détail */}
                    {trajet.femmesUniquement && (
                        <View style={styles.femmesUniquementBadge}>
                            <Text style={styles.femmesUniquementText}>👩 Réservé aux femmes uniquement</Text>
                        </View>
                    )}
                </View>

                {/* Timeline trajet */}
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

                {/* Infos trajet */}
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
                                Réservation confirmée par le conducteur
                            </Text>
                        </View>
                    </View>
                </View>

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
                            <Text style={[styles.infoText, { color: '#2ecc71' }]}>Profil vérifié</Text>
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

                        <Text style={styles.infoSecurite}>
                            🔒 Le numéro sera visible après confirmation
                        </Text>
                    </View>
                </View>

                {/* Avis */}
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

            {/* ✅ Bouton réserver — adapté selon genre */}
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
                            {estBloqueParGenre ? 'Femmes uniquement' : 'Demande de réservation'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Modal prix — inchangé */}
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
                                <Text style={styles.modalTitle}>Confirmer la réservation</Text>
                                <Text style={styles.modalSubtitle}>
                                    {trajet.villeDepart} → {trajet.villeArrivee}
                                </Text>

                                <View style={styles.modalPrixOriginal}>
                                    <Text style={styles.modalPrixLabel}>Prix affiché</Text>
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

                                <Text style={styles.modalInfo}>
                                    🔒 Vous serez redirigé vers la page de paiement sécurisée
                                </Text>

                                <View style={styles.modalBoutons}>
                                    <TouchableOpacity
                                        style={styles.modalBoutonAnnuler}
                                        onPress={() => {
                                            Keyboard.dismiss();
                                            setShowPrixModal(false);
                                        }}>
                                        <Text style={styles.modalBoutonAnnulerText}>Annuler</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalBoutonConfirmer, loading && { opacity: 0.7 }]}
                                        onPress={reserver}
                                        disabled={loading}>
                                        <Text style={styles.modalBoutonConfirmerText}>
                                            {loading ? 'Chargement...' : 'Payer & Réserver'}
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

    // ✅ NOUVEAU badge femmes dans le détail
    femmesUniquementBadge: {
        marginTop: 10,
        backgroundColor: '#1a0a2a',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#9b59b6',
        alignSelf: 'flex-start',
    },
    femmesUniquementText: {
        color: '#9b59b6',
        fontSize: 13,
        fontWeight: '700',
    },

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
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingVertical: 10,
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
    // ✅ NOUVEAU — bouton grisé pour les hommes
    boutonReserverBloque: {
        backgroundColor: '#5a3a6a',
    },
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
    modalInfo: { fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
    modalBoutons: { flexDirection: 'row', gap: 12 },
    modalBoutonAnnuler: { flex: 1, borderWidth: 1, borderColor: '#444', borderRadius: 10, padding: 14, alignItems: 'center' },
    modalBoutonAnnulerText: { color: '#888', fontSize: 15, fontWeight: '600' },
    modalBoutonConfirmer: { flex: 1, backgroundColor: '#00b5e2', borderRadius: 10, padding: 14, alignItems: 'center' },
    modalBoutonConfirmerText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
});