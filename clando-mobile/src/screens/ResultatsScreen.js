import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, Alert, Modal,
    TextInput, Keyboard, Image, Linking,
    KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { getUserId } from '../services/auth.service';

export default function ResultatsScreen({ route, navigation }) {
    const { trajets, villeDepart, villeArrivee } = route.params;
    const [prixPropose, setPrixPropose] = useState('');
    const [showPrixModal, setShowPrixModal] = useState(false);
    const [trajetSelectionne, setTrajetSelectionne] = useState(null);
    const [numeroTelephone, setNumeroTelephone] = useState('');
    const [loading, setLoading] = useState(false);

    const formatHeure = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });
    };

    const formatDateTrajet = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short'
        });
    };

    const ouvrirReservation = (trajet) => {
        setTrajetSelectionne(trajet);
        setShowPrixModal(true);
        setPrixPropose(trajet.prix.toString());
        setNumeroTelephone('');
    };

    const reserver = async () => {
        Keyboard.dismiss();

        if (!numeroTelephone || numeroTelephone.trim().length < 8) {
            Alert.alert(
                'Numéro requis',
                'Veuillez saisir votre numéro Orange Money pour payer votre réservation.'
            );
            return;
        }

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
                trajetId: trajetSelectionne.id,
                prixPropose: prixFinal !== trajetSelectionne.prix ? prixFinal : null,
                numeroTelephone: numeroTelephone.trim()
            });

            setShowPrixModal(false);
if (response.data.urlPaiement) {
    await Linking.openURL(response.data.urlPaiement);
} else {
    Alert.alert('Réservation envoyée !', 'En attente de confirmation du conducteur.');
} 
        } catch (error) {
            Alert.alert('Erreur', error.response?.data?.erreur || 'Erreur lors de la réservation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#eee" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <View style={styles.trajetHeader}>
                        <Text style={styles.villeText}>{villeDepart}</Text>
                        <Ionicons name="arrow-forward" size={16} color="#00b5e2" />
                        <Text style={styles.villeText}>{villeArrivee}</Text>
                    </View>
                    <Text style={styles.headerSubtitle}>{trajets.length} trajet(s) disponible(s)</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {trajets.map((item) => (
                    <View key={item.id.toString()} style={styles.cardWrapper}>
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
                                        <Ionicons name="car-outline" size={18} color="#00b5e2" />
                                        <View style={styles.ligneBar} />
                                    </View>
                                    <Text style={styles.ville}>{item.villeArrivee}</Text>
                                    {item.itineraire ? (
                                        <Text style={styles.itineraire}>Via {item.itineraire}</Text>
                                    ) : null}
                                </View>

                                <View style={styles.prixContainer}>
                                    <Text style={styles.prix}>{item.prix.toLocaleString()}</Text>
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
                                    <Text style={styles.places}>{item.placesDisponibles} place(s)</Text>
                                </View>
                            </View>

                            <View style={styles.separator} />

                            <View style={styles.cardBottom}>
                                <TouchableOpacity
                                    style={styles.conducteurInfo}
                                    onPress={() => navigation.navigate('Avis', {
                                        conducteurId: item.conducteurId,
                                        conducteurNom: item.conducteurNom,
                                        conducteurPrenom: item.conducteurPrenom,
                                        trajetId: item.id
                                    })}>
                                    <View style={styles.avatar}>
                                        {item.conducteurPhoto ? (
                                            <Image
                                                source={{ uri: `https://clando-production.up.railway.app/api/utilisateurs/photo/${item.conducteurPhoto.split('\\').pop().split('/').pop()}` }}
                                                style={styles.avatarImage}
                                            />
                                        ) : (
                                            <Text style={styles.avatarText}>
                                                {item.conducteurPrenom?.charAt(0)}{item.conducteurNom?.charAt(0)}
                                            </Text>
                                        )}
                                    </View>
                                    <View>
                                        <Text style={styles.conducteurNom}>
                                            {item.conducteurNom} {item.conducteurPrenom}
                                        </Text>
                                        <View style={styles.conducteurStats}>
                                            <Ionicons name="star" size={12} color="#f39c12" />
                                            <Text style={styles.conducteurNote}>
                                                {item.noteMoyenneConducteur > 0
                                                    ? item.noteMoyenneConducteur.toFixed(1)
                                                    : 'Nouveau'}
                                            </Text>
                                            <Text style={styles.conducteurTrajets}>
                                                • {item.nbTrajetsTerminesConducteur} trajet(s)
                                            </Text>
                                        </View>
                                        <Text style={styles.vehicule}>
                                            {item.vehiculeMarque} {item.vehiculeModele}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {item.statut === 'OUVERT' && item.placesDisponibles > 0 ? (
                                    <TouchableOpacity
                                        style={styles.boutonReserver}
                                        onPress={() => ouvrirReservation(item)}>
                                        <Text style={styles.boutonReserverText}>Réserver</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.complet}>
                                        <Text style={styles.comptetText}>Complet</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                ))}
                <View style={{ height: 30 }} />
            </ScrollView>

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
                    <Text style={styles.modalTitle}>Réserver ce trajet</Text>
                    <Text style={styles.modalSubtitle}>
                        {trajetSelectionne?.villeDepart} → {trajetSelectionne?.villeArrivee}
                    </Text>

                    <View style={styles.modalPrixOriginal}>
                        <Text style={styles.modalPrixLabel}>Prix affiché</Text>
                        <Text style={styles.modalPrixValeur}>
                            {trajetSelectionne?.prix?.toLocaleString()} GNF
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

                    <Text style={styles.modalLabel}>
                        Numéro Orange Money <Text style={{ color: '#e74c3c' }}>*</Text>
                    </Text>
                    <View style={styles.modalInput}>
                        <TextInput
                            style={styles.modalInputText}
                            value={numeroTelephone}
                            onChangeText={setNumeroTelephone}
                            keyboardType="phone-pad"
                            placeholder="00224620000000"
                            placeholderTextColor="#666"
                            returnKeyType="done"
                            onSubmitEditing={() => Keyboard.dismiss()}
                        />
                    </View>

                    <Text style={styles.modalInfo}>
                        🔒 Vous serez redirigé vers la page de paiement Orange Money
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
        flexDirection: 'row', alignItems: 'center', gap: 16,
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
    },
    backButton: { padding: 4 },
    headerInfo: { flex: 1 },
    trajetHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    villeText: { fontSize: 18, fontWeight: 'bold', color: '#eee' },
    headerSubtitle: { fontSize: 13, color: '#888', marginTop: 4 },
    cardWrapper: { paddingHorizontal: 16, marginTop: 12 },
    card: {
        backgroundColor: '#1e1e1e', borderRadius: 14, padding: 16,
        borderLeftWidth: 3, borderLeftColor: '#00b5e2',
        borderWidth: 1, borderColor: '#2a2a2a',
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    heureContainer: { alignItems: 'center', minWidth: 52 },
    heure: { fontSize: 20, fontWeight: 'bold', color: '#eee' },
    dateTrajet: { fontSize: 11, color: '#666', marginTop: 2 },
    trajetInfo: { flex: 1, alignItems: 'center' },
    ville: { fontSize: 14, fontWeight: '600', color: '#ddd' },
    ligne: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 5 },
    ligneBar: { flex: 1, height: 1, backgroundColor: '#333' },
    itineraire: { fontSize: 11, color: '#00b5e2', fontStyle: 'italic', marginTop: 3 },
    prixContainer: { alignItems: 'flex-end', minWidth: 80 },
    prix: { fontSize: 18, fontWeight: 'bold', color: '#00b5e2' },
    prixDevise: { fontSize: 11, color: '#00b5e2', marginTop: -2 },
    places: { fontSize: 11, color: '#666', marginTop: 4 },
    presqueCompletBadge: { backgroundColor: '#3a2a1a', borderRadius: 8, paddingVertical: 2, paddingHorizontal: 6, marginTop: 4 },
    presqueCompletText: { color: '#f39c12', fontSize: 9, fontWeight: '600' },
    comptetBadge: { backgroundColor: '#3a1a1a', borderRadius: 8, paddingVertical: 2, paddingHorizontal: 6, marginTop: 4 },
    comptetBadgeText: { color: '#e74c3c', fontSize: 9, fontWeight: '600' },
    separator: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 12 },
    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    conducteurInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00b5e2', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarImage: { width: 40, height: 40, borderRadius: 20 },
    avatarText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
    conducteurNom: { fontSize: 13, fontWeight: '600', color: '#ddd' },
    conducteurStats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    conducteurNote: { fontSize: 12, color: '#f39c12', fontWeight: '600' },
    conducteurTrajets: { fontSize: 11, color: '#666' },
    vehicule: { fontSize: 11, color: '#666', marginTop: 2 },
    boutonReserver: { backgroundColor: '#00b5e2', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 18 },
    boutonReserverText: { color: 'white', fontSize: 13, fontWeight: 'bold' },
    complet: { backgroundColor: '#c0392b', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 18 },
    comptetText: { color: 'white', fontSize: 13 },
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