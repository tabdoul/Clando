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
import { colors, spacing, radius, shadows } from '../../constants/theme';

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
    const [ongletActif, setOngletActif] = useState('profil');
    const [showHistoriqueModal, setShowHistoriqueModal] = useState(false);

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
        } catch {
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
                    const r = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8
                    });
                    if (!r.canceled) await uploadPhoto(r.assets[0].uri);
                }
            },
            {
                text: 'Camera',
                onPress: async () => {
                    const p = await ImagePicker.requestCameraPermissionsAsync();
                    if (!p.granted) return;
                    const r = await ImagePicker.launchCameraAsync({
                        allowsEditing: true, aspect: [1, 1], quality: 0.8
                    });
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
                        Alert.alert('Trajet termine !', 'Les passagers ont ete notifies.');
                        chargerProfil();
                    } catch (err) {
                        Alert.alert('Erreur', err.response?.data?.erreur || 'Impossible de terminer');
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
                    } catch {
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
                    } catch {
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

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size={36} color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>

            {/* Header */}
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
                        <Ionicons name="camera-outline" size={12} color="white" />
                    </View>
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <View style={styles.nomRow}>
                        <Text style={styles.nom}>{utilisateur?.prenom} {utilisateur?.nom}</Text>
                        {utilisateur?.verifie && (
                            <Ionicons name="checkmark-circle" size={18} color="white" />
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
                {['profil', 'compte'].map((onglet) => (
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
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }>

                {/* ===== ONGLET PROFIL ===== */}
                {ongletActif === 'profil' && (
                    <>
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
                                            <Text style={styles.dashboardValeur}>
                                                {stats.gainsTotaux?.toLocaleString()}
                                            </Text>
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
                                        <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                                        <Text style={styles.dashboardMembreTexte}>
                                            {`Membre depuis le ${new Date(stats.membreDepuis).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

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
                                                    placeholderTextColor={colors.textDisabled}
                                                />
                                            ) : (
                                                <Text style={styles.infoValue}>{item.value}</Text>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

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
                                                        <Ionicons name="people-outline" size={14} color={colors.textMuted} />
                                                    </TouchableOpacity>
                                                    {t.trajetDemarre ? (
                                                        <View style={styles.btnEnCours}>
                                                            <Text style={styles.btnEnCoursText}>En cours</Text>
                                                        </View>
                                                    ) : peutDemarrer ? (
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
                                                        <Text style={styles.btnAnnulerText}>Annuler</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mes documents</Text>
                            <View style={styles.card}>
                                <TouchableOpacity
                                    style={styles.navItem}
                                    onPress={() => navigation.navigate('Documents')}>
                                    <View style={styles.navGauche}>
                                        <Ionicons name="folder-open-outline" size={18} color={colors.textMuted} />
                                        <View>
                                            <Text style={styles.navLabel}>Gérer mes documents</Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
                                </TouchableOpacity>
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
                                                <Text style={styles.vehiculeNom}>{`${v.marque} ${v.modele}`}</Text>
                                                <Text style={styles.vehiculeDetails}>
                                                    {`${v.immatriculation} · ${v.nbPlaces} places`}
                                                </Text>
                                            </View>
                                            <TouchableOpacity onPress={() => supprimerVehicule(v.id)}>
                                                <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
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
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mon activite</Text>
                            <View style={styles.card}>
                                <TouchableOpacity
                                    style={styles.navItem}
                                    onPress={() => setShowHistorique(!showHistorique)}>
                                    <View style={styles.navGauche}>
                                        <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                                        <Text style={styles.navLabel}>
                                            {`Historique des trajets (${trajetsTermines.length})`}
                                        </Text>
                                    </View>
                                    <Ionicons
                                        name={showHistorique ? 'chevron-down' : 'chevron-forward'}
                                        size={16} color={colors.textDisabled}
                                    />
                                </TouchableOpacity>

                                {showHistorique && (
                                    <View style={styles.sousListe}>
                                        {trajetsTermines.length === 0 ? (
                                            <Text style={styles.emptyText}>Aucun trajet effectue</Text>
                                        ) : (
                                            <>
                                                {trajetsTermines.slice(0, 5).map((t, index) => (
                                                    <View key={t.id.toString()}>
                                                        {index > 0 && <View style={styles.separator} />}
                                                        <View style={styles.historiqueItem}>
                                                            <Text style={styles.trajetVilles}>
                                                                {`${t.villeDepart} → ${t.villeArrivee}`}
                                                            </Text>
                                                            <Text style={styles.trajetDetails}>
                                                                {formatDate(t.dateHeureDepart)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                ))}

                                                {trajetsTermines.length > 5 && (
                                                    <TouchableOpacity
                                                        style={styles.voirPlusBtn}
                                                        onPress={() => setShowHistoriqueModal(true)}>
                                                        <Text style={styles.voirPlusText}>
                                                            {`Voir tout (${trajetsTermines.length} trajets)`}
                                                        </Text>
                                                        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                                                    </TouchableOpacity>
                                                )}
                                            </>
                                        )}
                                    </View>
                                )}

                                <View style={styles.separator} />

                                <TouchableOpacity
                                    style={styles.navItem}
                                    onPress={() => setShowAvis(!showAvis)}>
                                    <View style={styles.navGauche}>
                                        <Ionicons name="star-outline" size={18} color={colors.textMuted} />
                                        <Text style={styles.navLabel}>{`Avis reçus (${avis.length})`}</Text>
                                    </View>
                                    <Ionicons
                                        name={showAvis ? 'chevron-down' : 'chevron-forward'}
                                        size={16} color={colors.textDisabled}
                                    />
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
                                                        )}
                                                    </View>
                                                </View>
                                            ))
                                        )}
                                    </View>
                                )}

                                <View style={styles.separator} />

                                <TouchableOpacity
                                    style={styles.navItem}
                                    onPress={() => navigation.navigate('Reservations')}>
                                    <View style={styles.navGauche}>
                                        <Ionicons name="ticket-outline" size={18} color={colors.textMuted} />
                                        <Text style={styles.navLabel}>Mes reservations</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Support</Text>
                            <View style={styles.card}>
                                <TouchableOpacity
                                    style={styles.navItem}
                                    onPress={() => navigation.navigate('Aide')}>
                                    <View style={styles.navGauche}>
                                        <Ionicons name="help-circle-outline" size={18} color={colors.textMuted} />
                                        <Text style={styles.navLabel}>Aide & Support</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
                                </TouchableOpacity>
                                <View style={styles.separator} />
                                <TouchableOpacity
                                    style={styles.navItem}
                                    onPress={() => Linking.openURL('https://wayvo-frontend.vercel.app/mentions-legales')}>
                                    <View style={styles.navGauche}>
                                        <Ionicons name="document-outline" size={18} color={colors.textMuted} />
                                        <Text style={styles.navLabel}>Conditions generales</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
                                </TouchableOpacity>
                                <View style={styles.separator} />
                                <TouchableOpacity
                                    style={styles.navItem}
                                    onPress={() => Linking.openURL('https://wayvo-frontend.vercel.app/confidentialite')}>
                                    <View style={styles.navGauche}>
                                        <Ionicons name="shield-outline" size={18} color={colors.textMuted} />
                                        <Text style={styles.navLabel}>Protection des donnees</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <View style={styles.card}>
                                <TouchableOpacity style={styles.navItem} onPress={handleLogout}>
                                    <View style={styles.navGauche}>
                                        <Ionicons name="log-out-outline" size={18} color={colors.red} />
                                        <Text style={[styles.navLabel, { color: colors.red }]}>Deconnexion</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal
                visible={showHistoriqueModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowHistoriqueModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {`Historique (${trajetsTermines.length} trajets)`}
                            </Text>
                            <TouchableOpacity onPress={() => setShowHistoriqueModal(false)}>
                                <Ionicons name="close" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {trajetsTermines.map((t, index) => (
                                <View key={t.id.toString()}>
                                    {index > 0 && <View style={styles.separator} />}
                                    <View style={styles.historiqueItem}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.trajetVilles}>
                                                {`${t.villeDepart} → ${t.villeArrivee}`}
                                            </Text>
                                            <Text style={styles.trajetDetails}>
                                                {formatDate(t.dateHeureDepart)}
                                            </Text>
                                        </View>
                                        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                                            {`${t.prixConducteur?.toLocaleString()} GNF`}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                            <View style={{ height: 20 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal
                visible={showPassagers}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPassagers(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Passagers confirmes</Text>
                                {trajetSelectionne && (
                                    <Text style={styles.modalSubtitle}>
                                        {`${trajetSelectionne.villeDepart} → ${trajetSelectionne.villeArrivee}`}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setShowPassagers(false)}>
                                <Ionicons name="close" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {loadingPassagers ? (
                            <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 20 }} />
                        ) : (
                            <ScrollView style={{ marginTop: 10 }}>
                                {passagersTrajet.length === 0 ? (
                                    <View style={styles.modalVide}>
                                        <Ionicons name="people-outline" size={48} color={colors.border} />
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
                                                    <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })
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
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },

    header: {
        backgroundColor: colors.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: spacing.xl,
        flexDirection: 'row', alignItems: 'center', gap: 16,
    },
    avatarContainer: { position: 'relative' },
    avatar: {
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    },
    avatarImage: { width: 60, height: 60, borderRadius: 30 },
    avatarEdit: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: colors.accent, borderRadius: 10,
        width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
    headerInfo: { flex: 1 },
    nomRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    nom: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    email: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    miniBio: { fontSize: 14, color: 'rgba(255,255,255,0.65)', fontStyle: 'italic', marginTop: 3 },

    onglets: {
        flexDirection: 'row', backgroundColor: colors.surface,
        borderBottomWidth: 1, borderBottomColor: colors.separator,
    },
    onglet: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
    ongletActif: { borderBottomWidth: 2, borderBottomColor: colors.accent },
    ongletText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
    ongletTextActif: { color: colors.accent },

    section: { paddingHorizontal: spacing.lg, marginTop: 18 },
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 13, fontWeight: '600', color: colors.textMuted,
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
    },
    editButton: { fontSize: 15, color: colors.primary, fontWeight: '600' },

    card: {
        backgroundColor: colors.surface, borderRadius: radius.md,
        padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
        ...shadows.card,
    },
    separator: { height: 1, backgroundColor: colors.separator, marginVertical: 4 },
    emptyText: { fontSize: 15, color: colors.textMuted, textAlign: 'center', paddingVertical: 8 },

    infoRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 8,
    },
    infoLabel: { fontSize: 13, color: colors.textMuted, flex: 1 },
    infoValue: { fontSize: 13, color: colors.textPrimary, flex: 2, textAlign: 'right' },
    editInput: {
        flex: 2, fontSize: 13, color: colors.textPrimary, textAlign: 'right',
        borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 2,
    },

    dashboardCard: {
        backgroundColor: colors.surface, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
        ...shadows.card,
    },
    dashboardRow: { flexDirection: 'row', alignItems: 'center' },
    dashboardStat: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8 },
    dashboardValeur: { fontSize: 20, fontWeight: 'bold', color: colors.primary, marginBottom: 3 },
    dashboardLabel: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },
    dashboardDivider: { width: 1, height: 44, backgroundColor: colors.separator },
    dashboardSeparator: { height: 1, backgroundColor: colors.separator },
    dashboardMembreRow: {
        flexDirection: 'row', alignItems: 'center',
        gap: 8, paddingVertical: 10, paddingHorizontal: spacing.lg,
    },
    dashboardMembreTexte: { fontSize: 12, color: colors.textMuted },

    trajetItem: { paddingVertical: 8, gap: 6 },
    trajetItemInfo: { gap: 3 },
    trajetVilles: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    trajetDetails: { fontSize: 12, color: colors.textMuted },
    trajetBoutons: { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' },

    btnIcone: {
        borderWidth: 1, borderColor: colors.border, borderRadius: 8,
        paddingVertical: 6, paddingHorizontal: 10,
    },
    btnDemarrer: { backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
    btnDemarrerText: { color: 'white', fontSize: 12, fontWeight: '600' },
    btnEnCours: { backgroundColor: colors.surfaceSecondary, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
    btnEnCoursText: { color: colors.textMuted, fontSize: 12 },
    btnTerminer: {
        backgroundColor: colors.surfaceSecondary, borderRadius: 8, paddingVertical: 6,
        paddingHorizontal: 10, borderWidth: 1, borderColor: colors.border,
    },
    btnTerminerText: { color: colors.textPrimary, fontSize: 12 },
    btnAnnuler: {
        borderWidth: 1, borderColor: colors.red, borderRadius: 8,
        paddingVertical: 6, paddingHorizontal: 10,
    },
    btnAnnulerText: { color: colors.red, fontSize: 12 },

    vehiculeItem: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 8,
    },
    vehiculeNom: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    vehiculeDetails: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

    navItem: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', paddingVertical: 12,
    },
    navGauche: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    navLabel: { fontSize: 14, color: colors.textPrimary },

    sousListe: {
        backgroundColor: colors.surfaceSecondary, borderRadius: radius.sm,
        padding: 12, marginTop: 8, marginBottom: 4,
    },
    historiqueItem: { paddingVertical: 8, gap: 3 },

    avisItem: { paddingVertical: 10, gap: 6 },
    avisAuteurRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avisAvatar: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    },
    avisAvatarText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
    avisAuteur: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
    avisDate: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
    avisCommentaire: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', lineHeight: 18 },
    avisSansCommentaire: { fontSize: 12, color: colors.textDisabled, fontStyle: 'italic' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalCard: {
        backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 24, maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 16,
    },
    voirPlusBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingTop: 10, marginTop: 6,
        borderTopWidth: 1, borderTopColor: colors.separator,
    },
    voirPlusText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    modalTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
    modalSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
    modalVide: { alignItems: 'center', paddingVertical: 32, gap: 8 },
    modalVideText: { color: colors.textMuted, fontSize: 14 },

    passagerCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: colors.surfaceSecondary, borderRadius: radius.sm, padding: 10, marginBottom: 8,
    },
    passagerAvatar: { width: 40, height: 40, borderRadius: 20 },
    passagerAvatarPlaceholder: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: colors.border,
    },
    passagerInitiales: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
    passagerInfos: { flex: 1 },
    passagerNom: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
    passagerDetail: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
    passagerBtnChat: {
        padding: 6, backgroundColor: colors.surface,
        borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    },
});