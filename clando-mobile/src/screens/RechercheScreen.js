import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
    ScrollView, Platform, Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { getUserId } from '../services/auth.service';
import { QUARTIERS_CONAKRY } from '../constants/QUARTIERS_CONAKRY';

export default function RechercheScreen({ navigation }) {
    const [villeDepart, setVilleDepart] = useState('');
    const [villeArrivee, setVilleArrivee] = useState('');
    const [dateDepart, setDateDepart] = useState(new Date()); // ✅ date du jour par défaut
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [nbNotifications, setNbNotifications] = useState(0);
    const [historique, setHistorique] = useState([]);
    const [favoris, setFavoris] = useState([]);
    const [champActif, setChampActif] = useState(null);
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        chargerNotifications();
        chargerHistorique();
        chargerFavoris();
    }, []);

    const chargerNotifications = async () => {
        try {
            const userId = await getUserId();
            if (!userId) return;
            const response = await api.get(`/reservations/conducteur/${userId}/en-attente`);
            setNbNotifications(response.data.length);
        } catch (error) {}
    };

    const chargerHistorique = async () => {
        try {
            const data = await AsyncStorage.getItem('clando_historique');
            if (data) setHistorique(JSON.parse(data));
        } catch (error) {}
    };

    const chargerFavoris = async () => {
        try {
            const data = await AsyncStorage.getItem('clando_favoris');
            if (data) setFavoris(JSON.parse(data));
        } catch (error) {}
    };

    const sauvegarderHistorique = async (depart, arrivee) => {
        try {
            const nouvelleRecherche = { id: Date.now(), depart, arrivee, date: new Date().toLocaleDateString('fr-FR') };
            const nouvelleListe = [
                nouvelleRecherche,
                ...historique.filter(h => !(h.depart === depart && h.arrivee === arrivee))
            ].slice(0, 5);
            setHistorique(nouvelleListe);
            await AsyncStorage.setItem('clando_historique', JSON.stringify(nouvelleListe));
        } catch (error) {}
    };

    const effacerHistorique = async () => {
        Alert.alert('Effacer', 'Supprimer tout l\'historique ?', [
            { text: 'Non', style: 'cancel' },
            {
                text: 'Oui', style: 'destructive',
                onPress: async () => {
                    setHistorique([]);
                    await AsyncStorage.removeItem('clando_historique');
                }
            }
        ]);
    };

    const toggleFavori = async (depart, arrivee) => {
        try {
            const existe = favoris.find(f => f.depart === depart && f.arrivee === arrivee);
            const nouvelleListe = existe
                ? favoris.filter(f => !(f.depart === depart && f.arrivee === arrivee))
                : [...favoris, { id: Date.now(), depart, arrivee }];
            setFavoris(nouvelleListe);
            await AsyncStorage.setItem('clando_favoris', JSON.stringify(nouvelleListe));
        } catch (error) {}
    };

    const estFavori = (depart, arrivee) => favoris.some(f => f.depart === depart && f.arrivee === arrivee);

    const utiliserRecherche = (depart, arrivee) => {
        setVilleDepart(depart);
        setVilleArrivee(arrivee);
        setChampActif(null);
        setSuggestions([]);
    };

    const supprimerHistorique = async (id) => {
        const nouvelleListe = historique.filter(h => h.id !== id);
        setHistorique(nouvelleListe);
        await AsyncStorage.setItem('clando_historique', JSON.stringify(nouvelleListe));
    };

    // ✅ Inverser départ et arrivée
    const inverserVilles = () => {
        const temp = villeDepart;
        setVilleDepart(villeArrivee);
        setVilleArrivee(temp);
        setSuggestions([]);
        setChampActif(null);
    };

    const filtrerSuggestions = (texte) => {
        if (!texte || texte.length < 2) { setSuggestions([]); return; }
        const normalise = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const texteNorm = normalise(texte);
        setSuggestions(QUARTIERS_CONAKRY.filter(q => normalise(q).includes(texteNorm)).slice(0, 6));
    };

    const onChangeDepart = (texte) => {
        setVilleDepart(texte);
        setChampActif('depart');
        filtrerSuggestions(texte);
    };

    const onChangeArrivee = (texte) => {
        setVilleArrivee(texte);
        setChampActif('arrivee');
        filtrerSuggestions(texte);
    };

    const choisirSuggestion = (quartier) => {
        if (champActif === 'depart') setVilleDepart(quartier);
        else if (champActif === 'arrivee') setVilleArrivee(quartier);
        setChampActif(null);
        setSuggestions([]);
        Keyboard.dismiss();
    };

    const fermerSuggestions = () => {
        setChampActif(null);
        setSuggestions([]);
    };

    const formatDateAffichage = (date) => {
        if (!date) return 'Choisir une date';
        const aujourd = new Date();
        const demain = new Date();
        demain.setDate(aujourd.getDate() + 1);

        if (date.toDateString() === aujourd.toDateString()) return "Aujourd'hui";
        if (date.toDateString() === demain.toDateString()) return 'Demain';
        return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const normaliser = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const rechercher = async () => {
        if (!villeDepart || !villeArrivee) {
            Alert.alert('Champs manquants', 'Veuillez saisir un point de depart et une destination.');
            return;
        }
        if (normaliser(villeDepart.trim()) === normaliser(villeArrivee.trim())) {
            Alert.alert('Erreur', 'Le depart et l\'arrivee ne peuvent pas etre identiques.');
            return;
        }
        fermerSuggestions();
        setLoading(true);
        try {
            const response = await api.get('/trajets/rechercher', {
                params: {
                    villeDepart: normaliser(villeDepart.trim()),
                    villeArrivee: normaliser(villeArrivee.trim()),
                    page: 0,
                    size: 10
                }
            });

            await sauvegarderHistorique(villeDepart.trim(), villeArrivee.trim());

            if (response.data.content.length === 0) {
                Alert.alert(
                    'Aucun trajet trouve',
                    `Aucun trajet disponible de ${villeDepart} vers ${villeArrivee} pour le moment.`
                );
            } else {
                navigation.navigate('Resultats', {
                    trajets: response.data.content,
                    villeDepart: villeDepart.trim(),
                    villeArrivee: villeArrivee.trim()
                });
            }
        } catch (error) {
            Alert.alert('Erreur de connexion', 'Impossible de se connecter au serveur. Verifiez votre connexion internet.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <View style={{ width: 40 }} />
                        <Text style={styles.headerTitle}>Wayvo</Text>
                        <TouchableOpacity
                            style={styles.cloche}
                            onPress={() => navigation.navigate('Notifications')}>
                            <Ionicons name="notifications-outline" size={26} color="#eee" />
                            {nbNotifications > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{nbNotifications}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.headerSubtitle}>
                        Où souhaitez-vous aller aujourd'hui ?
                    </Text>
                </View>

                {/* Carte de recherche */}
                <View style={styles.searchCard}>

                    {/* Départ */}
                    <Text style={styles.fieldLabel}>
                        <Ionicons name="radio-button-on" size={12} color="#00b5e2" /> Depart
                    </Text>
                    <View style={[styles.inputContainer, champActif === 'depart' && styles.inputContainerActif]}>
                        <Ionicons name="location-outline" size={18} color="#888" />
                        <TextInput
                            style={styles.input}
                            placeholder="D'ou partez-vous ?"
                            placeholderTextColor="#999"
                            value={villeDepart}
                            onChangeText={onChangeDepart}
                            onFocus={() => { setChampActif('depart'); filtrerSuggestions(villeDepart); }}
                            autoCapitalize="words"
                        />
                        {villeDepart.length > 0 && (
                            <TouchableOpacity onPress={() => { setVilleDepart(''); setSuggestions([]); }}>
                                <Ionicons name="close-circle" size={18} color="#666" />
                            </TouchableOpacity>
                        )}
                    </View>
                    {champActif === 'depart' && suggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                            {suggestions.map((q) => (
                                <TouchableOpacity key={q} style={styles.suggestionItem} onPress={() => choisirSuggestion(q)}>
                                    <Ionicons name="location-outline" size={14} color="#00b5e2" />
                                    <Text style={styles.suggestionTexte}>{q}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* ✅ Bouton inverser */}
                    <TouchableOpacity style={styles.inverserBtn} onPress={inverserVilles}>
                        <View style={styles.inverserLigne} />
                        <View style={styles.inverserIcone}>
                            <Ionicons name="swap-vertical" size={18} color="#00b5e2" />
                        </View>
                        <View style={styles.inverserLigne} />
                    </TouchableOpacity>

                    {/* Arrivée */}
                    <Text style={styles.fieldLabel}>
                        <Ionicons name="radio-button-on" size={12} color="#2ecc71" /> Arrivee
                    </Text>
                    <View style={[styles.inputContainer, champActif === 'arrivee' && styles.inputContainerActif]}>
                        <Ionicons name="location" size={18} color="#888" />
                        <TextInput
                            style={styles.input}
                            placeholder="Ou allez-vous ?"
                            placeholderTextColor="#999"
                            value={villeArrivee}
                            onChangeText={onChangeArrivee}
                            onFocus={() => { setChampActif('arrivee'); filtrerSuggestions(villeArrivee); }}
                            autoCapitalize="words"
                        />
                        {villeArrivee.length > 0 && (
                            <TouchableOpacity onPress={() => { setVilleArrivee(''); setSuggestions([]); }}>
                                <Ionicons name="close-circle" size={18} color="#666" />
                            </TouchableOpacity>
                        )}
                    </View>
                    {champActif === 'arrivee' && suggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                            {suggestions.map((q) => (
                                <TouchableOpacity key={q} style={styles.suggestionItem} onPress={() => choisirSuggestion(q)}>
                                    <Ionicons name="location-outline" size={14} color="#00b5e2" />
                                    <Text style={styles.suggestionTexte}>{q}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Date */}
                    <Text style={styles.fieldLabel}>
                        <Ionicons name="calendar-outline" size={12} color="#888" /> Date du trajet
                    </Text>
                    <TouchableOpacity
                        style={styles.inputContainer}
                        onPress={() => {
                            Keyboard.dismiss();
                            fermerSuggestions();
                            setShowDatePicker(true);
                        }}>
                        <Ionicons name="calendar-outline" size={18} color="#888" />
                        <Text style={[styles.input, { color: '#eee' }]}>
                            {formatDateAffichage(dateDepart)}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="#888" />
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={dateDepart || new Date()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            minimumDate={new Date()}
                            themeVariant="dark"
                            onChange={(event, selectedDate) => {
                                setShowDatePicker(false);
                                if (selectedDate) setDateDepart(selectedDate);
                            }}
                        />
                    )}

                    {/* Bouton rechercher */}
                    <TouchableOpacity
                        style={[styles.searchButton, loading && { opacity: 0.7 }]}
                        onPress={rechercher}
                        disabled={loading}>
                        {loading
                            ? <ActivityIndicator size={20} color="white" />
                            : <>
                                <Ionicons name="search" size={18} color="white" />
                                <Text style={styles.searchButtonText}>Rechercher un trajet</Text>
                            </>
                        }
                    </TouchableOpacity>
                </View>

                {/* Favoris */}
                {favoris.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Mes favoris</Text>
                        {favoris.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.rechercheItem}
                                onPress={() => utiliserRecherche(item.depart, item.arrivee)}>
                                <Ionicons name="heart" size={16} color="#e74c3c" />
                                <View style={styles.rechercheInfo}>
                                    <Text style={styles.rechercheTexte}>{item.depart} → {item.arrivee}</Text>
                                </View>
                                <TouchableOpacity onPress={() => toggleFavori(item.depart, item.arrivee)} style={styles.actionBtn}>
                                    <Ionicons name="close" size={16} color="#666" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Historique */}
                {historique.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recherches recentes</Text>
                            <TouchableOpacity onPress={effacerHistorique}>
                                <Text style={styles.effacerText}>Tout effacer</Text>
                            </TouchableOpacity>
                        </View>
                        {historique.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.rechercheItem}
                                onPress={() => utiliserRecherche(item.depart, item.arrivee)}>
                                <Ionicons name="time-outline" size={16} color="#666" />
                                <View style={styles.rechercheInfo}>
                                    <Text style={styles.rechercheTexte}>{item.depart} → {item.arrivee}</Text>
                                    <Text style={styles.rechercheDate}>{item.date}</Text>
                                </View>
                                <View style={styles.rechercheActions}>
                                    <TouchableOpacity
                                        onPress={() => toggleFavori(item.depart, item.arrivee)}
                                        style={styles.actionBtn}>
                                        <Ionicons
                                            name={estFavori(item.depart, item.arrivee) ? "heart" : "heart-outline"}
                                            size={16}
                                            color={estFavori(item.depart, item.arrivee) ? "#e74c3c" : "#666"}
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => supprimerHistorique(item.id)} style={styles.actionBtn}>
                                        <Ionicons name="close" size={16} color="#666" />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    header: {
        backgroundColor: '#1a1a1a',
        paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24
    },
    headerRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 12
    },
    headerTitle: {
        fontSize: 36, fontWeight: 'bold', color: '#00b5e2',
        letterSpacing: 3, textAlign: 'center', flex: 1
    },
    cloche: { width: 40, alignItems: 'flex-end', position: 'relative' },
    badge: {
        position: 'absolute', top: -4, right: -4,
        backgroundColor: '#e74c3c', borderRadius: 10,
        minWidth: 18, height: 18,
        alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4
    },
    badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    headerSubtitle: { fontSize: 15, color: '#aaa', textAlign: 'center', lineHeight: 22 },

    searchCard: {
        backgroundColor: '#1e1e1e',
        marginHorizontal: 16, marginTop: -20,
        borderRadius: 16, padding: 20,
        borderWidth: 1, borderColor: '#2a2a2a'
    },
    fieldLabel: {
        fontSize: 12, fontWeight: '600', color: '#888',
        marginBottom: 6, marginTop: 14,
        textTransform: 'uppercase', letterSpacing: 1
    },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: '#2a2a2a',
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4,
        backgroundColor: '#252525', gap: 10
    },
    inputContainerActif: { borderColor: '#00b5e2' },
    input: { flex: 1, padding: 10, fontSize: 15, color: '#eee' },
    placeholder: { color: '#666' },

    // ✅ Bouton inverser
    inverserBtn: {
        flexDirection: 'row', alignItems: 'center',
        marginVertical: 8, paddingHorizontal: 4
    },
    inverserLigne: { flex: 1, height: 1, backgroundColor: '#2a2a2a' },
    inverserIcone: {
        backgroundColor: '#252525', borderRadius: 20,
        width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#00b5e2', marginHorizontal: 10
    },

    suggestionsContainer: {
        backgroundColor: '#252525', borderRadius: 10,
        borderWidth: 1, borderColor: '#00b5e2',
        marginTop: 4, overflow: 'hidden',
    },
    suggestionItem: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 12, paddingHorizontal: 14,
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
    },
    suggestionTexte: { color: '#eee', fontSize: 14 },

    searchButton: {
        backgroundColor: '#00b5e2', borderRadius: 10, padding: 15,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, marginTop: 20
    },
    searchButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

    section: { paddingHorizontal: 16, marginTop: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: {
        fontSize: 13, fontWeight: '600', color: '#888',
        textTransform: 'uppercase', letterSpacing: 1,
    },
    effacerText: { fontSize: 13, color: '#e74c3c', fontWeight: '600' },

    rechercheItem: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#1e1e1e', borderRadius: 10, padding: 12,
        marginBottom: 8, borderWidth: 1, borderColor: '#2a2a2a'
    },
    rechercheInfo: { flex: 1 },
    rechercheTexte: { fontSize: 14, color: '#ddd', fontWeight: '500' },
    rechercheDate: { fontSize: 12, color: '#666', marginTop: 2 },
    rechercheActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { padding: 4 },
});