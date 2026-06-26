import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator,
    TextInput, RefreshControl, Image, Modal
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
    const [trajetsTermines, setTrajetsTermines] = useState([]);
    const [avis, setAvis] = useState([]);
    const [stats, setStats] = useState(null);
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
    const [showHistorique, setShowHistorique] = useState(false);
    const [showAvis, setShowAvis] = useState(false);
<<<<<<< HEAD
=======
    
    // Correction : Ajout du state manquant pour la gestion des onglets

>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
    const [ongletActif, setOngletActif] = useState('profil');

    useFocusEffect(
        React.useCallback(() => {
            chargerProfil();
        }, [])
    );

    const chargerProfil = async () => {
        try {
            const userId = await getUserId();
            if (!userId) return;
            const [userRes, vehiculesRes, trajetsRes, statsRes, avisRes] = await Promise.all([
                api.get(`/utilisateurs/${userId}`),
                api.get(`/vehicules/conducteur/${userId}`),
                api.get(`/trajets/conducteur/${userId}`),
                api.get(`/trajets/conducteur/${userId}/stats`),
                api.get(`/avis/utilisateur/${userId}`)
            ]);
            setUtilisateur(userRes.data);
            setEmail(userRes.data.email || '');
            setTelephone(userRes.data.telephone || '');
            setMiniBio(userRes.data.miniBio || '');
            setVehicules(vehiculesRes.data);
            setStats(statsRes.data);
            setAvis(avisRes.data);
            setTrajets(trajetsRes.data.filter(t => t.statut === 'OUVERT' || t.statut === 'COMPLET'));
            setTrajetsTermines(trajetsRes.data.filter(t => t.statut === 'TERMINE'));
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
        } catch {
            Alert.alert('Erreur', 'Impossible de charger les passagers');
        } finally {
            setLoadingPassagers(false);
        }
    };

    const demarrerTrajet = async (trajet) => {
        const diffMinutes = (new Date(trajet.dateHeureDepart) - new Date()) / 1000 / 60;
<<<<<<< HEAD
        if (diffMinutes > 30) {
            Alert.alert('Trop tot', 'Vous pourrez demarrer 30 min avant le depart.');
            return;
        }
        if (diffMinutes < -60) {
            Alert.alert('Expire', 'Ce trajet est termine.');
            return;
        }
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission refusee');
            return;
        }
=======
        if (diffMinutes > 30) { Alert.alert('Trop tot', 'Vous pourrez demarrer 30 min avant le depart.'); return; }
        if (diffMinutes < -60) { Alert.alert('Expire', 'Ce trajet est termine.'); return; }
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission refusee'); return; }
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
        Alert.alert('Demarrer', `${trajet.villeDepart} → ${trajet.villeArrivee} ?`, [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Demarrer',
                onPress: async () => {
                    try {
                        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                        await api.patch(`/trajets/${trajet.id}/demarrer?latitude=${loc.coords.latitude}&longitude=${loc.coords.longitude}`);
                        Alert.alert('Demarre !', 'Vos passagers ont ete notifies.');
                        chargerProfil();
                    } catch (err) {
                        Alert.alert('Erreur', err.response?.data?.erreur || 'Impossible de demarrer');
                    }
                }
            }
        ]);
    };

    const sauvegarderProfil = async () => {
        try {
            const userId = await getUserId();
<<<<<<< HEAD
            await api.put(`/utilisateurs/${userId}`, {
                nom: utilisateur.nom,
                prenom: utilisateur.prenom,
                email,
                telephone,
                miniBio
            });
=======
            await api.put(`/utilisateurs/${userId}`, { nom: utilisateur.nom, prenom: utilisateur.prenom, email, telephone, miniBio });
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
            setEditMode(false);
            chargerProfil();
            Alert.alert('Profil mis a jour !');
        } catch {
            Alert.alert('Erreur', 'Impossible de mettre a jour le profil');
        }
    };

    const uploadPhoto = async (uri) => {
        try {
            const userId = await getUserId();
            const formData = new FormData();
            formData.append('fichier', { uri, type: 'image/jpeg', name: `photo_${userId}.jpg` });
<<<<<<< HEAD
            await api.post(`/utilisateurs/${userId}/photo`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
=======
            await api.post(`/utilisateurs/${userId}/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
            setPhotoKey(Date.now());
            chargerProfil();
        } catch {
            Alert.alert('Erreur', 'Impossible de mettre a jour la photo');
        }
    };

    const changerPhoto = async () => {
        Alert.alert('Photo de profil', 'Choisir une source', [
            {
                text: 'Galerie',
                onPress: async () => {
                    const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (!p.granted) return;
<<<<<<< HEAD
                    const r = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8
                    });
=======
                    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                    if (!r.canceled) await uploadPhoto(r.assets[0].uri);
                }
            },
            {
                text: 'Camera',
                onPress: async () => {
                    const p = await ImagePicker.requestCameraPermissionsAsync();
                    if (!p.granted) return;
<<<<<<< HEAD
                    const r = await ImagePicker.launchCameraAsync({
                        allowsEditing: true, aspect: [1, 1], quality: 0.8
                    });
=======
                    const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                    if (!r.canceled) await uploadPhoto(r.assets[0].uri);
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
<<<<<<< HEAD
                        Alert.alert('Trajet termine !', 'Les passagers ont ete notifies.');
                        chargerProfil();
                    } catch (err) {
                        Alert.alert('Erreur', err.response?.data?.erreur || 'Impossible de terminer');
=======
                        chargerProfil();
                    } catch {
                        Alert.alert('Erreur');
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
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
<<<<<<< HEAD
                    try {
                        await api.patch(`/trajets/${id}/statut?statut=ANNULE`);
                        chargerProfil();
                    } catch {
                        Alert.alert('Erreur');
                    }
=======
                    try { await api.patch(`/trajets/${id}/statut?statut=ANNULE`); chargerProfil(); }
                    catch { Alert.alert('Erreur'); }
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
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
<<<<<<< HEAD
                    try {
                        await api.delete(`/vehicules/${id}`);
                        chargerProfil();
                    } catch {
                        Alert.alert('Erreur');
                    }
=======
                    try { await api.delete(`/vehicules/${id}`); chargerProfil(); }
                    catch { Alert.alert('Erreur'); }
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                }
            }
        ]);
    };

    const handleLogout = async () => {
        Alert.alert('Deconnexion', 'Etes-vous sur ?', [
            { text: 'Non', style: 'cancel' },
            {
                text: 'Oui',
<<<<<<< HEAD
                onPress: async () => {
                    await logout();
                    navigation.replace('Login');
                }
=======
                onPress: async () => { await logout(); navigation.replace('Login'); }
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
            }
        ]);
    };

    const getInitiales = () => {
        if (!utilisateur) return '?';
        return `${utilisateur.prenom?.charAt(0)}${utilisateur.nom?.charAt(0)}`.toUpperCase();
    };

<<<<<<< HEAD
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
=======
    const renderEtoiles = (note) => [1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={i <= note ? 'star' : 'star-outline'} size={13} color="#888" />
    ));

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
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

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={changerPhoto} style={styles.avatarContainer}>
                    {utilisateur?.photo ? (
<<<<<<< HEAD
                        <Image
                            source={{ uri: `${utilisateur.photo}?t=${photoKey}` }}
                            style={styles.avatarImage}
                        />
=======
                        <Image source={{ uri: `${utilisateur.photo}?t=${photoKey}` }} style={styles.avatarImage} />
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                    ) : (
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{getInitiales()}</Text>
                        </View>
                    )}
                    <View style={styles.avatarEdit}>
                        <Ionicons name="camera-outline" size={12} color="white" />
                    </View>
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <View style={styles.nomRow}>
                        <Text style={styles.nom}>{utilisateur?.prenom} {utilisateur?.nom}</Text>
                        {utilisateur?.verifie && (
                            <Ionicons name="checkmark-circle" size={18} color="#00b5e2" />
                        )}
                    </View>
                    <Text style={styles.email}>{utilisateur?.email}</Text>
                    {utilisateur?.miniBio && (
                        <Text style={styles.miniBio}>{utilisateur.miniBio}</Text>
                    )}
                </View>
            </View>

            {/* Onglets */}
            <View style={styles.onglets}>
<<<<<<< HEAD
                {['profil', 'compte'].map((onglet) => (
=======
               {['profil', 'compte'].map((onglet) => (
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                    <TouchableOpacity
                        key={onglet}
                        style={[styles.onglet, ongletActif === onglet && styles.ongletActif]}
                        onPress={() => setOngletActif(onglet)}>
                        <Text style={[styles.ongletText, ongletActif === onglet && styles.ongletTextActif]}>
                            {onglet === 'profil' ? 'Profil' : 'Compte'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
<<<<<<< HEAD
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#00b5e2"
                        colors={["#00b5e2"]}
                    />
                }>
=======
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00b5e2" colors={["#00b5e2"]} />}>
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a

                {/* ===== ONGLET PROFIL ===== */}
                {ongletActif === 'profil' && (
                    <>
                        {/* Dashboard */}
                        {stats && stats.nbTrajets > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Mon activite</Text>
                                <View style={styles.dashboardCard}>
                                    <View style={styles.dashboardRow}>
                                        <View style={styles.dashboardStat}>
                                            <Text style={styles.dashboardValeur}>{stats.nbTrajets}</Text>
                                            <Text style={styles.dashboardLabel}>Trajets</Text>
                                        </View>
                                        <View style={styles.dashboardDivider} />
                                        <View style={styles.dashboardStat}>
<<<<<<< HEAD
                                            <Text style={styles.dashboardValeur}>
                                                {stats.gainsTotaux?.toLocaleString()}
                                            </Text>
=======
                                            <Text style={styles.dashboardValeur}>{stats.gainsTotaux?.toLocaleString()}</Text>
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                                            <Text style={styles.dashboardLabel}>GNF gagnes</Text>
                                        </View>
                                    </View>
                                    <View style={styles.dashboardSeparator} />
                                    <View style={styles.dashboardRow}>
                                        <View style={styles.dashboardStat}>
                                            <Text style={styles.dashboardValeur}>{stats.nbPassagers}</Text>
                                            <Text style={styles.dashboardLabel}>Passagers</Text>
                                        </View>
                                        <View style={styles.dashboardDivider} />
                                        <View style={styles.dashboardStat}>
                                            <Text style={styles.dashboardValeur}>
                                                {stats.noteMoyenne > 0 ? `${stats.noteMoyenne}★` : '—'}
                                            </Text>
                                            <Text style={styles.dashboardLabel}>Note</Text>
                                        </View>
                                    </View>
                                    <View style={styles.dashboardSeparator} />
                                    <View style={styles.dashboardRow}>
                                        <View style={styles.dashboardStat}>
                                            <Text style={styles.dashboardValeur}>{stats.tauxAcceptation}%</Text>
                                            <Text style={styles.dashboardLabel}>Acceptation</Text>
                                        </View>
                                        <View style={styles.dashboardDivider} />
                                        <View style={styles.dashboardStat}>
                                            <Text style={[styles.dashboardValeur, { fontSize: 14 }]} numberOfLines={1}>
                                                {stats.trajetFrequent || '—'}
                                            </Text>
                                            <Text style={styles.dashboardLabel}>Trajet frequent</Text>
                                        </View>
                                    </View>
                                    <View style={styles.dashboardSeparator} />
                                    <View style={styles.dashboardMembreRow}>
                                        <Ionicons name="calendar-outline" size={13} color="#555" />
                                        <Text style={styles.dashboardMembreTexte}>
<<<<<<< HEAD
                                            {`Membre depuis le ${new Date(stats.membreDepuis).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`}
=======
                                            Membre depuis le {new Date(stats.membreDepuis).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Infos personnelles */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Informations</Text>
                                <TouchableOpacity onPress={() => editMode ? sauvegarderProfil() : setEditMode(true)}>
                                    <Text style={styles.editButton}>{editMode ? 'Sauvegarder' : 'Modifier'}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.card}>
                                {[
                                    { label: 'Nom', value: utilisateur?.nom, field: null },
                                    { label: 'Prenom', value: utilisateur?.prenom, field: null },
                                    { label: 'Email', value: utilisateur?.email, field: 'email', state: email, setState: setEmail, keyboard: 'email-address' },
                                    { label: 'Telephone', value: utilisateur?.telephone || 'Non renseigne', field: 'telephone', state: telephone, setState: setTelephone, keyboard: 'phone-pad' },
                                    { label: 'Bio', value: utilisateur?.miniBio || 'Non renseignee', field: 'bio', state: miniBio, setState: setMiniBio, keyboard: 'default' },
                                ].map((item, index) => (
                                    <View key={item.label}>
                                        {index > 0 && <View style={styles.separator} />}
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>{item.label}</Text>
                                            {editMode && item.field ? (
                                                <TextInput
                                                    style={styles.editInput}
                                                    value={item.state}
                                                    onChangeText={item.setState}
                                                    keyboardType={item.keyboard}
                                                    autoCapitalize="none"
                                                    placeholderTextColor="#555"
                                                />
                                            ) : (
                                                <Text style={styles.infoValue}>{item.value}</Text>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Trajets publiés */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mes trajets publies</Text>
                            <View style={styles.card}>
                                {trajets.length === 0 && (
                                    <Text style={styles.emptyText}>Aucun trajet publié</Text>
                                )}
                                {trajets.map((t, index) => {
                                    const diffMinutes = (new Date(t.dateHeureDepart) - new Date()) / 1000 / 60;
                                    const peutDemarrer = !t.trajetDemarre && diffMinutes <= 30 && diffMinutes > -60;
                                    return (
                                        <View key={t.id.toString()}>
                                            {index > 0 && <View style={styles.separator} />}
                                            <View style={styles.trajetItem}>
                                                <View style={styles.trajetItemInfo}>
<<<<<<< HEAD
                                                    <Text style={styles.trajetVilles}>
                                                        {`${t.villeDepart} → ${t.villeArrivee}`}
                                                    </Text>
                                                    <Text style={styles.trajetDetails}>
                                                        {`${t.placesDisponibles} place(s) · ${t.prixConducteur?.toLocaleString()} GNF`}
                                                    </Text>
                                                </View>
                                                <View style={styles.trajetBoutons}>
                                                    <TouchableOpacity
                                                        style={styles.btnIcone}
                                                        onPress={() => voirPassagers(t)}>
=======
                                                    <Text style={styles.trajetVilles}>{t.villeDepart} → {t.villeArrivee}</Text>
                                                    <Text style={styles.trajetDetails}>
                                                        {t.placesDisponibles} place(s) · {t.prixConducteur?.toLocaleString()} GNF
                                                    </Text>
                                                </View>
                                                <View style={styles.trajetBoutons}>
                                                    <TouchableOpacity style={styles.btnIcone} onPress={() => voirPassagers(t)}>
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                                                        <Ionicons name="people-outline" size={14} color="#888" />
                                                    </TouchableOpacity>
                                                    {t.trajetDemarre ? (
                                                        <View style={styles.btnEnCours}>
                                                            <Text style={styles.btnEnCoursText}>En cours</Text>
                                                        </View>
                                                    ) : peutDemarrer ? (
<<<<<<< HEAD
                                                        <TouchableOpacity
                                                            style={styles.btnDemarrer}
                                                            onPress={() => demarrerTrajet(t)}>
                                                            <Text style={styles.btnDemarrerText}>Demarrer</Text>
                                                        </TouchableOpacity>
                                                    ) : null}
                                                    <TouchableOpacity
                                                        style={styles.btnTerminer}
                                                        onPress={() => terminerTrajet(t)}>
                                                        <Text style={styles.btnTerminerText}>Terminer</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={styles.btnAnnuler}
                                                        onPress={() => annulerTrajet(t.id)}>
=======
                                                        <TouchableOpacity style={styles.btnDemarrer} onPress={() => demarrerTrajet(t)}>
                                                            <Text style={styles.btnDemarrerText}>Demarrer</Text>
                                                        </TouchableOpacity>
                                                    ) : null}
                                                    <TouchableOpacity style={styles.btnTerminer} onPress={() => terminerTrajet(t)}>
                                                        <Text style={styles.btnTerminerText}>Terminer</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity style={styles.btnAnnuler} onPress={() => annulerTrajet(t.id)}>
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                                                        <Text style={styles.btnAnnulerText}>Annuler</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Véhicules */}
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
<<<<<<< HEAD
                                                <Text style={styles.vehiculeNom}>{`${v.marque} ${v.modele}`}</Text>
                                                <Text style={styles.vehiculeDetails}>
                                                    {`${v.immatriculation} · ${v.nbPlaces} places`}
                                                </Text>
=======
                                                <Text style={styles.vehiculeNom}>{v.marque} {v.modele}</Text>
                                                <Text style={styles.vehiculeDetails}>{v.immatriculation} · {v.nbPlaces} places</Text>
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                                            </View>
                                            <TouchableOpacity onPress={() => supprimerVehicule(v.id)}>
                                                <Ionicons name="trash-outline" size={18} color="#555" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </>
                )}

                {/* ===== ONGLET COMPTE ===== */}
                {ongletActif === 'compte' && (
                    <>
<<<<<<< HEAD
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mon activite</Text>
                            <View style={styles.card}>
                                <TouchableOpacity
                                    style={styles.navItem}
                                    onPress={() => setShowHistorique(!showHistorique)}>
                                    <View style={styles.navGauche}>
                                        <Ionicons name="time-outline" size={18} color="#555" />
                                        <Text style={styles.navLabel}>
                                            {`Historique des trajets (${trajetsTermines.length})`}
                                        </Text>
                                    </View>
                                    <Ionicons
                                        name={showHistorique ? 'chevron-down' : 'chevron-forward'}
                                        size={16} color="#444"
                                    />
=======
                        {/* Mon activité */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mon activite</Text>
                            <View style={styles.card}>
                                <TouchableOpacity style={styles.navItem} onPress={() => setShowHistorique(!showHistorique)}>
                                    <View style={styles.navGauche}>
                                        <Ionicons name="time-outline" size={18} color="#555" />
                                        <Text style={styles.navLabel}>Historique des trajets ({trajetsTermines.length})</Text>
                                    </View>
                                    <Ionicons name={showHistorique ? 'chevron-down' : 'chevron-forward'} size={16} color="#444" />
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                                </TouchableOpacity>

                                {showHistorique && (
                                    <View style={styles.sousListe}>
                                        {trajetsTermines.length === 0 ? (
                                            <Text style={styles.emptyText}>Aucun trajet effectue</Text>
                                        ) : (
                                            trajetsTermines.map((t, index) => (
                                                <View key={t.id.toString()}>
                                                    {index > 0 && <View style={styles.separator} />}
                                                    <View style={styles.historiqueItem}>
<<<<<<< HEAD
                                                        <Text style={styles.trajetVilles}>
                                                            {`${t.villeDepart} → ${t.villeArrivee}`}
                                                        </Text>
                                                        <Text style={styles.trajetDetails}>
                                                            {formatDate(t.dateHeureDepart)}
                                                        </Text>
=======
                                                        <Text style={styles.trajetVilles}>{t.villeDepart} → {t.villeArrivee}</Text>
                                                        <Text style={styles.trajetDetails}>{formatDate(t.dateHeureDepart)}</Text>
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                                                    </View>
                                                </View>
                                            ))
                                        )}
                                    </View>
                                )}

                                <View style={styles.separator} />

<<<<<<< HEAD
                                <TouchableOpacity
                                    style={styles.navItem}
                                    onPress={() => setShowAvis(!showAvis)}>
                                    <View style={styles.navGauche}>
                                        <Ionicons name="star-outline" size={18} color="#555" />
                                        <Text style={styles.navLabel}>{`Avis reçus (${avis.length})`}</Text>
                                    </View>
                                    <Ionicons
                                        name={showAvis ? 'chevron-down' : 'chevron-forward'}
                                        size={16} color="#444"
                                    />
=======
                                <TouchableOpacity style={styles.navItem} onPress={() => setShowAvis(!showAvis)}>
                                    <View style={styles.navGauche}>
                                        <Ionicons name="star-outline" size={18} color="#555" />
                                        <Text style={styles.navLabel}>Avis reçus ({avis.length})</Text>
                                    </View>
                                    <Ionicons name={showAvis ? 'chevron-down' : 'chevron-forward'} size={16} color="#444" />
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                                </TouchableOpacity>

                                {showAvis && (
                                    <View style={styles.sousListe}>
                                        {avis.length === 0 ? (
                                            <Text style={styles.emptyText}>Aucun avis reçu</Text>
                                        ) : (
                                            avis.map((a, index) => (
                                                <View key={a.id.toString()}>
                                                    {index > 0 && <View style={styles.separator} />}
                                                    <View style={styles.avisItem}>
                                                        <View style={styles.avisAuteurRow}>
                                                            <View style={styles.avisAvatar}>
                                                                <Text style={styles.avisAvatarText}>
<<<<<<< HEAD
                                                                    {`${(a.auteurPrenom || '?')[0]}${(a.auteurNom || '?')[0]}`}
                                                                </Text>
                                                            </View>
                                                            <View>
                                                                <Text style={styles.avisAuteur}>
                                                                    {`${a.auteurPrenom} ${a.auteurNom}`}
                                                                </Text>
                                                                <Text style={styles.avisDate}>
                                                                    {formatDate(a.dateAvis)}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        {a.commentaire ? (
                                                            <Text style={styles.avisCommentaire}>
                                                                {`"${a.commentaire}"`}
                                                            </Text>
                                                        ) : (
                                                            <Text style={styles.avisSansCommentaire}>
                                                                Aucun commentaire
                                                            </Text>
=======
                                                                    {(a.auteurPrenom || '?')[0]}{(a.auteurNom || '?')[0]}
                                                                </Text>
                                                            </View>
                                                            <View>
                                                                <Text style={styles.avisAuteur}>{a.auteurPrenom} {a.auteurNom}</Text>
                                                                <Text style={styles.avisDate}>{formatDate(a.dateAvis)}</Text>
                                                            </View>
                                                        </View>
                                                        {a.commentaire ? (
                                                            <Text style={styles.avisCommentaire}>"{a.commentaire}"</Text>
                                                        ) : (
                                                            <Text style={styles.avisSansCommentaire}>Aucun commentaire</Text>
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                                                        )}
                                                    </View>
                                                </View>
                                            ))
                                        )}
                                    </View>
                                )}

                                <View style={styles.separator} />

<<<<<<< HEAD
                                <TouchableOpacity
                                    style={styles.navItem}
                                    onPress={() => navigation.navigate('Reservations')}>
=======
                                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Reservations')}>
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                                    <View style={styles.navGauche}>
                                        <Ionicons name="ticket-outline" size={18} color="#555" />
                                        <Text style={styles.navLabel}>Mes reservations</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#444" />
                                </TouchableOpacity>
                            </View>
                        </View>

<<<<<<< HEAD
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Support</Text>
                            <View style={styles.card}>
                                <TouchableOpacity style={styles.navItem}>
=======
                        {/* Support */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Support</Text>
                            <View style={styles.card}>
                                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Aide')}>
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                                    <View style={styles.navGauche}>
                                        <Ionicons name="help-circle-outline" size={18} color="#555" />
                                        <Text style={styles.navLabel}>Aide & Support</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#444" />
                                </TouchableOpacity>
                                <View style={styles.separator} />
                                <TouchableOpacity style={styles.navItem}>
                                    <View style={styles.navGauche}>
                                        <Ionicons name="document-outline" size={18} color="#555" />
                                        <Text style={styles.navLabel}>Conditions generales</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#444" />
                                </TouchableOpacity>
                                <View style={styles.separator} />
                                <TouchableOpacity style={styles.navItem}>
                                    <View style={styles.navGauche}>
                                        <Ionicons name="shield-outline" size={18} color="#555" />
                                        <Text style={styles.navLabel}>Protection des donnees</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#444" />
                                </TouchableOpacity>
                            </View>
                        </View>

<<<<<<< HEAD
=======
                        {/* Déconnexion */}
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                        <View style={styles.section}>
                            <View style={styles.card}>
                                <TouchableOpacity style={styles.navItem} onPress={handleLogout}>
                                    <View style={styles.navGauche}>
                                        <Ionicons name="log-out-outline" size={18} color="#e74c3c" />
                                        <Text style={[styles.navLabel, { color: '#e74c3c' }]}>Deconnexion</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Modal passagers */}
<<<<<<< HEAD
            <Modal
                visible={showPassagers}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPassagers(false)}>
=======
            <Modal visible={showPassagers} transparent animationType="slide" onRequestClose={() => setShowPassagers(false)}>
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Passagers confirmes</Text>
                                {trajetSelectionne && (
                                    <Text style={styles.modalSubtitle}>
<<<<<<< HEAD
                                        {`${trajetSelectionne.villeDepart} → ${trajetSelectionne.villeArrivee}`}
=======
                                        {trajetSelectionne.villeDepart} → {trajetSelectionne.villeArrivee}
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setShowPassagers(false)}>
                                <Ionicons name="close" size={24} color="#eee" />
                            </TouchableOpacity>
                        </View>
<<<<<<< HEAD

=======
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                        {loadingPassagers ? (
                            <ActivityIndicator color="#00b5e2" size="large" style={{ marginTop: 20 }} />
                        ) : (
                            <ScrollView style={{ marginTop: 10 }}>
                                {passagersTrajet.length === 0 ? (
<<<<<<< HEAD
                                    <View style={styles.modalVide}>
                                        <Ionicons name="people-outline" size={48} color="#333" />
                                        <Text style={styles.modalVideText}>Aucun passager confirme</Text>
                                    </View>
                                ) : (
                                    passagersTrajet.map((p, index) => {
                                        const initiales = `${(p.passagerPrenom || '?')[0]}${(p.passagerNom || '?')[0]}`.toUpperCase();
                                        return (
                                            <View key={index.toString()} style={styles.passagerCard}>
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
                                                    <Text style={styles.passagerDetail}>
                                                        {p.passagerTelephone || 'Telephone non renseigne'}
                                                    </Text>
                                                    {p.departPassager && p.arriveePassager && (
                                                        <Text style={styles.passagerDetail}>
                                                            {`${p.departPassager} → ${p.arriveePassager}`}
                                                        </Text>
                                                    )}
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.passagerBtnChat}
                                                    onPress={() => navigation.navigate('Chat', {
                                                        reservationId: p.id,
                                                        interlocuteur: {
                                                            id: p.passagerId,
                                                            nom: p.passagerNom,
                                                            prenom: p.passagerPrenom
                                                        },
                                                        userId: null
                                                    })}>
                                                    <Ionicons name="chatbubble-outline" size={16} color="#00b5e2" />
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })
=======
                                    <Text style={styles.emptyText}>Aucun passager pour ce trajet</Text>
                                ) : (
                                    passagersTrajet.map((p, index) => (
                                        <View key={index.toString()} style={styles.infoRow}>
                                            <Text style={styles.infoValue}>{p.prenom} {p.nom}</Text>
                                            <Text style={styles.infoLabel}>{p.telephone}</Text>
                                        </View>
                                    ))
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
                                )}
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
        backgroundColor: '#1a1a1a', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', gap: 16,
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
    },
<<<<<<< HEAD
    avatarContainer: { position: 'relative' },
    avatar: {
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: '#252525', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#333',
    },
=======
    sousListe: {
    backgroundColor: '#252525',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
},
historiqueItem: { paddingVertical: 8, gap: 3 },
    avatarContainer: { position: 'relative' },
    avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#252525', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333' },
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
    avatarImage: { width: 60, height: 60, borderRadius: 30 },
    avatarEdit: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: '#00b5e2', borderRadius: 10,
        width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: '#888', fontSize: 22, fontWeight: 'bold' },
    headerInfo: { flex: 1 },
    nomRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    nom: { fontSize: 20, fontWeight: 'bold', color: '#eee' },
    email: { fontSize: 14, color: '#666', marginTop: 2 },
    miniBio: { fontSize: 14, color: '#555', fontStyle: 'italic', marginTop: 3 },

<<<<<<< HEAD
    onglets: {
        flexDirection: 'row', backgroundColor: '#1a1a1a',
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
    },
=======
    onglets: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
    onglet: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
    ongletActif: { borderBottomWidth: 2, borderBottomColor: '#00b5e2' },
    ongletText: { fontSize: 15, fontWeight: '600', color: '#555' },
    ongletTextActif: { color: '#00b5e2' },

    section: { paddingHorizontal: 16, marginTop: 18 },
<<<<<<< HEAD
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 13, fontWeight: '600', color: '#555',
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
    },
    editButton: { fontSize: 15, color: '#00b5e2', fontWeight: '600' },

    card: {
        backgroundColor: '#1e1e1e', borderRadius: 14,
        padding: 16, borderWidth: 1, borderColor: '#2a2a2a',
    },
    separator: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 4 },
    emptyText: { fontSize: 15, color: '#555', textAlign: 'center', paddingVertical: 8 },

    infoRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 8,
    },
    infoLabel: { fontSize: 13, color: '#666', flex: 1 },
    infoValue: { fontSize: 13, color: '#ddd', flex: 2, textAlign: 'right' },
    editInput: {
        flex: 2, fontSize: 13, color: '#eee', textAlign: 'right',
        borderBottomWidth: 1, borderBottomColor: '#333', paddingVertical: 2,
    },

    dashboardCard: {
        backgroundColor: '#1e1e1e', borderRadius: 14,
        borderWidth: 1, borderColor: '#2a2a2a', overflow: 'hidden',
    },
=======
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 13, fontWeight: '600', color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    editButton: { fontSize: 15, color: '#00b5e2', fontWeight: '600' },

    card: { backgroundColor: '#1e1e1e', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2a2a2a' },
    separator: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 4 },

    emptyText: { fontSize: 15, color: '#555', textAlign: 'center', paddingVertical: 8 },
    emptyContainer: { alignItems: 'center', paddingVertical: 32, gap: 8 },
    emptyTextLarge: { fontSize: 15, color: '#555' },

    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    infoLabel: { fontSize: 13, color: '#666', flex: 1 },
    infoValue: { fontSize: 13, color: '#ddd', flex: 2, textAlign: 'right' },
    editInput: { flex: 2, fontSize: 13, color: '#eee', textAlign: 'right', borderBottomWidth: 1, borderBottomColor: '#333', paddingVertical: 2 },

    dashboardCard: { backgroundColor: '#1e1e1e', borderRadius: 14, borderWidth: 1, borderColor: '#2a2a2a', overflow: 'hidden' },
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
    dashboardRow: { flexDirection: 'row', alignItems: 'center' },
    dashboardStat: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8 },
    dashboardValeur: { fontSize: 20, fontWeight: 'bold', color: '#00b5e2', marginBottom: 3 },
    dashboardLabel: { fontSize: 10, color: '#555', textAlign: 'center' },
    dashboardDivider: { width: 1, height: 44, backgroundColor: '#2a2a2a' },
    dashboardSeparator: { height: 1, backgroundColor: '#2a2a2a' },
<<<<<<< HEAD
    dashboardMembreRow: {
        flexDirection: 'row', alignItems: 'center',
        gap: 8, paddingVertical: 10, paddingHorizontal: 16,
    },
=======
    dashboardMembreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 16 },
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
    dashboardMembreTexte: { fontSize: 12, color: '#555' },

    trajetItem: { paddingVertical: 8, gap: 6 },
    trajetItemInfo: { gap: 3 },
    trajetVilles: { fontSize: 14, fontWeight: '600', color: '#ddd' },
    trajetDetails: { fontSize: 12, color: '#555' },
    trajetBoutons: { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' },

<<<<<<< HEAD
    btnIcone: {
        borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 8,
        paddingVertical: 6, paddingHorizontal: 10,
    },
=======
    btnIcone: { borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
    btnDemarrer: { backgroundColor: '#00b5e2', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
    btnDemarrerText: { color: 'white', fontSize: 12, fontWeight: '600' },
    btnEnCours: { backgroundColor: '#252525', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
    btnEnCoursText: { color: '#888', fontSize: 12 },
<<<<<<< HEAD
    btnTerminer: {
        backgroundColor: '#252525', borderRadius: 8, paddingVertical: 6,
        paddingHorizontal: 10, borderWidth: 1, borderColor: '#333',
    },
    btnTerminerText: { color: '#ddd', fontSize: 12 },
    btnAnnuler: {
        borderWidth: 1, borderColor: '#e74c3c', borderRadius: 8,
        paddingVertical: 6, paddingHorizontal: 10,
    },
    btnAnnulerText: { color: '#e74c3c', fontSize: 12 },

    vehiculeItem: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 8,
    },
    vehiculeNom: { fontSize: 14, fontWeight: '600', color: '#ddd' },
    vehiculeDetails: { fontSize: 12, color: '#555', marginTop: 2 },

    navItem: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingVertical: 12,
    },
    navGauche: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    navLabel: { fontSize: 14, color: '#ddd' },

    sousListe: {
        backgroundColor: '#252525', borderRadius: 10,
        padding: 12, marginTop: 8, marginBottom: 4,
    },
    historiqueItem: { paddingVertical: 8, gap: 3 },

    avisItem: { paddingVertical: 10, gap: 6 },
    avisAuteurRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avisAvatar: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#252525', alignItems: 'center', justifyContent: 'center',
    },
    avisAvatarText: { color: '#888', fontSize: 12, fontWeight: '700' },
    avisAuteur: { fontSize: 13, fontWeight: '600', color: '#ddd' },
    avisDate: { fontSize: 11, color: '#555', marginTop: 1 },
=======
    btnTerminer: { backgroundColor: '#252525', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: '#333' },
    btnTerminerText: { color: '#ddd', fontSize: 12 },
    btnAnnuler: { borderWidth: 1, borderColor: '#e74c3c', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
    btnAnnulerText: { color: '#e74c3c', fontSize: 12 },

    vehiculeItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    vehiculeNom: { fontSize: 14, fontWeight: '600', color: '#ddd' },
    vehiculeDetails: { fontSize: 12, color: '#555', marginTop: 2 },

    navItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
    navGauche: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    navLabel: { fontSize: 14, color: '#ddd' },

    historiqueItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    historiqueLeft: { flex: 1, gap: 3 },
    historiquePrix: { fontSize: 13, fontWeight: '600', color: '#00b5e2' },

    avisItem: { paddingVertical: 10, gap: 6 },
    avisHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    avisAuteurRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avisAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#252525', alignItems: 'center', justifyContent: 'center' },
    avisAvatarText: { color: '#888', fontSize: 12, fontWeight: '700' },
    avisAuteur: { fontSize: 13, fontWeight: '600', color: '#ddd' },
    avisDate: { fontSize: 11, color: '#555', marginTop: 1 },
    avisEtoiles: { flexDirection: 'row', gap: 2 },
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
    avisCommentaire: { fontSize: 13, color: '#888', fontStyle: 'italic', lineHeight: 18 },
    avisSansCommentaire: { fontSize: 12, color: '#444', fontStyle: 'italic' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
<<<<<<< HEAD
    modalCard: {
        backgroundColor: '#1e1e1e', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 24, maxHeight: '70%', borderTopWidth: 1, borderColor: '#2a2a2a',
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 16,
    },
=======
    modalCard: { backgroundColor: '#1e1e1e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '70%', borderTopWidth: 1, borderColor: '#2a2a2a' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
    modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#eee' },
    modalSubtitle: { fontSize: 12, color: '#666', marginTop: 3 },
    modalVide: { alignItems: 'center', paddingVertical: 32, gap: 8 },
    modalVideText: { color: '#555', fontSize: 14 },

<<<<<<< HEAD
    passagerCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#252525', borderRadius: 10, padding: 10, marginBottom: 8,
    },
    passagerAvatar: { width: 40, height: 40, borderRadius: 20 },
    passagerAvatarPlaceholder: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#1e1e1e', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#333',
    },
=======
    passagerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#252525', borderRadius: 10, padding: 10, marginBottom: 8 },
    passagerAvatar: { width: 40, height: 40, borderRadius: 20 },
    passagerAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e1e1e', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333' },
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
    passagerInitiales: { color: '#888', fontSize: 14, fontWeight: '700' },
    passagerInfos: { flex: 1 },
    passagerNom: { color: '#eee', fontSize: 14, fontWeight: '600' },
    passagerDetail: { color: '#666', fontSize: 12, marginTop: 2 },
<<<<<<< HEAD
    passagerBtnChat: {
        padding: 6, backgroundColor: '#252525',
        borderRadius: 16, borderWidth: 1, borderColor: '#333',
    },
=======
    passagerBtnChat: { padding: 6, backgroundColor: '#252525', borderRadius: 16, borderWidth: 1, borderColor: '#333' },
>>>>>>> cbff4a2fceee13779af0c1d143993d0f7383b45a
});