import React from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows } from '../../constants/theme';

export default function ResultatsScreen({ route, navigation }) {
    const { trajets, villeDepart, villeArrivee } = route.params;

    const formatHeure = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const formatDateTrajet = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <View style={styles.trajetHeader}>
                        <Text style={styles.villeText}>{villeDepart}</Text>
                        <Ionicons name="arrow-forward" size={16} color={colors.accent} />
                        <Text style={styles.villeText}>{villeArrivee}</Text>
                    </View>
                    <Text style={styles.headerSubtitle}>{`${trajets.length} trajet(s) disponible(s)`}</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {trajets.map((item) => (
                    <TouchableOpacity
                        key={item.id.toString()}
                        style={styles.cardWrapper}
                        onPress={() => navigation.navigate('TrajetDetail', { trajet: item, villeDepart, villeArrivee })}>
                        <View style={styles.card}>
                            <View style={styles.cardTop}>
                                <View style={styles.heureContainer}>
                                    <Text style={styles.heure}>{formatHeure(item.dateHeureDepart)}</Text>
                                    <Text style={styles.dateTrajet}>{formatDateTrajet(item.dateHeureDepart)}</Text>
                                </View>

                                <View style={styles.trajetInfo}>
                                    <Text style={styles.ville}>{item.villeDepart}</Text>
                                    <View style={styles.ligne}>
                                        <View style={styles.ligneBar} />
                                        <Ionicons name="car-outline" size={18} color={colors.primary} />
                                        <View style={styles.ligneBar} />
                                    </View>
                                    <Text style={styles.ville}>{item.villeArrivee}</Text>
                                    {item.itineraire ? (
                                        <Text style={styles.itineraire}>{`Via ${item.itineraire}`}</Text>
                                    ) : null}
                                </View>

                                <View style={styles.prixContainer}>
                                    <Text style={styles.prix}>{item.prixConducteur?.toLocaleString()}</Text>
                                    <Text style={styles.prixDevise}>GNF</Text>
                                    {item.placesDisponibles <= 2 && item.placesDisponibles > 0 && (
                                        <View style={styles.presqueCompletBadge}>
                                            <Text style={styles.presqueCompletText}>Presque complet</Text>
                                        </View>
                                    )}
                                    {item.placesDisponibles === 0 && (
                                        <View style={styles.comptetBadge}>
                                            <Text style={styles.comptetBadgeText}>Complet</Text>
                                        </View>
                                    )}
                                    <Text style={styles.places}>{`${item.placesDisponibles} place(s)`}</Text>
                                </View>
                            </View>

                            <View style={styles.separator} />

                            <View style={styles.cardBottom}>
                                <View style={styles.conducteurInfo}>
                                    <View style={styles.avatar}>
                                        {item.conducteurPhoto ? (
                                            <Image source={{ uri: item.conducteurPhoto }} style={styles.avatarImage} />
                                        ) : (
                                            <Text style={styles.avatarText}>
                                                {`${item.conducteurPrenom?.charAt(0)}${item.conducteurNom?.charAt(0)}`}
                                            </Text>
                                        )}
                                    </View>
                                    <View>
                                        <Text style={styles.conducteurNom}>
                                            {`${item.conducteurNom} ${item.conducteurPrenom}`}
                                        </Text>
                                        <View style={styles.conducteurStats}>
                                            <Ionicons name="star" size={12} color={colors.orange} />
                                            <Text style={styles.conducteurNote}>
                                                {item.noteMoyenneConducteur > 0
                                                    ? item.noteMoyenneConducteur.toFixed(1)
                                                    : 'Nouveau'}
                                            </Text>
                                            <Text style={styles.conducteurTrajets}>
                                                {`• ${item.nbTrajetsTerminesConducteur} trajet(s)`}
                                            </Text>
                                        </View>
                                        <Text style={styles.vehicule}>
                                            {`${item.vehiculeMarque} ${item.vehiculeModele}`}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.rightSection}>
                                    {item.femmesUniquement && (
                                        <View style={styles.femmesUniquementBadge}>
                                            <Text style={styles.femmesUniquementBadgeText}>Femmes uniquement</Text>
                                        </View>
                                    )}
                                    {item.statut === 'OUVERT' && item.placesDisponibles > 0 ? (
                                        <View style={styles.boutonReserver}>
                                            <Text style={styles.boutonReserverText}>Voir</Text>
                                            <Ionicons name="chevron-forward" size={16} color="white" />
                                        </View>
                                    ) : (
                                        <View style={styles.complet}>
                                            <Text style={styles.comptetText}>Complet</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        backgroundColor: colors.primary,
        paddingTop: 60, paddingBottom: 20, paddingHorizontal: spacing.xl,
        flexDirection: 'row', alignItems: 'center', gap: 16,
    },
    backButton: { padding: 4 },
    headerInfo: { flex: 1 },
    trajetHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    villeText: { fontSize: 18, fontWeight: 'bold', color: 'white' },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
    cardWrapper: { paddingHorizontal: spacing.lg, marginTop: 12 },
    card: {
        backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg,
        borderLeftWidth: 3, borderLeftColor: colors.primary,
        borderWidth: 1, borderColor: colors.border,
        ...shadows.card,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    heureContainer: { alignItems: 'center', minWidth: 52 },
    heure: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
    dateTrajet: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    trajetInfo: { flex: 1, alignItems: 'center' },
    ville: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    ligne: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 5 },
    ligneBar: { flex: 1, height: 1, backgroundColor: colors.border },
    itineraire: { fontSize: 11, color: colors.primary, fontStyle: 'italic', marginTop: 3 },
    prixContainer: { alignItems: 'flex-end', minWidth: 80 },
    prix: { fontSize: 18, fontWeight: 'bold', color: colors.accent },
    prixDevise: { fontSize: 11, color: colors.accent, marginTop: -2 },
    places: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
    presqueCompletBadge: { backgroundColor: colors.orangeLight, borderRadius: 8, paddingVertical: 2, paddingHorizontal: 6, marginTop: 4 },
    presqueCompletText: { color: '#e65100', fontSize: 9, fontWeight: '600' },
    comptetBadge: { backgroundColor: colors.redLight, borderRadius: 8, paddingVertical: 2, paddingHorizontal: 6, marginTop: 4 },
    comptetBadgeText: { color: colors.red, fontSize: 9, fontWeight: '600' },
    separator: { height: 1, backgroundColor: colors.separator, marginVertical: 12 },
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    conducteurInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
    avatarImage: { width: 40, height: 40, borderRadius: 20 },
    avatarText: { color: colors.textMuted, fontSize: 14, fontWeight: 'bold' },
    conducteurNom: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
    conducteurStats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    conducteurNote: { fontSize: 12, color: colors.orange, fontWeight: '600' },
    conducteurTrajets: { fontSize: 11, color: colors.textMuted },
    vehicule: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    rightSection: { alignItems: 'flex-end', gap: 6 },
    femmesUniquementBadge: {
        backgroundColor: colors.purpleLight, borderRadius: 8,
        paddingVertical: 3, paddingHorizontal: 8,
        borderWidth: 1, borderColor: colors.purple,
    },
    femmesUniquementBadgeText: { color: colors.purple, fontSize: 10, fontWeight: '600' },
    boutonReserver: {
        backgroundColor: colors.accent, borderRadius: 20,
        paddingVertical: 8, paddingHorizontal: 14,
        flexDirection: 'row', alignItems: 'center', gap: 4,
    },
    boutonReserverText: { color: 'white', fontSize: 13, fontWeight: 'bold' },
    complet: { backgroundColor: colors.surfaceSecondary, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 18 },
    comptetText: { color: colors.textMuted, fontSize: 13 },
});