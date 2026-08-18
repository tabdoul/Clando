import React, { useState, useMemo } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator,
    TextInput, RefreshControl, Linking, Modal, Image, Keyboard, Share,
    KeyboardAvoidingView, Platform
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

    const [confirmationEnCours, setConfirmationEnCours] = useState(null);
    const [confirmes, setConfirmes] = useState([]);

    const [moisSelectionne, setMoisSelectionne] = useState(null);
    const [showMoisDropdown, setShowMoisDropdown] = useState(false);

    const [menuActif, setMenuActif] = useState(null);

    const [showModalPaiement, setShowModalPaiement] = useState(false);
    const [numeroPaiement, setNumeroPaiement] = useState('');
    const [reservationAPayer, setReservationAPayer] = useState(null);
    const [loadingPaiement, setLoadingPaiement] = useState(false);
    const [showModalResultat, setShowModalResultat] = useState(false);
    const [resultatPaiement, setResultatPaiement] = useState(null);

    const NOMS_MOIS_HOOK = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec'];

    const moisDisponibles = useMemo(() => {
        const set = new Set();
        reservations
            .filter(r => ['TERMINEE', 'ANNULEE', 'REFUSEE'].includes(r.statut))
            .forEach(r => {
                const d = new Date(r.dateHeureDepart || r.dateReservation);
                if (!isNaN(d.getTime())) set.add(`${d.getFullYear()}-${d.getMonth()}`);
            });
        return Array.from(set)
            .sort()
            .reverse()
            .map(key => {
                const [annee, mois] = key.split('-').map(Number);
                return { key, annee, mois, label: `${NOMS_MOIS_HOOK[mois]} ${annee}` };
            });
    }, [reservations]);

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

    const getPrixBase = (reservation) => {
        return Math.round((reservation.prix || 0) / 1.13);
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
            setResultatPaiement({
                succes: true,
                trajet: `${reservationAPayer.departPassager || reservationAPayer.villeDepart} → ${reservationAPayer.arriveePassager || reservationAPayer.villeArrivee}`,
                montant: reservationAPayer.prix,
                conducteurNom: `${reservationAPayer.conducteurPrenom} ${reservationAPayer.conducteurNom}`,
                heure: formatHeure(reservationAPayer.dateHeureDepart),
                date: formatDate(reservationAPayer.dateReservation),
            });
            setShowModalResultat(true);
            chargerReservations();
        } catch (err) {
            setShowModalPaiement(false);
            setResultatPaiement({
                succes: false,
                message: err.response?.data?.erreur || "Le paiement Orange Money n'a pas abouti. Verifiez votre numero et reessayez.",
            });
            setShowModalResultat(true);
        } finally {
            setLoadingPaiement(false);
        }
    };

    const partagerTrajet = (item) => {
        const lienPosition = item.trajetDemarre && item.latitudeConducteur
            ? `\n\nSuivez la position du conducteur en temps réel :\nhttps://www.google.com/maps?q=${item.latitudeConducteur},${item.longitudeConducteur}`
            : `\n\nLe suivi en temps réel sera disponible dès que le conducteur démarre le trajet.`;
        Share.share({
            message:
                `Je prends le trajet ${item.villeDepart} → ${item.villeArrivee} avec Wayvo.\n` +
                `Conducteur : ${item.conducteurPrenom} ${item.conducteurNom}\n` +
                (item.departPassager ? `Je monte à : ${item.departPassager}\n` : '') +
                (item.arriveePassager ? `Je descends à : ${item.arriveePassager}\n` : '') +
                lienPosition
        });
    };

    const confirmerTrajet = async (item) => {
        setConfirmationEnCours(item.id);
        try {
            const userId = await getUserId();
            await api.patch(`/reservations/${item.id}/confirmer-trajet?passagerId=${userId}`);
            setConfirmes(prev => [...prev, item.id]);
            Alert.alert('Trajet confirme !', 'Le conducteur va recevoir son paiement immediatement.');
        } catch (error) {
            Alert.alert('Erreur', error.response?.data?.erreur || 'Impossible de confirmer le trajet');
        } finally {
            setConfirmationEnCours(null);
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

    const getStatutIndicateur = (statut) => {
        switch (statut) {
            case 'CONFIRMEE': return '#182D5A';
            case 'TERMINEE': return '#5A6B8C';
            default: return '#B0B0B0';
        }
    };

    const getStatutStyle = (statut) => {
        switch (statut) {
            case 'CONFIRMEE':  return { bg: '#EEF2F7', text: '#182D5A', label: 'Confirmee' };
            case 'EN_ATTENTE': return { bg: '#F5F5F5', text: '#666666', label: 'En attente' };
            case 'ANNULEE':    return { bg: '#F5F5F5', text: '#999999', label: 'Annulee' };
            case 'REFUSEE':    return { bg: '#F5F5F5', text: '#888888', label: 'Refusee' };
            case 'TERMINEE':   return { bg: '#EEF2F7', text: '#5A6B8C', label: 'Terminee' };
            default:           return { bg: '#F5F5F5', text: '#888888', label: statut };
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
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setMenuActif(item)}
                    style={[styles.card, { borderLeftColor: indicateur }]}>

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
                            {(item.payoutEffectue || confirmes.includes(item.id)) ? (
                                <View style={styles.confirmeBloc}>
                                    <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                                    <Text style={styles.confirmeBlocText}>Trajet confirme</Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.btnConfirmerTrajet, confirmationEnCours === item.id && { opacity: 0.7 }]}
                                    onPress={() => confirmerTrajet(item)}
                                    disabled={confirmationEnCours === item.id}>
                                    {confirmationEnCours === item.id ? (
                                        <ActivityIndicator size={16} color="white" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                                            <Text style={styles.btnConfirmerTrajetText}>Confirmer le trajet</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </TouchableOpacity>
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

    const moisActif = moisSelectionne || moisDisponibles[0]?.key || null;

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
    const listeParOnglet = ongletActif === 'encours' ? reservationsEnCours : reservationsHistorique;
    const listeActive = (ongletActif === 'historique' && moisActif)
        ? listeParOnglet.filter(r => {
            const d = new Date(r.dateHeureDepart || r.dateReservation);
            return !isNaN(d.getTime()) && `${d.getFullYear()}-${d.getMonth()}` === moisActif;
        })
        : listeParOnglet;

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

            {ongletActif === 'historique' && moisDisponibles.length > 0 && (
                <TouchableOpacity style={styles.moisDropdownBtn} onPress={() => setShowMoisDropdown(true)}>
                    <Ionicons name="calendar-outline" size={15} color={colors.primary} />
                    <Text style={styles.moisDropdownText}>
                        {moisDisponibles.find(m => m.key === moisActif)?.label || 'Choisir un mois'}
                    </Text>
                    <Ionicons name="chevron-down" size={15} color={colors.primary} />
                </TouchableOpacity>
            )}

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

            {/* Modal paiement */}
            <Modal
                visible={showModalPaiement}
                transparent
                animationType="slide"
                onRequestClose={() => setShowModalPaiement(false)}>
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
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
                                <Text style={[styles.paiementDetailValeur, { color: '#182D5A', fontWeight: 'bold', fontSize: 18 }]}>
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
                </KeyboardAvoidingView>
            </Modal>

            {/* Modal resultat paiement */}
            <Modal
                visible={showModalResultat}
                transparent
                animationType="slide"
                onRequestClose={() => setShowModalResultat(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalResultatCard}>
                        {resultatPaiement?.succes ? (
                            <>
                                <View style={styles.resultatIconeSucces}>
                                    <Ionicons name="checkmark" size={36} color="#182D5A" />
                                </View>
                                <Text style={styles.resultatTitre}>Paiement confirme</Text>
                                <Text style={styles.resultatSousTitre}>{resultatPaiement.trajet}</Text>

                                <View style={styles.resultatMontantBloc}>
                                    <Text style={styles.resultatMontant}>
                                        {`${resultatPaiement.montant?.toLocaleString() || 0} GNF`}
                                    </Text>
                                    <Text style={styles.resultatMontantLabel}>Paye via Orange Money</Text>
                                </View>

                                <View style={styles.resultatConducteurRow}>
                                    <View style={styles.resultatConducteurAvatar}>
                                        <Text style={styles.resultatConducteurInitiales}>
                                            {resultatPaiement.conducteurNom?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles.resultatConducteurNom}>{resultatPaiement.conducteurNom}</Text>
                                        <Text style={styles.resultatConducteurMeta}>{`${resultatPaiement.date} · ${resultatPaiement.heure}`}</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.resultatBoutonPrimaire}
                                    onPress={() => setShowModalResultat(false)}>
                                    <Text style={styles.resultatBoutonPrimaireText}>Voir mes reservations</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <View style={styles.resultatIconeEchec}>
                                    <Ionicons name="close" size={36} color={colors.red} />
                                </View>
                                <Text style={styles.resultatTitre}>Paiement echoue</Text>
                                <Text style={styles.resultatMessageEchec}>{resultatPaiement?.message}</Text>

                                <TouchableOpacity
                                    style={styles.resultatBoutonPrimaire}
                                    onPress={() => {
                                        setShowModalResultat(false);
                                        setShowModalPaiement(true);
                                    }}>
                                    <Text style={styles.resultatBoutonPrimaireText}>Reessayer</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.resultatBoutonSecondaire}
                                    onPress={() => setShowModalResultat(false)}>
                                    <Text style={styles.resultatBoutonSecondaireText}>Fermer</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Modal menu contextuel */}
            <Modal
                visible={!!menuActif}
                transparent
                animationType="slide"
                onRequestClose={() => setMenuActif(null)}>
                <TouchableOpacity
                    style={styles.menuOverlay}
                    activeOpacity={1}
                    onPress={() => setMenuActif(null)}>
                    <View style={styles.menuCard}>
                        <View style={styles.menuHandle} />

                        {menuActif && (
                            <>
                                <View style={styles.menuHeader}>
                                    <Text style={styles.menuHeaderTitre}>
                                        {`${menuActif.villeDepart} → ${menuActif.villeArrivee}`}
                                    </Text>
                                    <Text style={styles.menuHeaderSousTitre}>
                                        {`${menuActif.conducteurPrenom} ${menuActif.conducteurNom} · ${getStatutStyle(menuActif.statut).label}`}
                                    </Text>
                                </View>

                                {menuActif.statutPaiement === 'SUCCESS' && (
                                    <TouchableOpacity
                                        style={styles.menuItem}
                                        onPress={() => { partagerTrajet(menuActif); setMenuActif(null); }}>
                                        <View style={styles.menuItemIcone}>
                                            <Ionicons name="share-outline" size={16} color="#182D5A" />
                                        </View>
                                        <Text style={styles.menuItemTexte}>Partager le trajet</Text>
                                    </TouchableOpacity>
                                )}

                                {menuActif.statut === 'TERMINEE' && (
                                    <TouchableOpacity
                                        style={styles.menuItem}
                                        onPress={() => {
                                            const m = menuActif;
                                            setMenuActif(null);
                                            navigation.navigate('Avis', {
                                                conducteurId: m.conducteurId,
                                                conducteurNom: m.conducteurNom,
                                                conducteurPrenom: m.conducteurPrenom,
                                                trajetId: m.trajetId
                                            });
                                        }}>
                                        <View style={styles.menuItemIcone}>
                                            <Ionicons name="star-outline" size={16} color="#182D5A" />
                                        </View>
                                        <Text style={styles.menuItemTexte}>Laisser un avis</Text>
                                    </TouchableOpacity>
                                )}

                                {menuActif.statut === 'TERMINEE' && !menuActif.payoutEffectue && (
                                    <TouchableOpacity
                                        style={styles.menuItem}
                                        onPress={() => {
                                            const m = menuActif;
                                            setMenuActif(null);
                                            navigation.navigate('Aide', {
                                                reservationId: m.id,
                                                villeDepart: m.villeDepart,
                                                villeArrivee: m.villeArrivee,
                                            });
                                        }}>
                                        <View style={[styles.menuItemIcone, styles.menuItemIconeAlerte]}>
                                            <Ionicons name="flag-outline" size={16} color={colors.red} />
                                        </View>
                                        <Text style={[styles.menuItemTexte, { color: colors.red }]}>
                                            Signaler un probleme
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                        <TouchableOpacity style={styles.menuFermer} onPress={() => setMenuActif(null)}>
                            <Text style={styles.menuFermerTexte}>Fermer</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Modal choix du mois */}
            <Modal
                visible={showMoisDropdown}
                transparent
                animationType="fade"
                onRequestClose={() => setShowMoisDropdown(false)}>
                <TouchableOpacity
                    style={styles.moisModalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowMoisDropdown(false)}>
                    <View style={styles.moisModalCard}>
                        {moisDisponibles.map((m) => (
                            <TouchableOpacity
                                key={m.key}
                                style={styles.moisModalItem}
                                onPress={() => { setMoisSelectionne(m.key); setShowMoisDropdown(false); }}>
                                <Text style={[
                                    styles.moisModalItemText,
                                    moisActif === m.key && styles.moisModalItemTextActif
                                ]}>
                                    {m.label}
                                </Text>
                                {moisActif === m.key && (
                                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

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
        </View>
    );
}
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    loadingContainer: { flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center' },
    header: { backgroundColor: '#182D5A', paddingTop: 60, paddingBottom: 20, paddingHorizontal: spacing.xl },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    moisDropdownBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginLeft: spacing.lg, marginTop: 12, backgroundColor: '#EEF2F7', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
    moisDropdownText: { fontSize: 13, fontWeight: '600', color: '#182D5A' },
    moisModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    moisModalCard: { backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 8, width: 220, maxHeight: 320 },
    moisModalItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 18 },
    moisModalItemText: { fontSize: 14, color: '#1a1a1a' },
    moisModalItemTextActif: { color: '#182D5A', fontWeight: '700' },

    onglets: { flexDirection: 'row', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#EEF2F7' },
    onglet: { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
    ongletActif: { borderBottomWidth: 2, borderBottomColor: '#182D5A' },
    ongletText: { fontSize: 14, fontWeight: '600', color: '#888888' },
    ongletTextActif: { color: '#182D5A' },
    ongletBadge: { backgroundColor: '#182D5A', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    ongletBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 18, color: '#888888', marginTop: 16 },
    emptySubtext: { fontSize: 14, color: '#cccccc', marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },

    cardWrapper: { paddingHorizontal: spacing.lg, marginTop: 12 },
    card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#EEF2F7', borderLeftWidth: 3, shadowColor: '#182D5A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    trajetRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    ville: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
    statutBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
    statutText: { fontSize: 11, fontWeight: '600' },

    trajetPassager: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
    trajetPassagerText: { fontSize: 12, color: '#888888' },

    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8, flexWrap: 'wrap' },
    metaText: { fontSize: 12, color: '#888888' },
    metaDot: { color: '#EEF2F7', fontSize: 12 },

    paiementOk: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EEF2F7', borderRadius: 8, padding: 8, marginBottom: 10 },
    paiementOkText: { fontSize: 12, color: '#182D5A', fontWeight: '600' },

    enAttenteTexte: { fontSize: 13, color: '#888888', marginBottom: 10, backgroundColor: '#EEF2F7', borderRadius: 8, padding: 10 },

    messageBloc: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EEF2F7', borderRadius: 8, padding: 10, marginTop: 8 },
    messageBlocText: { fontSize: 13, color: '#888888', flex: 1 },

    actions: { marginTop: 4 },

    btnPayer: { backgroundColor: '#182D5A', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 },
    btnPayerText: { color: 'white', fontSize: 14, fontWeight: 'bold' },

    actionsSecondaires: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },

    btnSm: { flex: 1, borderWidth: 1, borderColor: '#EEF2F7', borderRadius: 8, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: '45%' },
    btnSmDanger: { borderColor: '#E52424' },
    btnSmAccent: { backgroundColor: '#182D5A', borderColor: '#182D5A' },
    btnSmText: { fontSize: 12, fontWeight: '600' },

    btnAnnuler: { borderWidth: 1, borderColor: '#E52424', borderRadius: 10, padding: 10, alignItems: 'center' },
    btnAnnulerText: { color: '#E52424', fontSize: 13, fontWeight: '600' },

    menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    menuCard: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
    menuHandle: { width: 36, height: 4, backgroundColor: '#EEF2F7', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    menuHeader: { paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#EEF2F7', marginBottom: 6 },
    menuHeaderTitre: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
    menuHeaderSousTitre: { fontSize: 12, color: '#888888', marginTop: 2 },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
    menuItemIcone: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEF2F7', alignItems: 'center', justifyContent: 'center' },
    menuItemIconeAlerte: { backgroundColor: '#ffebee' },
    menuItemTexte: { fontSize: 14, fontWeight: '500', color: '#1a1a1a' },
    menuFermer: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EEF2F7', alignItems: 'center' },
    menuFermerTexte: { fontSize: 14, fontWeight: '600', color: '#888888' },

    btnConfirmerTrajet: { backgroundColor: '#182D5A', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 },
    btnConfirmerTrajetText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
    confirmeBloc: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EEF2F7', borderRadius: 8, padding: 10, marginBottom: 8, justifyContent: 'center' },
    confirmeBlocText: { fontSize: 13, color: '#182D5A', fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
    modalSubtitle: { fontSize: 13, color: '#888888', marginTop: 4 },
    modalVide: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    modalVideText: { color: '#888888', fontSize: 15 },

    passagerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#EEF2F7', borderRadius: 12, padding: 12, marginBottom: 8 },
    passagerAvatar: { width: 44, height: 44, borderRadius: 22 },
    passagerAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2F7', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D8E4F0' },
    passagerInitiales: { color: '#182D5A', fontSize: 16, fontWeight: '700' },
    passagerInfos: { flex: 1 },
    passagerNom: { color: '#1a1a1a', fontSize: 15, fontWeight: '600' },

    paiementDetail: { backgroundColor: '#EEF2F7', borderRadius: 12, padding: 16, marginBottom: 16 },
    paiementDetailLigne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    paiementDetailLabel: { fontSize: 13, color: '#888888' },
    paiementDetailValeur: { fontSize: 13, color: '#1a1a1a', textAlign: 'right' },
    paiementDetailSeparator: { height: 1, backgroundColor: '#D8E4F0', marginVertical: 6 },
    paiementInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#EEF2F7', borderRadius: 10, padding: 12, marginBottom: 16 },
    paiementInfoTexte: { fontSize: 13, color: '#888888', flex: 1, lineHeight: 20 },
    paiementLabel: { fontSize: 12, fontWeight: '600', color: '#888888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    paiementInput: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EEF2F7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: '#D8E4F0', marginBottom: 20 },
    paiementInputText: { flex: 1, padding: 10, fontSize: 16, color: '#1a1a1a' },
    boutonConfirmerPaiement: { backgroundColor: '#182D5A', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    boutonConfirmerPaiementText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

    modalResultatCard: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, alignItems: 'center' },
    resultatIconeSucces: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#EEF2F7', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
    resultatIconeEchec: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#ffebee', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
    resultatTitre: { fontSize: 19, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
    resultatSousTitre: { fontSize: 14, color: '#888888', marginBottom: 22 },
    resultatMessageEchec: { fontSize: 14, color: '#888888', textAlign: 'center', lineHeight: 20, marginBottom: 22, paddingHorizontal: 8 },
    resultatMontantBloc: { backgroundColor: '#EEF2F7', borderRadius: 14, padding: 16, marginBottom: 20, width: '100%', alignItems: 'center' },
    resultatMontant: { fontSize: 26, fontWeight: 'bold', color: '#182D5A' },
    resultatMontantLabel: { fontSize: 12, color: '#888888', marginTop: 4 },
    resultatConducteurRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fafbfc', borderRadius: 10, padding: 12, width: '100%', marginBottom: 20 },
    resultatConducteurAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEF2F7', alignItems: 'center', justifyContent: 'center' },
    resultatConducteurInitiales: { fontSize: 11, fontWeight: '600', color: '#182D5A' },
    resultatConducteurNom: { fontSize: 13, fontWeight: '600', color: '#1a1a1a' },
    resultatConducteurMeta: { fontSize: 11, color: '#888888' },
    resultatBoutonPrimaire: { backgroundColor: '#182D5A', borderRadius: 12, padding: 14, width: '100%', alignItems: 'center' },
    resultatBoutonPrimaireText: { color: 'white', fontSize: 14, fontWeight: '600' },
    resultatBoutonSecondaire: { padding: 14, width: '100%', alignItems: 'center' },
    resultatBoutonSecondaireText: { color: '#888888', fontSize: 14, fontWeight: '600' },
});