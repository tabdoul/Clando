import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator,
    TextInput, RefreshControl, Image, Modal, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import api from '../services/api';
import { getUserId, logout } from '../services/auth.service';

export default function ProfilScreen({ navigation }) {
    const [utilisateur, setUtilisateur] = useState(null);
    const [vehicules, setVehicules] = useState([]);
    const [trajets, setTrajets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [email, setEmail] = useState('');
    const [telephone, setTelephone] = useState('');
    const [miniBio, setMiniBio] = useState('');
    const [photoKey, setPhotoKey] = useState(Date.now());

    const [showPassagers, setShowPassagers] = useState(false);
    const [passagersTrajet, setPassagersTrajet] = useState([]);
    const [loadingPassagers, setLoadingPassagers] = useState(false);
    const [trajetSelectionne, setTrajetSelectionne] = useState(null);

    useFocusEffect(
        React.useCallback(() => {
            chargerProfil();
        }, [])
    );

    const chargerProfil = async () => {
        try {
            const userId = await getUserId();
            if (!userId) return;

            const [userRes, vehiculesRes, trajetsRes] = await Promise.all([
                api.get(`/utilisateurs/${userId}`),
                api.get(`/vehicules/conducteur/${userId}`),
                api.get(`/trajets/conducteur/${userId}`)
            ]);

            setUtilisateur(userRes.data);
            setEmail(userRes.data.email || '');
            setTelephone(userRes.data.telephone || '');
            setMiniBio(userRes.data.miniBio || '');
            setVehicules(vehiculesRes.data);
            setTrajets(trajetsRes.data.filter(t =>
                t.statut === 'OUVERT' || t.statut === 'COMPLET'
            ));
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de charger le profil');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await chargerProfil();
        setRefreshing(false);
    };

    const voirPassagers = async (trajet) => {
        setTrajetSelectionne(trajet);
        setShowPassagers(true);
        setLoadingPassagers(true);
        try {
            const res = await api.get(`/reservations/trajet/${trajet.id}/passagers`);
            setPassagersTrajet(res.data);
        } catch (err) {
            Alert.alert('Erreur', 'Impossible de charger les passagers');
        } finally {
            setLoadingPassagers(false);
        }
    };

    const demarrerTrajet = async (trajet) => {
        const maintenant = new Date();
        const depart = new Date(trajet.dateHeureDepart);
        const diffMinutes = (depart - maintenant) / 1000 / 60;

        if (diffMinutes > 30) {
            Alert.alert(
                'Trop tot',
                `Vous pourrez demarrer le trajet 30 minutes avant le depart.\n\nDepart prevu : ${depart.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
            );
            return;
        }

        if (diffMinutes < -60) {
            Alert.alert('Trajet expire', 'Ce trajet est termine.');
            return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission refusee', 'Veuillez autoriser la localisation pour demarrer le trajet.');
            return;
        }

        Alert.alert(
            'Demarrer le trajet',
            `Confirmer le depart de ${trajet.villeDepart} -> ${trajet.villeArrivee} ?\n\nVos passagers seront notifies avec votre position.`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Demarrer',
                    onPress: async () => {
                        try {
                            const location = await Location.getCurrentPositionAsync({
                                accuracy: Location.Accuracy.High
                            });

                            const { latitude, longitude } = location.coords;

                            await api.patch(`/trajets/${trajet.id}/demarrer?latitude=${latitude}&longitude=${longitude}`);

                            Alert.alert('Trajet demarre !', 'Vos passagers ont ete notifies avec votre position actuelle.');
                            chargerProfil();

                        } catch (err) {
                            Alert.alert('Erreur', err.response?.data?.erreur || 'Impossible de demarrer le trajet');
                        }
                    }
                }
            ]
        );
    };

    const sauvegarderProfil = async () => {
        try {
            const userId = await getUserId();
            await api.put(`/utilisateurs/${userId}`, {
                nom: utilisateur.nom,
                prenom: utilisateur.prenom,
                email,
                telephone,
                miniBio
            });
            setEditMode(false);
            chargerProfil();
            Alert.alert('Profil mis a jour !');
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de mettre a jour le profil');
        }
    };

    const uploadPhoto = async (uri) => {
        try {
            const userId = await getUserId();
            const formData = new FormData();
            formData.append('fichier', { uri, type: 'image/jpeg', name: `photo_${userId}.jpg` });
            await api.post(`/utilisateurs/${userId}/photo`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPhotoKey(Date.now());
            chargerProfil();
            Alert.alert('Photo mise a jour !');
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de mettre a jour la photo');
        }
    };

    const changerPhoto = async () => {
        Alert.alert('Photo de profil', 'Choisir une source', [
            {
                text: 'Galerie',
                onPress: async () => {
                    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (!permission.granted) { Alert.alert('Permission refusee'); return; }
                    const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
                    });
                    if (!result.canceled) await uploadPhoto(result.assets[0].uri);
                }
            },
            {
                text: 'Camera',
                onPress: async () => {
                    const permission = await ImagePicker.requestCameraPermissionsAsync();
                    if (!permission.granted) { Alert.alert('Permission refusee'); return; }
                    const result = await ImagePicker.launchCameraAsync({
                        allowsEditing: true, aspect: [1, 1], quality: 0.8,
                    });
                    if (!result.canceled) await uploadPhoto(result.assets[0].uri);
                }
            },
            { text: 'Annuler', style: 'cancel' }
        ]);
    };

    const terminerTrajet = async (trajet) => {
        Alert.alert('Terminer', 'Confirmer la fin du trajet ?', [
            { text: 'Non', style: 'cancel' },
            {
                text: 'Oui',
                onPress: async () => {
                    try {
                        await api.patch(`/trajets/${trajet.id}/statut?statut=TERMINE`);
                        chargerProfil();
                        Alert.alert('Trajet termine !', 'Voulez-vous laisser un avis pour vos passagers ?', [
                            { text: 'Plus tard', style: 'cancel' },
                            {
                                text: 'Laisser un avis',
                                onPress: () => navigation.navigate('Avis', {
                                    conducteurId: trajet.conducteurId,
                                    conducteurNom: trajet.conducteurNom,
                                    conducteurPrenom: trajet.conducteurPrenom,
                                    trajetId: trajet.id
                                })
                            }
                        ]);
                    } catch (error) {
                        Alert.alert('Erreur', 'Impossible de terminer le trajet');
                    }
                }
            }
        ]);
    };

    const annulerTrajet = async (id) => {
        Alert.alert('Annuler', 'Etes-vous sur ?', [
            { text: 'Non', style: 'cancel' },
            {
                text: 'Oui', style: 'destructive',
                onPress: async () => {
                    try {
                        await api.patch(`/trajets/${id}/statut?statut=ANNULE`);
                        chargerProfil();
                    } catch (error) {
                        Alert.alert('Erreur');
                    }
                }
            }
        ]);
    };

    const supprimerVehicule = async (id) => {
        Alert.alert('Supprimer', 'Supprimer ce vehicule ?', [
            { text: 'Non', style: 'cancel' },
            {
                text: 'Oui', style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/vehicules/${id}`);
                        chargerProfil();
                    } catch (error) {
                        Alert.alert('Erreur');
                    }
                }
            }
        ]);
    };

    const handleLogout = async () => {
        Alert.alert('Deconnexion', 'Etes-vous sur ?', [
            { text: 'Non', style: 'cancel' },
            {
                text: 'Oui',
                onPress: async () => {
                    await logout();
                    navigation.replace('Login');
                }
            }
        ]);
    };

    const getInitiales = () => {
        if (!utilisateur) return '?';
        return `${utilisateur.prenom?.charAt(0)}${utilisateur.nom?.charAt(0)}`.toUpperCase();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size={36} color="#00b5e2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00b5e2" colors={["#00b5e2"]} />
                }>

                <View style={styles.header}>
                    <TouchableOpacity onPress={changerPhoto} style={styles.avatarContainer}>
                        {utilisateur?.photo ? (
                            <Image source={{ uri: `${utilisateur.photo}?t=${photoKey}` }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{getInitiales()}</Text>
                            </View>
                        )}
                        <View style={styles.avatarEdit}>
                            <Ionicons name="camera-outline" size={14} color="white" />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <View style={styles.nomRow}>
                            <Text style={styles.nom}>{utilisateur?.prenom} {utilisateur?.nom}</Text>
                            {utilisateur?.verifie && (
                                <Ionicons name="checkmark-circle" size={20} color="#2ecc71" />
                            )}
                        </View>
                        <Text style={styles.email}>{utilisateur?.email}</Text>
                        {utilisateur?.miniBio ? (
                            <Text style={styles.miniBio}>{utilisateur.miniBio}</Text>
                        ) : null}
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Informations personnelles</Text>
                        <TouchableOpacity onPress={() => editMode ? sauvegarderProfil() : setEditMode(true)}>
                            <Text style={styles.editButton}>{editMode ? 'Sauvegarder' : 'Modifier'}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.card}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Nom</Text>
                            <Text style={styles.infoValue}>{utilisateur?.nom}</Text>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Prenom</Text>
                            <Text style={styles.infoValue}>{utilisateur?.prenom}</Text>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Email</Text>
                            {editMode ? (
                                <TextInput style={styles.editInput} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#666" />
                            ) : (
                                <Text style={styles.infoValue}>{utilisateur?.email}</Text>
                            )}
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Telephone</Text>
                            {editMode ? (
                                <TextInput style={styles.editInput} value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" placeholderTextColor="#666" />
                            ) : (
                                <Text style={styles.infoValue}>{utilisateur?.telephone || 'Non renseigne'}</Text>
                            )}
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Mini bio</Text>
                            {editMode ? (
                                <TextInput style={styles.editInput} value={miniBio} onChangeText={setMiniBio} placeholder="Parlez de vous..." placeholderTextColor="#666" />
                            ) : (
                                <Text style={styles.infoValue}>{utilisateur?.miniBio || 'Non renseignee'}</Text>
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <TouchableOpacity style={styles.boutonDocuments} onPress={() => navigation.navigate('Documents')}>
                        <Ionicons name="document-text-outline" size={20} color="#00b5e2" />
                        <Text style={styles.boutonDocumentsText}>Mes documents</Text>
                        <Ionicons name="chevron-forward" size={16} color="#666" />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mes trajets publies</Text>
                    <View style={styles.card}>
                        {trajets.length === 0 && (
                            <Text style={styles.emptyText}>Aucun trajet ouvert</Text>
                        )}
                        {trajets.map((t, index) => {
                            const diffMinutes = (new Date(t.dateHeureDepart) - new Date()) / 1000 / 60;
                            const peutDemarrer = !t.trajetDemarre && diffMinutes <= 30 && diffMinutes > -60;

                            return (
                                <View key={t.id.toString()}>
                                    {index > 0 && <View style={styles.separator} />}
                                    <View style={styles.trajetItem}>
                                        <View style={styles.trajetItemInfo}>
                                            <Text style={styles.trajetVilles}>
                                                {t.villeDepart} → {t.villeArrivee}
                                            </Text>
                                            <Text style={styles.trajetDetails}>
                                                {t.placesDisponibles} place(s) • {t.prix?.toLocaleString()} GNF
                                            </Text>
                                        </View>
                                        <View style={styles.trajetBoutons}>
                                            <TouchableOpacity
                                                style={styles.boutonPassagers}
                                                onPress={() => voirPassagers(t)}>
                                                <Ionicons name="people-outline" size={14} color="#00b5e2" />
                                            </TouchableOpacity>

                                            {t.trajetDemarre ? (
                                                <View style={styles.trajetEnCours}>
                                                    <Ionicons name="navigate" size={14} color="#2ecc71" />
                                                    <Text style={styles.trajetEnCoursText}>En cours</Text>
                                                </View>
                                            ) : peutDemarrer ? (
                                                <TouchableOpacity
                                                    style={styles.boutonDemarrer}
                                                    onPress={() => demarrerTrajet(t)}>
                                                    <Ionicons name="navigate-outline" size={14} color="white" />
                                                    <Text style={styles.boutonDemarrerText}>Demarrer</Text>
                                                </TouchableOpacity>
                                            ) : null}

                                            <TouchableOpacity
                                                style={styles.boutonTerminer}
                                                onPress={() => terminerTrajet(t)}>
                                                <Text style={styles.boutonTerminerText}>Terminer</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.boutonAnnuler}
                                                onPress={() => annulerTrajet(t.id)}>
                                                <Text style={styles.boutonAnnulerText}>Annuler</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mes vehicules</Text>
                    <View style={styles.card}>
                        {vehicules.length === 0 && (
                            <Text style={styles.emptyText}>Aucun vehicule enregistre</Text>
                        )}
                        {vehicules.map((v, index) => (
                            <View key={v.id.toString()}>
                                {index > 0 && <View style={styles.separator} />}
                                <View style={styles.vehiculeItem}>
                                    <View>
                                        <Text style={styles.vehiculeNom}>{v.marque} {v.modele}</Text>
                                        <Text style={styles.vehiculeDetails}>{v.immatriculation} • {v.nbPlaces} places</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => supprimerVehicule(v.id)}>
                                        <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <TouchableOpacity style={styles.boutonAide} onPress={() => navigation.navigate('Aide')}>
                        <Ionicons name="help-circle-outline" size={20} color="#00b5e2" />
                        <Text style={styles.boutonAideText}>Aide & Support</Text>
                        <Ionicons name="chevron-forward" size={16} color="#666" />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <TouchableOpacity style={styles.boutonLogout} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
                        <Text style={styles.boutonLogoutText}>Deconnexion</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>

            <Modal
                visible={showPassagers}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowPassagers(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Passagers confirmes</Text>
                                {trajetSelectionne && (
                                    <Text style={styles.modalSubtitle}>
                                        {trajetSelectionne.villeDepart} → {trajetSelectionne.villeArrivee}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setShowPassagers(false)}>
                                <Ionicons name="close" size={24} color="#eee" />
                            </TouchableOpacity>
                        </View>

                        {loadingPassagers ? (
                            <ActivityIndicator color="#00b5e2" style={{ marginTop: 20 }} />
                        ) : passagersTrajet.length === 0 ? (
                            <View style={styles.modalVide}>
                                <Ionicons name="people-outline" size={48} color="#444" />
                                <Text style={styles.modalVideText}>Aucun passager confirme</Text>
                            </View>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {passagersTrajet.map((p) => {
                                    const initiales = `${(p.passagerPrenom || '?')[0]}${(p.passagerNom || '?')[0]}`.toUpperCase();
                                    return (
                                        <View key={p.id.toString()} style={styles.passagerCard}>
                                            {p.passagerPhoto ? (
                                                <Image source={{ uri: p.passagerPhoto }} style={styles.passagerAvatar} />
                                            ) : (
                                                <View style={styles.passagerAvatarPlaceholder}>
                                                    <Text style={styles.passagerInitiales}>{initiales}</Text>
                                                </View>
                                            )}
                                            <View style={styles.passagerInfos}>
                                                <Text style={styles.passagerNom}>
                                                    {p.passagerPrenom} {p.passagerNom}
                                                </Text>
                                                {p.passagerTelephone && (
                                                    <Text style={styles.passagerTel}>{p.passagerTelephone}</Text>
                                                )}
                                            </View>
                                            <TouchableOpacity
                                                style={styles.passagerBtnChat}
                                                onPress={() => {
                                                    setShowPassagers(false);
                                                    navigation.navigate('Chat', {
                                                        reservationId: p.id,
                                                        interlocuteur: {
                                                            id: p.passagerId,
                                                            nom: p.passagerNom,
                                                            prenom: p.passagerPrenom,
                                                        },
                                                        userId: null,
                                                    });
                                                }}>
                                                <Ionicons name="chatbubble-outline" size={18} color="#00b5e2" />
                                            </TouchableOpacity>
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
    container: { flex: 1, backgroundColor: '#121212' },
    loadingContainer: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' },
    header: {
        backgroundColor: '#1a1a1a', paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', gap: 16, borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
    },
    avatarContainer: { position: 'relative' },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#00b5e2', alignItems: 'center', justifyContent: 'center' },
    avatarImage: { width: 64, height: 64, borderRadius: 32 },
    avatarEdit: {
        position: 'absolute', bottom: 0, right: 0, backgroundColor: '#00b5e2',
        borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
    headerInfo: { flex: 1 },
    nomRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    nom: { fontSize: 20, fontWeight: 'bold', color: '#eee' },
    email: { fontSize: 13, color: '#888', marginTop: 2 },
    miniBio: { fontSize: 13, color: '#aaa', fontStyle: 'italic', marginTop: 4 },
    section: { paddingHorizontal: 16, marginTop: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    editButton: { fontSize: 14, color: '#00b5e2', fontWeight: '600' },
    card: { backgroundColor: '#1e1e1e', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2a2a2a' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    infoLabel: { fontSize: 14, color: '#888', flex: 1 },
    infoValue: { fontSize: 14, color: '#ddd', flex: 2, textAlign: 'right' },
    editInput: { flex: 2, fontSize: 14, color: '#eee', textAlign: 'right', borderBottomWidth: 1, borderBottomColor: '#00b5e2', paddingVertical: 2 },
    separator: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 4 },
    emptyText: { fontSize: 14, color: '#666', textAlign: 'center', paddingVertical: 8 },
    boutonDocuments: {
        backgroundColor: '#1e1e1e', borderRadius: 14, padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#2a2a2a',
    },
    boutonDocumentsText: { color: '#eee', fontSize: 15, fontWeight: '600', flex: 1 },
    trajetItem: { paddingVertical: 8, gap: 8 },
    trajetItemInfo: { gap: 4 },
    trajetVilles: { fontSize: 14, fontWeight: '600', color: '#ddd' },
    trajetDetails: { fontSize: 12, color: '#666' },
    trajetBoutons: { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
    boutonPassagers: {
        borderWidth: 1, borderColor: '#00b5e2', borderRadius: 8,
        paddingVertical: 6, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center',
    },
    boutonDemarrer: {
        backgroundColor: '#2ecc71', borderRadius: 8,
        paddingVertical: 6, paddingHorizontal: 10,
        flexDirection: 'row', alignItems: 'center', gap: 4,
    },
    boutonDemarrerText: { color: 'white', fontSize: 12, fontWeight: '600' },
    trajetEnCours: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: '#1a3a2a', borderRadius: 8,
        paddingVertical: 6, paddingHorizontal: 10,
    },
    trajetEnCoursText: { color: '#2ecc71', fontSize: 12, fontWeight: '600' },
    boutonTerminer: { backgroundColor: '#00b5e2', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
    boutonTerminerText: { color: 'white', fontSize: 12, fontWeight: '600' },
    boutonAnnuler: { borderWidth: 1, borderColor: '#e74c3c', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
    boutonAnnulerText: { color: '#e74c3c', fontSize: 12, fontWeight: '600' },
    vehiculeItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    vehiculeNom: { fontSize: 14, fontWeight: '600', color: '#ddd' },
    vehiculeDetails: { fontSize: 12, color: '#666', marginTop: 2 },
    boutonLogout: {
        backgroundColor: '#1e1e1e', borderRadius: 14, padding: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#2a2a2a',
    },
    boutonLogoutText: { color: '#e74c3c', fontSize: 16, fontWeight: '600' },
    boutonAide: {
        backgroundColor: '#1e1e1e', borderRadius: 14, padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#2a2a2a',
    },
    boutonAideText: { color: '#eee', fontSize: 15, fontWeight: '600', flex: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalCard: {
        backgroundColor: '#1e1e1e', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 24, maxHeight: '75%', borderTopWidth: 1, borderColor: '#2a2a2a',
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#eee' },
    modalSubtitle: { fontSize: 13, color: '#888', marginTop: 4 },
    modalVide: { alignItems: 'center', paddingVertical: 40, gap: 12 },
    modalVideText: { color: '#666', fontSize: 15 },
    passagerCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#252525', borderRadius: 12, padding: 12, marginBottom: 8,
    },
    passagerAvatar: { width: 44, height: 44, borderRadius: 22 },
    passagerAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00b5e233', alignItems: 'center', justifyContent: 'center' },
    passagerInitiales: { color: '#00b5e2', fontSize: 16, fontWeight: '700' },
    passagerInfos: { flex: 1 },
    passagerNom: { color: '#eee', fontSize: 15, fontWeight: '600' },
    passagerTel: { color: '#00b5e2', fontSize: 13, marginTop: 3 },
    passagerBtnChat: { padding: 8, backgroundColor: '#00b5e21A', borderRadius: 20 },
});