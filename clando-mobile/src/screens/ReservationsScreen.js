import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator,
    TextInput, RefreshControl, Linking, Modal, Image, Keyboard, Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { getUserId } from '../services/auth.service';
import { colors, spacing, radius, shadows } from '../../constants/theme';

export default function ReservationsScreen({ navigation }) {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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
            await api.post(`/reservations/${reservationAPayer.id}/payer-test`);
            setShowModalPaiement(false);
            Alert.alert(
                'Paiement confirme !',
                'Votre paiement a ete confirme avec succes.',
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
    const formatHeure = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('fr-FR', {
        hour: '2-digit', minute: '2-digit', hour12: false
    });
};

    const getPrixBase = (reservation) => {
        return Math.round((reservation.prix || 0) / 1.13);
    };

    const getStatutIndicateur = (statut) => {
        switch (statut) {
            case 'CONFIRMEE': return colors.primary;
            case 'EN_ATTENTE': return colors.orange;
            default: return colors.textMuted;
        }
    };

    const getStatutStyle = (statut) => {
        switch (statut) {
            case 'CONFIRMEE':  return { bg: colors.greenLight, text: colors.primary, label: 'Confirmee' };
            case 'EN_ATTENTE': return { bg: colors.orangeLight, text: '#e65100',    label: 'En attente' };
            case 'ANNULEE':    return { bg: colors.surfaceSecondary, text: colors.textMuted, label: 'Annulee' };
            case 'REFUSEE':    return { bg: colors.redLight, text: '#c62828',    label: 'Refusee' };
            case 'TERMINEE':   return { bg: colors.accentLight, text: colors.accentDark, label: 'Terminee' };
            default:           return { bg: colors.surfaceSecondary, text: colors.textMuted, label: statut };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short'
        });
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
                            <Ionicons name="arrow-forward" size={13} color={colors.textMuted} />
                            <Text style={styles.ville}>{item.villeArrivee}</Text>
                        </View>
                        <View style={[styles.statutBadge, { backgroundColor: statut.bg }]}>
                            <Text style={[styles.statutText, { color: statut.text }]}>
                                {statut.label}
                            </Text>
                        </View>
                    </View>

                    {/* Trajet passager */}
                    {item.departPassager && item.arriveePassager && (
                        <View style={styles.trajetPassager}>
                            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                            <Text style={styles.trajetPassagerText}>
                                {`${item.departPassager} → ${item.arriveePassager}`}
                            </Text>
                        </View>
                    )}

                    {/* Méta */}
                    <View style={styles.metaRow}>
    <Ionicons name="time-outline" size={12} color={colors.textMuted} />
    <Text style={styles.metaText}>{formatHeure(item.dateHeureDepart)}</Text>
    <Text style={styles.metaDot}>·</Text>
    <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
    <Text style={styles.metaText}>{formatDate(item.dateReservation)}</Text>
    <Text style={styles.metaDot}>·</Text>
    <Text style={styles.metaText}>{`${item.nbPlaces} place(s)`}</Text>
</View>

                    {/* Paiement confirmé */}
                    {aPaye && (
                        <View style={styles.paiementOk}>
                            <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                            <Text style={styles.paiementOkText}>
                                {`Paiement confirme · ${item.prix?.toLocaleString()} GNF`}
                            </Text>
                        </View>
                    )}

                    {/* EN_ATTENTE */}
                    {item.statut === 'EN_ATTENTE' && (
                        <View style={styles.actions}>
                            <Text style={styles.enAttenteTexte}>
                                En attente de confirmation du conducteur
                            </Text>
                            <TouchableOpacity
                                style={styles.btnAnnuler}
                                onPress={() => annuler(item)}>
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
                                        interlocuteur: {
                                            id: item.conducteurId,
                                            nom: item.conducteurNom,
                                            prenom: item.conducteurPrenom
                                        },
                                        userId: null
                                    })}>
                                    <Ionicons name="chatbubble-outline" size={13} color={colors.primary} />
                                    <Text style={[styles.btnSmText, { color: colors.primary }]}>Contacter</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.btnSm, styles.btnSmDanger]}
                                    onPress={() => annuler(item)}>
                                    <Ionicons name="close" size={13} color={colors.red} />
                                    <Text style={[styles.btnSmText, { color: colors.red }]}>Annuler</Text>
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
                                        interlocuteur: {
                                            id: item.conducteurId,
                                            nom: item.conducteurNom,
                                            prenom: item.conducteurPrenom
                                        },
                                        userId: null
                                    })}>
                                    <Ionicons name="chatbubble-outline" size={13} color={colors.primary} />
                                    <Text style={[styles.btnSmText, { color: colors.primary }]}>Contacter</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.btnSm, { flex: 1 }]}
                                    onPress={() => voirCopassagers(item)}>
                                    <Ionicons name="people-outline" size={13} color={colors.textMuted} />
                                    <Text style={[styles.btnSmText, { color: colors.textMuted }]}>Copassagers</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.btnSm, { flex: 1 }]}
                                    onPress={() => Share.share({
                                        message:
                                            `Je prends le trajet ${item.villeDepart} → ${item.villeArrivee} avec Wayvo.\n` +
                                            `Conducteur : ${item.conducteurPrenom} ${item.conducteurNom}\n` +
                                            (item.departPassager ? `Je monte à : ${item.departPassager}\n` : '') +
                                            (item.arriveePassager ? `Je descends à : ${item.arriveePassager}\n` : '') +
                                            `\nSuivez mon trajet en temps réel.`
                                    })}>
                                    <Ionicons name="share-social-outline" size={13} color={colors.textMuted} />
                                    <Text style={[styles.btnSmText, { color: colors.textMuted }]}>Partager</Text>
                                </TouchableOpacity>
                                {item.trajetDemarre && item.latitudeConducteur && (
                                    <TouchableOpacity
                                        style={[styles.btnSm, styles.btnSmAccent, { flex: 1 }]}
                                        onPress={() => Linking.openURL(
                                            `https://www.google.com/maps?q=${item.latitudeConducteur},${item.longitudeConducteur}`
                                        )}>
                                        <Ionicons name="navigate-outline" size={13} color="white" />
                                        <Text style={[styles.btnSmText, { color: 'white' }]}>Position</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}

                    {/* REFUSEE */}
                    {item.statut === 'REFUSEE' && (
                        <View style={styles.messageBloc}>
                            <Ionicons name="close-circle-outline" size={16} color={colors.textMuted} />
                            <Text style={styles.messageBlocText}>
                                Le conducteur a refuse votre demande.
                            </Text>
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
                                <Ionicons name="star-outline" size={15} color={colors.textMuted} />
                                <Text style={styles.btnAvisText}>Laisser un avis</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size={36} color={colors.primary} />
            </View>
        );
    }

    const reservationsEnCours = reservations.filter(r =>
        ['EN_ATTENTE', 'CONFIRMEE'].includes(r.statut)
    );
    const reservationsHistorique = reservations
    .filter(r => ['TERMINEE', 'ANNULEE', 'REFUSEE'].includes(r.statut))
    .sort((a, b) => {
        const dateA = new Date(a.dateHeureDepart || a.dateReservation);
        const dateB = new Date(b.dateHeureDepart || b.dateReservation);
        return dateB - dateA; // ✅ plus récent en premier
    });
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
                        <View style={[styles.ongletBadge, { backgroundColor: colors.textMuted }]}>
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
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }>

                {listeActive.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Ionicons
                            name={ongletActif === 'encours' ? 'ticket-outline' : 'archive-outline'}
                            size={64} color={colors.border}
                        />
                        <Text style={styles.emptyText}>
                            {ongletActif === 'encours'
                                ? 'Aucune reservation en cours'
                                : 'Aucun historique'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {ongletActif === 'encours'
                                ? 'Vos reservations actives apparaitront ici'
                                : 'Vos trajets termines et annules apparaitront ici'}
                        </Text>
                    </View>
                )}

                {listeActive.map((item) => renderReservation(item))}
                <View style={{ height: 30 }} />
            </ScrollView>

            {/* Modal copassagers */}
            <Modal
                visible={showCopassagers}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCopassagers(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Copassagers</Text>
                                {reservationSelectionnee && (
                                    <Text style={styles.modalSubtitle}>
                                        {`${reservationSelectionnee.villeDepart} → ${reservationSelectionnee.villeArrivee}`}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setShowCopassagers(false)}>
                                <Ionicons name="close" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        {loadingCopassagers ? (
                            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
                        ) : copassagers.length === 0 ? (
                            <View style={styles.modalVide}>
                                <Ionicons name="people-outline" size={48} color={colors.border} />
                                <Text style={styles.modalVideText}>Aucun autre passager confirme</Text>
                            </View>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {copassagers.map((p) => {
                                    const initiales = `${(p.passagerPrenom || '?')[0]}${(p.passagerNom || '?')[0]}`.toUpperCase();
                                    return (
                                        <View key={p.id.toString()} style={styles.passagerCard}>
                                            {p.passagerPhoto ? (
                                                <Image
                                                    source={{ uri: p.passagerPhoto }}
                                                    style={styles.passagerAvatar}
                                                />
                                            ) : (
                                                <View style={styles.passagerAvatarPlaceholder}>
                                                    <Text style={styles.passagerInitiales}>{initiales}</Text>
                                                </View>
                                            )}
                                            <View style={styles.passagerInfos}>
                                                <Text style={styles.passagerNom}>
                                                    {`${p.passagerPrenom} ${p.passagerNom}`}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Modal paiement */}
            <Modal
                visible={showModalPaiement}
                transparent
                animationType="slide"
                onRequestClose={() => setShowModalPaiement(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Paiement Orange Money</Text>
                                {reservationAPayer && (
                                    <Text style={styles.modalSubtitle}>
                                        {`${reservationAPayer.departPassager || reservationAPayer.villeDepart} → ${reservationAPayer.arriveePassager || reservationAPayer.villeArrivee}`}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setShowModalPaiement(false)}>
                                <Ionicons name="close" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.paiementDetail}>
                            <View style={styles.paiementDetailLigne}>
                                <Text style={styles.paiementDetailLabel}>Prix trajet</Text>
                                <Text style={styles.paiementDetailValeur}>
                                    {reservationAPayer
                                        ? `${getPrixBase(reservationAPayer).toLocaleString()} GNF`
                                        : '0 GNF'}
                                </Text>
                            </View>
                            <View style={styles.paiementDetailLigne}>
                                <Text style={styles.paiementDetailLabel}>Frais de service</Text>
                                <Text style={styles.paiementDetailValeur}>
                                    {reservationAPayer
                                        ? `${Math.round((reservationAPayer.prix || 0) - getPrixBase(reservationAPayer)).toLocaleString()} GNF`
                                        : '0 GNF'}
                                </Text>
                            </View>
                            <View style={styles.paiementDetailSeparator} />
                            <View style={styles.paiementDetailLigne}>
                                <Text style={[styles.paiementDetailLabel, { color: colors.textPrimary, fontWeight: 'bold' }]}>
                                    Total
                                </Text>
                                <Text style={[styles.paiementDetailValeur, { color: colors.primary, fontWeight: 'bold', fontSize: 18 }]}>
                                    {`${reservationAPayer?.prix?.toLocaleString() || 0} GNF`}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.paiementInfo}>
                            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
                            <Text style={styles.paiementInfoTexte}>
                                Entrez votre numéro Orange Money pour confirmer le paiement.
                            </Text>
                        </View>

                        <Text style={styles.paiementLabel}>Numéro Orange Money</Text>
                        <View style={styles.paiementInput}>
                            <Ionicons name="phone-portrait-outline" size={18} color={colors.textMuted} />
                            <TextInput
                                style={styles.paiementInputText}
                                placeholder="Ex: 620000000"
                                placeholderTextColor={colors.textDisabled}
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
                                    <Text style={styles.boutonConfirmerPaiementText}>
                                        Confirmer le paiement
                                    </Text>
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
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 20,
        paddingHorizontal: spacing.xl,
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },

    onglets: {
        flexDirection: 'row', backgroundColor: colors.surface,
        borderBottomWidth: 1, borderBottomColor: colors.separator,
    },
    onglet: {
        flex: 1, paddingVertical: 14, alignItems: 'center',
        justifyContent: 'center', flexDirection: 'row', gap: 6,
    },
    ongletActif: { borderBottomWidth: 2, borderBottomColor: colors.accent },
    ongletText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
    ongletTextActif: { color: colors.accent },
    ongletBadge: {
        backgroundColor: colors.accent, borderRadius: 10,
        minWidth: 18, height: 18, alignItems: 'center',
        justifyContent: 'center', paddingHorizontal: 4,
    },
    ongletBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 18, color: colors.textMuted, marginTop: 16 },
    emptySubtext: {
        fontSize: 14, color: colors.textDisabled, marginTop: 4,
        textAlign: 'center', paddingHorizontal: 40,
    },

    cardWrapper: { paddingHorizontal: spacing.lg, marginTop: 12 },
    card: {
        backgroundColor: colors.surface, borderRadius: radius.md, padding: 14,
        borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3,
        ...shadows.card,
    },
    cardHeader: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 8,
    },
    trajetRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    ville: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    statutBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
    statutText: { fontSize: 11, fontWeight: '600' },

    trajetPassager: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
    trajetPassagerText: { fontSize: 12, color: colors.textMuted },

    metaRow: {
        flexDirection: 'row', alignItems: 'center',
        gap: 5, marginBottom: 8, flexWrap: 'wrap',
    },
    metaText: { fontSize: 12, color: colors.textMuted },
    metaDot: { color: colors.border, fontSize: 12 },

    paiementOk: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: colors.greenLight, borderRadius: 8, padding: 8, marginBottom: 10,
    },
    paiementOkText: { fontSize: 12, color: colors.primary, fontWeight: '600' },

    enAttenteTexte: {
        fontSize: 13, color: colors.textMuted, marginBottom: 10,
        backgroundColor: colors.surfaceSecondary, borderRadius: 8, padding: 10,
    },

    messageBloc: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: colors.surfaceSecondary, borderRadius: 8, padding: 10, marginTop: 8,
    },
    messageBlocText: { fontSize: 13, color: colors.textMuted, flex: 1 },

    actions: { marginTop: 4 },

    btnPayer: {
        backgroundColor: colors.accent, borderRadius: 10, padding: 12,
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8, marginBottom: 8,
    },
    btnPayerText: { color: 'white', fontSize: 14, fontWeight: 'bold' },

    actionsSecondaires: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },

    btnSm: {
        flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8,
        paddingVertical: 8, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 4,
        minWidth: '45%',
    },
    btnSmDanger: { borderColor: colors.red },
    btnSmAccent: { backgroundColor: colors.accent, borderColor: colors.accent },
    btnSmText: { fontSize: 12, fontWeight: '600' },

    btnAnnuler: {
        borderWidth: 1, borderColor: colors.red,
        borderRadius: 10, padding: 10, alignItems: 'center',
    },
    btnAnnulerText: { color: colors.red, fontSize: 13, fontWeight: '600' },

    btnAvis: {
        borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    btnAvisText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalCard: {
        backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 24, maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 20,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
    modalSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
    modalVide: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    modalVideText: { color: colors.textMuted, fontSize: 15 },

    passagerCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: colors.surfaceSecondary, borderRadius: 12, padding: 12, marginBottom: 8,
    },
    passagerAvatar: { width: 44, height: 44, borderRadius: 22 },
    passagerAvatarPlaceholder: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceSecondary,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: colors.border,
    },
    passagerInitiales: { color: colors.textMuted, fontSize: 16, fontWeight: '700' },
    passagerInfos: { flex: 1 },
    passagerNom: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },

    paiementDetail: { backgroundColor: colors.surfaceSecondary, borderRadius: 12, padding: 16, marginBottom: 16 },
    paiementDetailLigne: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 6,
    },
    paiementDetailLabel: { fontSize: 13, color: colors.textMuted },
    paiementDetailValeur: { fontSize: 13, color: colors.textPrimary, textAlign: 'right' },
    paiementDetailSeparator: { height: 1, backgroundColor: colors.border, marginVertical: 6 },
    paiementInfo: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: colors.surfaceSecondary, borderRadius: 10, padding: 12, marginBottom: 16,
    },
    paiementInfoTexte: { fontSize: 13, color: colors.textMuted, flex: 1, lineHeight: 20 },
    paiementLabel: {
        fontSize: 12, fontWeight: '600', color: colors.textMuted,
        marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1,
    },
    paiementInput: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: colors.surfaceSecondary, borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 4,
        borderWidth: 1, borderColor: colors.border, marginBottom: 20,
    },
    paiementInputText: { flex: 1, padding: 10, fontSize: 16, color: colors.textPrimary },
    boutonConfirmerPaiement: {
        backgroundColor: colors.accent, borderRadius: 12, padding: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    boutonConfirmerPaiementText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});