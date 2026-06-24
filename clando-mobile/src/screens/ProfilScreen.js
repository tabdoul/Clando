import React from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ResultatsScreen({ route, navigation }) {
    const { trajets, villeDepart, villeArrivee } = route.params;

    const formatHeure = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#eee" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <View style={styles.trajetHeader}>
                        <Text style={styles.villeText} numberOfLines={1}>{villeDepart}</Text>
                        <Ionicons name="arrow-forward" size={16} color="#00b5e2" />
                        <Text style={styles.villeText} numberOfLines={1}>{villeArrivee}</Text>
                    </View>
                    <Text style={styles.headerSubtitle}>
                        {trajets.length} trajet{trajets.length > 1 ? 's' : ''} disponible{trajets.length > 1 ? 's' : ''}
                    </Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
                {trajets.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="car-outline" size={64} color="#444" />
                        <Text style={styles.emptyText}>Aucun trajet disponible</Text>
                        <Text style={styles.emptySubtext}>Essayez une autre date ou destination</Text>
                    </View>
                )}

                {trajets.map((item) => (
                    <TouchableOpacity
                        key={item.id.toString()}
                        onPress={() => navigation.navigate('TrajetDetail', {
                            trajet: item,
                            villeDepart,
                            villeArrivee
                        })}
                        activeOpacity={0.85}>
                        <View style={[
                            styles.card,
                            item.placesDisponibles === 0 && styles.cardComplet
                        ]}>

                            {/* Badges en haut */}
                            <View style={styles.badgesRow}>
                                {item.femmesUniquement && (
                                    <View style={styles.badgeFemmes}>
                                        <Ionicons name="female" size={11} color="#9b59b6" />
                                        <Text style={styles.badgeFemmesText}>Femmes uniquement</Text>
                                    </View>
                                )}
                                {item.placesDisponibles === 1 && (
                                    <View style={styles.badgeUrgent}>
                                        <Text style={styles.badgeUrgentText}>Derniere place !</Text>
                                    </View>
                                )}
                                {item.placesDisponibles === 0 && (
                                    <View style={styles.badgeComplet}>
                                        <Text style={styles.badgeCompletText}>Complet</Text>
                                    </View>
                                )}
                            </View>

                            {/* Ligne heure + trajet */}
                            <View style={styles.trajetRow}>
                                <View style={styles.heureBlock}>
                                    <Text style={styles.heure}>{formatHeure(item.dateHeureDepart)}</Text>
                                    <Text style={styles.date}>{formatDate(item.dateHeureDepart)}</Text>
                                </View>

                                <View style={styles.trajetCenter}>
                                    <View style={styles.trajetLigne}>
                                        <View style={styles.dot} />
                                        <View style={styles.ligneBar} />
                                        <Ionicons name="car" size={16} color="#00b5e2" />
                                        <View style={styles.ligneBar} />
                                        <View style={[styles.dot, styles.dotArrivee]} />
                                    </View>
                                    <View style={styles.villesRow}>
                                        <Text style={styles.ville} numberOfLines={1}>{item.villeDepart}</Text>
                                        <Text style={styles.ville} numberOfLines={1}>{item.villeArrivee}</Text>
                                    </View>
                                    {item.itineraire && (
                                        <Text style={styles.itineraire}>Via {item.itineraire}</Text>
                                    )}
                                </View>
                            </View>

                            <View style={styles.separateur} />

                            {/* Infos véhicule + places */}
                            <View style={styles.infoRow}>
                                <View style={styles.infoItem}>
                                    <Ionicons name="car-outline" size={14} color="#666" />
                                    <Text style={styles.infoText}>
                                        {item.vehiculeMarque} {item.vehiculeModele}
                                    </Text>
                                </View>
                                <View style={styles.infoItem}>
                                    <Ionicons name="people-outline" size={14} color="#666" />
                                    <Text style={[
                                        styles.infoText,
                                        item.placesDisponibles <= 2 && item.placesDisponibles > 0 && { color: '#f39c12' }
                                    ]}>
                                        {item.placesDisponibles} place{item.placesDisponibles > 1 ? 's' : ''}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.separateur} />

                            {/* Conducteur + prix */}
                            <View style={styles.bottomRow}>
                                <View style={styles.conducteurRow}>
                                    {item.conducteurPhoto ? (
                                        <Image source={{ uri: item.conducteurPhoto }} style={styles.conducteurAvatar} />
                                    ) : (
                                        <View style={styles.conducteurAvatarPlaceholder}>
                                            <Text style={styles.conducteurAvatarText}>
                                                {item.conducteurPrenom?.charAt(0)}{item.conducteurNom?.charAt(0)}
                                            </Text>
                                        </View>
                                    )}
                                    <View>
                                        <Text style={styles.conducteurNom}>
                                            {item.conducteurPrenom} {item.conducteurNom}
                                        </Text>
                                        <View style={styles.noteRow}>
                                            <Ionicons name="star" size={12} color="#f39c12" />
                                            <Text style={styles.note}>
                                                {item.noteMoyenneConducteur > 0
                                                    ? item.noteMoyenneConducteur.toFixed(1)
                                                    : 'Nouveau'}
                                            </Text>
                                            <Text style={styles.noteDot}>·</Text>
                                            <Text style={styles.nbTrajets}>
                                                {item.nbTrajetsTerminesConducteur} trajet{item.nbTrajetsTerminesConducteur > 1 ? 's' : ''}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.prixBlock}>
                                    <Text style={styles.prix}>{item.prix?.toLocaleString()}</Text>
                                    <Text style={styles.prixDevise}>GNF</Text>
                                </View>
                            </View>

                            {/* Bouton voir */}
                            {item.statut === 'OUVERT' && item.placesDisponibles > 0 && (
                                <View style={styles.boutonVoir}>
                                    <Text style={styles.boutonVoirText}>Voir le trajet</Text>
                                    <Ionicons name="arrow-forward" size={14} color="white" />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}

                <View style={{ height: 16 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    header: {
        backgroundColor: '#1a1a1a',
        paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', gap: 16,
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
    },
    backButton: { padding: 4 },
    headerInfo: { flex: 1 },
    trajetHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    villeText: { fontSize: 18, fontWeight: 'bold', color: '#eee', flex: 1 },
    headerSubtitle: { fontSize: 13, color: '#888', marginTop: 4 },

    emptyContainer: { alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyText: { fontSize: 18, color: '#666' },
    emptySubtext: { fontSize: 14, color: '#444' },

    card: {
        backgroundColor: '#1e1e1e',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2a2a2a',
        borderLeftWidth: 3,
        borderLeftColor: '#00b5e2',
    },
    cardComplet: { borderLeftColor: '#444', opacity: 0.6 },

    badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
    badgeFemmes: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#1a0a2a', borderRadius: 8,
        paddingVertical: 3, paddingHorizontal: 8,
        borderWidth: 1, borderColor: '#9b59b6',
    },
    badgeFemmesText: { color: '#9b59b6', fontSize: 11, fontWeight: '600' },
    badgeUrgent: {
        backgroundColor: '#3a1a1a', borderRadius: 8,
        paddingVertical: 3, paddingHorizontal: 8,
        borderWidth: 1, borderColor: '#e74c3c',
    },
    badgeUrgentText: { color: '#e74c3c', fontSize: 11, fontWeight: '600' },
    badgeComplet: {
        backgroundColor: '#2a2a2a', borderRadius: 8,
        paddingVertical: 3, paddingHorizontal: 8,
    },
    badgeCompletText: { color: '#666', fontSize: 11, fontWeight: '600' },

    trajetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },

    heureBlock: { alignItems: 'center', minWidth: 52 },
    heure: { fontSize: 22, fontWeight: 'bold', color: '#eee' },
    date: { fontSize: 11, color: '#666', marginTop: 2, textAlign: 'center' },

    trajetCenter: { flex: 1 },
    trajetLigne: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00b5e2' },
    dotArrivee: { backgroundColor: '#2ecc71' },
    ligneBar: { flex: 1, height: 1, backgroundColor: '#333' },
    villesRow: { flexDirection: 'row', justifyContent: 'space-between' },
    ville: { fontSize: 14, fontWeight: '600', color: '#ddd', flex: 1 },
    itineraire: { fontSize: 11, color: '#00b5e2', fontStyle: 'italic', marginTop: 4 },

    separateur: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 12 },

    infoRow: { flexDirection: 'row', gap: 16 },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoText: { fontSize: 13, color: '#888' },

    bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    conducteurRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    conducteurAvatar: { width: 38, height: 38, borderRadius: 19 },
    conducteurAvatarPlaceholder: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: '#00b5e2', alignItems: 'center', justifyContent: 'center',
    },
    conducteurAvatarText: { color: 'white', fontSize: 13, fontWeight: 'bold' },
    conducteurNom: { fontSize: 13, fontWeight: '600', color: '#ddd' },
    noteRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    note: { fontSize: 12, color: '#f39c12', fontWeight: '600' },
    noteDot: { color: '#444', fontSize: 12 },
    nbTrajets: { fontSize: 11, color: '#666' },

    prixBlock: { alignItems: 'flex-end' },
    prix: { fontSize: 20, fontWeight: 'bold', color: '#00b5e2' },
    prixDevise: { fontSize: 11, color: '#00b5e2', marginTop: -2 },

    boutonVoir: {
        backgroundColor: '#00b5e2', borderRadius: 10,
        padding: 10, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center',
        gap: 6, marginTop: 12,
    },
    boutonVoirText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
});