import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator,
    TextInput, RefreshControl, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
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
            Alert.alert('Profil mis à jour !');
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
        }
    };

    const uploadPhoto = async (uri) => {
        try {
            const userId = await getUserId();
            const formData = new FormData();
            formData.append('fichier', {
                uri,
                type: 'image/jpeg',
                name: `photo_${userId}.jpg`
            });

            await api.post(`/utilisateurs/${userId}/photo`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setPhotoKey(Date.now());
            chargerProfil();
            Alert.alert('Photo mise à jour !');
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de mettre à jour la photo');
        }
    };

    const changerPhoto = async () => {
        Alert.alert(
            'Photo de profil',
            'Choisir une source',
            [
                {
                    text: 'Galerie',
                    onPress: async () => {
                        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (!permission.granted) {
                            Alert.alert('Permission refusée');
                            return;
                        }
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ['images'],
                            allowsEditing: true,
                            aspect: [1, 1],
                            quality: 0.8,
                        });
                        if (!result.canceled) await uploadPhoto(result.assets[0].uri);
                    }
                },
                {
                    text: 'Caméra',
                    onPress: async () => {
                        const permission = await ImagePicker.requestCameraPermissionsAsync();
                        if (!permission.granted) {
                            Alert.alert('Permission refusée');
                            return;
                        }
                        const result = await ImagePicker.launchCameraAsync({
                            allowsEditing: true,
                            aspect: [1, 1],
                            quality: 0.8,
                        });
                        if (!result.canceled) await uploadPhoto(result.assets[0].uri);
                    }
                },
                { text: 'Annuler', style: 'cancel' }
            ]
        );
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
                        Alert.alert(
                            'Trajet terminé !',
                            'Voulez-vous laisser un avis pour vos passagers ?',
                            [
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
                            ]
                        );
                    } catch (error) {
                        Alert.alert('Erreur', 'Impossible de terminer le trajet');
                    }
                }
            }
        ]);
    };

    const annulerTrajet = async (id) => {
        Alert.alert('Annuler', 'Êtes-vous sûr ?', [
            { text: 'Non', style: 'cancel' },
            {
                text: 'Oui',
                style: 'destructive',
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
        Alert.alert('Supprimer', 'Supprimer ce véhicule ?', [
            { text: 'Non', style: 'cancel' },
            {
                text: 'Oui',
                style: 'destructive',
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
        Alert.alert('Déconnexion', 'Êtes-vous sûr ?', [
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
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#00b5e2"
                        colors={["#00b5e2"]}
                    />
                }>

                <View style={styles.header}>
                    <TouchableOpacity onPress={changerPhoto} style={styles.avatarContainer}>
                        {utilisateur?.photo ? (
                            <Image
                                source={{ uri: `${utilisateur.photo}?t=${photoKey}` }}
                                style={styles.avatarImage}
                            />
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
                            <Text style={styles.editButton}>
                                {editMode ? 'Sauvegarder' : 'Modifier'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Nom</Text>
                            <Text style={styles.infoValue}>{utilisateur?.nom}</Text>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Prénom</Text>
                            <Text style={styles.infoValue}>{utilisateur?.prenom}</Text>
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Email</Text>
                            {editMode ? (
                                <TextInput
                                    style={styles.editInput}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholderTextColor="#666"
                                />
                            ) : (
                                <Text style={styles.infoValue}>{utilisateur?.email}</Text>
                            )}
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Téléphone</Text>
                            {editMode ? (
                                <TextInput
                                    style={styles.editInput}
                                    value={telephone}
                                    onChangeText={setTelephone}
                                    keyboardType="phone-pad"
                                    placeholderTextColor="#666"
                                />
                            ) : (
                                <Text style={styles.infoValue}>
                                    {utilisateur?.telephone || 'Non renseigné'}
                                </Text>
                            )}
                        </View>
                        <View style={styles.separator} />
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Mini bio</Text>
                            {editMode ? (
                                <TextInput
                                    style={styles.editInput}
                                    value={miniBio}
                                    onChangeText={setMiniBio}
                                    placeholder="Parlez de vous..."
                                    placeholderTextColor="#666"
                                />
                            ) : (
                                <Text style={styles.infoValue}>
                                    {utilisateur?.miniBio || 'Non renseignée'}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.boutonDocuments}
                        onPress={() => navigation.navigate('Documents')}>
                        <Ionicons name="document-text-outline" size={20} color="#00b5e2" />
                        <Text style={styles.boutonDocumentsText}>Mes documents</Text>
                        <Ionicons name="chevron-forward" size={16} color="#666" />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mes trajets publiés</Text>
                    <View style={styles.card}>
                        {trajets.length === 0 && (
                            <Text style={styles.emptyText}>Aucun trajet ouvert</Text>
                        )}
                        {trajets.map((t, index) => (
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
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mes véhicules</Text>
                    <View style={styles.card}>
                        {vehicules.length === 0 && (
                            <Text style={styles.emptyText}>Aucun véhicule enregistré</Text>
                        )}
                        {vehicules.map((v, index) => (
                            <View key={v.id.toString()}>
                                {index > 0 && <View style={styles.separator} />}
                                <View style={styles.vehiculeItem}>
                                    <View>
                                        <Text style={styles.vehiculeNom}>{v.marque} {v.modele}</Text>
                                        <Text style={styles.vehiculeDetails}>
                                            {v.immatriculation} • {v.nbPlaces} places
                                        </Text>
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
                    <TouchableOpacity
                        style={styles.boutonAide}
                        onPress={() => navigation.navigate('Aide')}>
                        <Ionicons name="help-circle-outline" size={20} color="#00b5e2" />
                        <Text style={styles.boutonAideText}>Aide & Support</Text>
                        <Ionicons name="chevron-forward" size={16} color="#666" />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <TouchableOpacity style={styles.boutonLogout} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
                        <Text style={styles.boutonLogoutText}>Déconnexion</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    loadingContainer: {
        flex: 1, backgroundColor: '#121212',
        justifyContent: 'center', alignItems: 'center',
    },
    header: {
        backgroundColor: '#1a1a1a',
        paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', gap: 16,
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
    },
    avatarContainer: { position: 'relative' },
    avatar: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: '#00b5e2', alignItems: 'center', justifyContent: 'center',
    },
    avatarImage: { width: 64, height: 64, borderRadius: 32 },
    avatarEdit: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: '#00b5e2', borderRadius: 10,
        width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
    headerInfo: { flex: 1 },
    nomRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    nom: { fontSize: 20, fontWeight: 'bold', color: '#eee' },
    email: { fontSize: 13, color: '#888', marginTop: 2 },
    miniBio: { fontSize: 13, color: '#aaa', fontStyle: 'italic', marginTop: 4 },
    section: { paddingHorizontal: 16, marginTop: 20 },
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16, fontWeight: '600', color: '#888',
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
    },
    editButton: { fontSize: 14, color: '#00b5e2', fontWeight: '600' },
    card: {
        backgroundColor: '#1e1e1e', borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: '#2a2a2a',
    },
    infoRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 8,
    },
    infoLabel: { fontSize: 14, color: '#888', flex: 1 },
    infoValue: { fontSize: 14, color: '#ddd', flex: 2, textAlign: 'right' },
    editInput: {
        flex: 2, fontSize: 14, color: '#eee', textAlign: 'right',
        borderBottomWidth: 1, borderBottomColor: '#00b5e2', paddingVertical: 2,
    },
    separator: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 4 },
    emptyText: { fontSize: 14, color: '#666', textAlign: 'center', paddingVertical: 8 },
    boutonDocuments: {
        backgroundColor: '#1e1e1e', borderRadius: 14, padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderWidth: 1, borderColor: '#2a2a2a',
    },
    boutonDocumentsText: { color: '#eee', fontSize: 15, fontWeight: '600', flex: 1 },
    trajetItem: { paddingVertical: 8, gap: 8 },
    trajetItemInfo: { gap: 4 },
    trajetVilles: { fontSize: 14, fontWeight: '600', color: '#ddd' },
    trajetDetails: { fontSize: 12, color: '#666' },
    trajetBoutons: { flexDirection: 'row', gap: 8 },
    boutonTerminer: {
        backgroundColor: '#00b5e2', borderRadius: 8,
        paddingVertical: 6, paddingHorizontal: 14,
    },
    boutonTerminerText: { color: 'white', fontSize: 12, fontWeight: '600' },
    boutonAnnuler: {
        borderWidth: 1, borderColor: '#e74c3c', borderRadius: 8,
        paddingVertical: 6, paddingHorizontal: 14,
    },
    boutonAnnulerText: { color: '#e74c3c', fontSize: 12, fontWeight: '600' },
    vehiculeItem: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 8,
    },
    vehiculeNom: { fontSize: 14, fontWeight: '600', color: '#ddd' },
    vehiculeDetails: { fontSize: 12, color: '#666', marginTop: 2 },
    boutonLogout: {
        backgroundColor: '#1e1e1e', borderRadius: 14, padding: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, borderWidth: 1, borderColor: '#2a2a2a',
    },
    boutonLogoutText: { color: '#e74c3c', fontSize: 16, fontWeight: '600' },
    boutonAide: {
        backgroundColor: '#1e1e1e', borderRadius: 14, padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderWidth: 1, borderColor: '#2a2a2a',
    },
    boutonAideText: { color: '#eee', fontSize: 15, fontWeight: '600', flex: 1 },
});