import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { getUserId } from '../services/auth.service';

export default function AvisScreen({ route, navigation }) {
    const { conducteurId, conducteurNom, conducteurPrenom, trajetId } = route.params;
    const [note, setNote] = useState(0);
    const [commentaire, setCommentaire] = useState('');
    const [loading, setLoading] = useState(false);
    const [avisExistants, setAvisExistants] = useState([]);
    const [stats, setStats] = useState({ noteMoyenne: 0, nbTrajets: 0 });
    const [loadingAvis, setLoadingAvis] = useState(true);
    const [peutLaisserAvis, setPeutLaisserAvis] = useState(false);
    const [dejaLaisse, setDejaLaisse] = useState(false);
    const [heureAutorisation, setHeureAutorisation] = useState(null);
    const [checkingDroit, setCheckingDroit] = useState(true);

    useEffect(() => {
        chargerAvis();
        chargerStats();
        if (trajetId) verifierDroit();
    }, []);

    const chargerAvis = async () => {
        try {
            const response = await api.get(`/avis/utilisateur/${conducteurId}`);
            setAvisExistants(response.data);
        } catch (error) {
            console.log('Erreur chargement avis');
        } finally {
            setLoadingAvis(false);
        }
    };

    const chargerStats = async () => {
        try {
            const response = await api.get(`/avis/utilisateur/${conducteurId}/moyenne`);
            setStats(response.data);
        } catch (error) {
            console.log('Erreur stats');
        }
    };

    const verifierDroit = async () => {
        try {
            const userId = await getUserId();
            const response = await api.get(`/avis/peut-laisser-avis/${trajetId}/${userId}`);
            setPeutLaisserAvis(response.data.peutLaisserAvis);
            setDejaLaisse(response.data.dejaLaisse);
            setHeureAutorisation(response.data.heureAutorisation);
        } catch (error) {
            console.log('Erreur vérification droit');
        } finally {
            setCheckingDroit(false);
        }
    };

    const soumettre = async () => {
        if (note === 0) {
            Alert.alert('Erreur', 'Veuillez sélectionner une note');
            return;
        }
        setLoading(true);
        try {
            const userId = await getUserId();
            await api.post('/avis', {
                note,
                commentaire,
                auteurId: userId,
                destinataireId: conducteurId,
                trajetId
            });
            Alert.alert('Merci !', 'Votre avis a été publié.', [
                { text: 'OK', onPress: () => {
                    setDejaLaisse(true);
                    setPeutLaisserAvis(false);
                    chargerAvis();
                    chargerStats();
                }}
            ]);
        } catch (error) {
            Alert.alert('Erreur', error.response?.data?.erreur || 'Impossible de publier');
        } finally {
            setLoading(false);
        }
    };

    const renderEtoiles = (noteAffichee, interactive = false) => {
        return (
            <View style={styles.etoilesRow}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <TouchableOpacity
                        key={i}
                        onPress={() => interactive && setNote(i)}
                        disabled={!interactive}>
                        <Ionicons
                            name={i <= noteAffichee ? "star" : "star-outline"}
                            size={interactive ? 36 : 16}
                            color={i <= noteAffichee ? "#f39c12" : "#444"}
                            style={{ marginHorizontal: 2 }}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    return (
        <View style={styles.container}>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#eee" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Avis conducteur</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

                {/* Profil conducteur */}
                <View style={styles.profilCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {conducteurPrenom?.charAt(0)}{conducteurNom?.charAt(0)}
                        </Text>
                    </View>
                    <View style={styles.profilInfo}>
                        <Text style={styles.profilNom}>{conducteurPrenom} {conducteurNom}</Text>
                        <View style={styles.statsRow}>
                            {renderEtoiles(Math.round(stats.noteMoyenne))}
                            <Text style={styles.noteMoyenne}>
                                {stats.noteMoyenne > 0 ? stats.noteMoyenne.toFixed(1) : 'Nouveau'}
                            </Text>
                        </View>
                        <Text style={styles.nbTrajets}>
                            {stats.nbTrajets} trajet(s) effectué(s)
                        </Text>
                    </View>
                </View>

                {/* Section laisser un avis */}
                {trajetId && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Laisser un avis</Text>

                        {checkingDroit && (
                            <ActivityIndicator size={24} color="#00b5e2" style={{ marginTop: 10 }} />
                        )}

                        {!checkingDroit && dejaLaisse && (
                            <View style={styles.dejaLaisseCard}>
                                <Ionicons name="checkmark-circle" size={24} color="#2ecc71" />
                                <Text style={styles.dejaLaisseText}>
                                    Vous avez déjà laissé un avis
                                </Text>
                            </View>
                        )}

                        {!checkingDroit && !dejaLaisse && !peutLaisserAvis && heureAutorisation && (
                            <View style={styles.attenteCard}>
                                <Ionicons name="time-outline" size={24} color="#f39c12" />
                                <View style={styles.attenteInfo}>
                                    <Text style={styles.attenteTitle}>Pas encore disponible</Text>
                                    <Text style={styles.attenteText}>
                                        Vous pourrez laisser un avis à partir de{' '}
                                        {new Date(heureAutorisation).toLocaleTimeString('fr-FR', {
                                            hour: '2-digit', minute: '2-digit'
                                        })} (5h après le départ)
                                    </Text>
                                </View>
                            </View>
                        )}

                        {!checkingDroit && peutLaisserAvis && (
                            <View style={styles.card}>
                                <Text style={styles.noteLabel}>Votre note</Text>
                                {renderEtoiles(note, true)}

                                <Text style={styles.noteLabel}>Commentaire (optionnel)</Text>
                                <TextInput
                                    style={styles.commentaireInput}
                                    placeholder="Partagez votre expérience..."
                                    placeholderTextColor="#666"
                                    value={commentaire}
                                    onChangeText={setCommentaire}
                                    multiline
                                    numberOfLines={3}
                                />

                                <TouchableOpacity
                                    style={[styles.boutonSoumettre, loading && { opacity: 0.7 }]}
                                    onPress={soumettre}
                                    disabled={loading}>
                                    {loading
                                        ? <ActivityIndicator size={20} color="white" />
                                        : <>
                                            <Ionicons name="send" size={16} color="white" />
                                            <Text style={styles.boutonSoumettreText}>
                                                {"Publier l'avis"}
                                            </Text>
                                        </>
                                    }
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* Liste des avis */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Avis reçus ({avisExistants.length})
                    </Text>

                    {loadingAvis && (
                        <ActivityIndicator size={36} color="#00b5e2" style={{ marginTop: 20 }} />
                    )}

                    {!loadingAvis && avisExistants.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="star-outline" size={48} color="#444" />
                            <Text style={styles.emptyText}>{"Aucun avis pour l\'instant"}</Text>
                        </View>
                    )}

                    {avisExistants.map((avis) => (
                        <View key={avis.id.toString()} style={styles.avisCard}>
                            <View style={styles.avisHeader}>
                                <View style={styles.avisAvatar}>
                                    <Text style={styles.avisAvatarText}>
                                        {avis.auteurPrenom?.charAt(0)}{avis.auteurNom?.charAt(0)}
                                    </Text>
                                </View>
                                <View style={styles.avisInfo}>
                                    <Text style={styles.avisAuteur}>
                                        {avis.auteurPrenom} {avis.auteurNom}
                                    </Text>
                                    <View style={styles.avisNoteRow}>
                                        {renderEtoiles(avis.note)}
                                        <Text style={styles.avisDate}>{formatDate(avis.dateAvis)}</Text>
                                    </View>
                                </View>
                            </View>
                            {avis.commentaire && (
                                <Text style={styles.avisCommentaire}>{avis.commentaire}</Text>
                            )}
                        </View>
                    ))}
                </View>

                <View style={{ height: 30 }} />
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
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#eee' },
    profilCard: {
        backgroundColor: '#1e1e1e', margin: 16, borderRadius: 14,
        padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16,
        borderWidth: 1, borderColor: '#2a2a2a',
    },
    avatar: {
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: '#00b5e2', alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    profilInfo: { flex: 1 },
    profilNom: { fontSize: 18, fontWeight: 'bold', color: '#eee', marginBottom: 6 },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    noteMoyenne: { fontSize: 16, fontWeight: 'bold', color: '#f39c12' },
    nbTrajets: { fontSize: 13, color: '#888' },
    etoilesRow: { flexDirection: 'row', alignItems: 'center' },
    section: { paddingHorizontal: 16, marginTop: 8, marginBottom: 8 },
    sectionTitle: {
        fontSize: 13, fontWeight: '600', color: '#888',
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
    },
    card: {
        backgroundColor: '#1e1e1e', borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: '#2a2a2a',
    },
    noteLabel: {
        fontSize: 13, color: '#888', marginBottom: 10, marginTop: 8,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    commentaireInput: {
        backgroundColor: '#252525', borderRadius: 10, padding: 12,
        color: '#eee', fontSize: 14, borderWidth: 1, borderColor: '#2a2a2a',
        minHeight: 80, textAlignVertical: 'top', marginBottom: 16,
    },
    boutonSoumettre: {
        backgroundColor: '#00b5e2', borderRadius: 10, padding: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    boutonSoumettreText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
    dejaLaisseCard: {
        backgroundColor: '#1a3a2a', borderRadius: 12, padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderWidth: 1, borderColor: '#2ecc71',
    },
    dejaLaisseText: { fontSize: 14, color: '#2ecc71', fontWeight: '600' },
    attenteCard: {
        backgroundColor: '#3a2a1a', borderRadius: 12, padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderWidth: 1, borderColor: '#f39c12',
    },
    attenteInfo: { flex: 1 },
    attenteTitle: { fontSize: 14, fontWeight: '600', color: '#f39c12', marginBottom: 4 },
    attenteText: { fontSize: 13, color: '#aaa', lineHeight: 18 },
    emptyContainer: { alignItems: 'center', paddingVertical: 30 },
    emptyText: { fontSize: 14, color: '#666', marginTop: 10 },
    avisCard: {
        backgroundColor: '#1e1e1e', borderRadius: 12, padding: 14,
        marginBottom: 10, borderWidth: 1, borderColor: '#2a2a2a',
    },
    avisHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    avisAvatar: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#00b5e2', alignItems: 'center', justifyContent: 'center',
    },
    avisAvatarText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
    avisInfo: { flex: 1 },
    avisAuteur: { fontSize: 14, fontWeight: '600', color: '#ddd', marginBottom: 2 },
    avisNoteRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avisDate: { fontSize: 11, color: '#666' },
    avisCommentaire: { fontSize: 13, color: '#aaa', lineHeight: 18 },
});