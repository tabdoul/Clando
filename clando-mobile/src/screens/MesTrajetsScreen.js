import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { getUserId } from '../services/auth.service';
import { colors } from '../../constants/theme';

const NAVY = '#182D5A';
const GRIS = colors.textMuted;
const GRIS_CLAIR = '#EEF2F7';
const VERT = '#2E9E5B';
const ROUGE = colors.red || '#E52424';
const ORANGE = '#E8A93B';

function formatDateHeure(dateHeureDepart) {
    const d = new Date(dateHeureDepart);
    const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    const heureStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} · ${heureStr}`;
}

function badgeStatutPaiement(statutPaiement, payoutEffectue) {
    if (payoutEffectue) return { label: 'Paye au conducteur', color: VERT };
    if (statutPaiement === 'SUCCESS') return { label: 'Paye', color: VERT };
    if (statutPaiement === 'PENDING') return { label: 'En attente', color: ORANGE };
    return { label: 'Non paye', color: GRIS };
}

function badgeStatutReservation(statut) {
    switch (statut) {
        case 'CONFIRMEE':
            return { label: 'Confirmee', color: VERT };
        case 'TERMINEE':
            return { label: 'Terminee', color: NAVY };
        case 'EN_ATTENTE':
            return { label: 'En attente', color: ORANGE };
        case 'ANNULEE':
        case 'REFUSEE':
            return { label: 'Annulee', color: ROUGE };
        default:
            return { label: statut, color: GRIS };
    }
}

function PassagerRow({ passager }) {
    const badgePaiement = badgeStatutPaiement(passager.statutPaiement, passager.payoutEffectue);
    const badgeReservation = badgeStatutReservation(passager.statut);

    return (
        <View style={styles.passagerRow}>
            <View style={styles.passagerInfo}>
                <Text style={styles.passagerNom}>{passager.passagerPrenom} {passager.passagerNom}</Text>
                <Text style={styles.passagerPlaces}>{passager.nbPlaces} place{passager.nbPlaces > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.passagerBadges}>
                <View style={[styles.badge, { backgroundColor: badgeReservation.color }]}>
                    <Text style={styles.badgeText}>{badgeReservation.label}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: badgePaiement.color }]}>
                    <Text style={styles.badgeText}>{badgePaiement.label}</Text>
                </View>
            </View>
        </View>
    );
}

function TrajetCard({ trajet, expanded, onToggle, passagers, chargementPassagers }) {
    return (
        <View style={styles.card}>
            <TouchableOpacity onPress={onToggle} style={styles.cardHeader} activeOpacity={0.7}>
                <View style={styles.cardHeaderLeft}>
                    <Text style={styles.villes}>{trajet.villeDepart} → {trajet.villeArrivee}</Text>
                    <Text style={styles.dateHeure}>{formatDateHeure(trajet.dateHeureDepart)}</Text>
                </View>
                <View style={styles.cardHeaderRight}>
                    <Text style={styles.prix}>{Math.round(trajet.prixConducteur).toLocaleString('fr-FR')} GNF</Text>
                    <Text style={styles.places}>
                        {trajet.nbReservationsConfirmees ?? 0} passager{(trajet.nbReservationsConfirmees ?? 0) > 1 ? 's' : ''} · {trajet.placesDisponibles} libre{trajet.placesDisponibles > 1 ? 's' : ''}
                    </Text>
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.passagersContainer}>
                    {chargementPassagers ? (
                        <ActivityIndicator color={NAVY} style={{ paddingVertical: 12 }} />
                    ) : passagers.length === 0 ? (
                        <Text style={styles.aucunPassager}>Aucune reservation pour ce trajet</Text>
                    ) : (
                        passagers.map((p) => <PassagerRow key={p.id} passager={p} />)
                    )}
                </View>
            )}
        </View>
    );
}

export default function MesTrajetsScreen({ route }) {
    const navigation = useNavigation();
    const [trajets, setTrajets] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [rafraichissement, setRafraichissement] = useState(false);
    const [trajetOuvertId, setTrajetOuvertId] = useState(null);
    const [passagersParTrajet, setPassagersParTrajet] = useState({});
    const [chargementPassagersId, setChargementPassagersId] = useState(null);
    const [erreur, setErreur] = useState(null);

    const chargerTrajets = useCallback(async () => {
        try {
            setErreur(null);
            const conducteurId = route?.params?.conducteurId ?? await getUserId();
            if (!conducteurId) {
                setErreur('Impossible de determiner le conducteur');
                return;
            }

            const reponse = await api.get(`/trajets/conducteur/${conducteurId}`);
            const maintenant = new Date();

            const trajetsAVenir = reponse.data
                .filter((t) => new Date(t.dateHeureDepart) >= maintenant)
                .filter((t) => t.statut !== 'ANNULE' && t.statut !== 'TERMINE')
                .sort((a, b) => new Date(a.dateHeureDepart) - new Date(b.dateHeureDepart));

            setTrajets(trajetsAVenir);
        } catch (e) {
            setErreur("Impossible de charger vos trajets");
        } finally {
            setChargement(false);
            setRafraichissement(false);
        }
    }, [route]);

    useFocusEffect(
        useCallback(() => {
            chargerTrajets();
        }, [chargerTrajets])
    );

    const onRafraichir = () => {
        setRafraichissement(true);
        chargerTrajets();
    };

    const toggleTrajet = async (trajetId) => {
        if (trajetOuvertId === trajetId) {
            setTrajetOuvertId(null);
            return;
        }

        setTrajetOuvertId(trajetId);

        if (!passagersParTrajet[trajetId]) {
            setChargementPassagersId(trajetId);
            try {
                const reponse = await api.get(`/reservations/trajet/${trajetId}`);
                setPassagersParTrajet((prev) => ({ ...prev, [trajetId]: reponse.data }));
            } catch (e) {
                setPassagersParTrajet((prev) => ({ ...prev, [trajetId]: [] }));
            } finally {
                setChargementPassagersId(null);
            }
        }
    };

    if (chargement) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.boutonRetour}>
                        <Ionicons name="chevron-back" size={24} color={NAVY} />
                    </TouchableOpacity>
                    <Text style={styles.titre}>Mes trajets publies</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.centre}>
                    <ActivityIndicator size="large" color={NAVY} />
                </View>
            </View>
        );
    }

    if (erreur) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.boutonRetour}>
                        <Ionicons name="chevron-back" size={24} color={NAVY} />
                    </TouchableOpacity>
                    <Text style={styles.titre}>Mes trajets publies</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.centre}>
                    <Text style={styles.erreurTexte}>{erreur}</Text>
                    <TouchableOpacity onPress={chargerTrajets} style={styles.boutonReessayer}>
                        <Text style={styles.boutonReessayerTexte}>Reessayer</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.boutonRetour}>
                    <Ionicons name="chevron-back" size={24} color={NAVY} />
                </TouchableOpacity>
                <Text style={styles.titre}>Mes trajets publies</Text>
                <View style={styles.headerSpacer} />
            </View>
            <FlatList
                data={trajets}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.liste}
                refreshControl={
                    <RefreshControl refreshing={rafraichissement} onRefresh={onRafraichir} tintColor={NAVY} />
                }
                ListEmptyComponent={
                    <View style={styles.centre}>
                        <Text style={styles.videTexte}>Aucun trajet a venir</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TrajetCard
                        trajet={item}
                        expanded={trajetOuvertId === item.id}
                        onToggle={() => toggleTrajet(item.id)}
                        passagers={passagersParTrajet[item.id] || []}
                        chargementPassagers={chargementPassagersId === item.id}
                    />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 8, paddingBottom: 12 },
    boutonRetour: { padding: 8 },
    headerSpacer: { width: 40 },
    centre: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    titre: { flex: 1, fontSize: 18, fontWeight: '700', color: NAVY, textAlign: 'center' },
    liste: { paddingHorizontal: 16, paddingBottom: 24 },
    erreurTexte: { color: ROUGE, fontSize: 15, textAlign: 'center', marginBottom: 12 },
    boutonReessayer: { backgroundColor: NAVY, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    boutonReessayerTexte: { color: '#FFFFFF', fontWeight: '600' },
    videTexte: { color: GRIS, fontSize: 15, marginTop: 40 },
    card: { backgroundColor: GRIS_CLAIR, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
    cardHeaderLeft: { flex: 1 },
    cardHeaderRight: { alignItems: 'flex-end' },
    villes: { fontSize: 15, fontWeight: '700', color: NAVY },
    dateHeure: { fontSize: 13, color: GRIS, marginTop: 2, textTransform: 'capitalize' },
    prix: { fontSize: 14, fontWeight: '700', color: NAVY },
    places: { fontSize: 12, color: GRIS, marginTop: 2 },
    passagersContainer: { borderTopWidth: 1, borderTopColor: '#E2E4E8', paddingHorizontal: 14, paddingVertical: 8 },
    aucunPassager: { color: GRIS, fontSize: 13, paddingVertical: 10, textAlign: 'center' },
    passagerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E2E4E8' },
    passagerInfo: { flex: 1 },
    passagerNom: { fontSize: 14, fontWeight: '600', color: NAVY },
    passagerPlaces: { fontSize: 12, color: GRIS, marginTop: 2 },
    passagerBadges: { flexDirection: 'row', gap: 6 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
});