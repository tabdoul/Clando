import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
    ScrollView, Keyboard, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { getUserId } from '../services/auth.service';
import { QUARTIERS_CONAKRY } from '../../constants/QUARTIERS_CONAKRY';
import { spacing, radius } from '../../constants/theme';

const C = {
    primary: '#182D5A',
    primaryLight: '#EEF2F7',
    primaryBorder: '#D8E4F0',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    textPrimary: '#1a1a1a',
    textSecondary: '#888888',
    textDisabled: '#bbbbbb',
    border: '#F0F0F0',
    separator: '#EEF2F7',
    red: '#E52424',
};

const BTN_HEIGHT = 52;

export default function RechercheScreen({ navigation }) {
    const [villeDepart, setVilleDepart] = useState('');
    const [villeArrivee, setVilleArrivee] = useState('');
    const [loading, setLoading] = useState(false);
    const [nbNotifications, setNbNotifications] = useState(0);
    const [historique, setHistorique] = useState([]);
    const [favoris, setFavoris] = useState([]);
    const [champActif, setChampActif] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [dateDepart, setDateDepart] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [prenom, setPrenom] = useState('');

    useEffect(() => {
        chargerDonnees();
    }, []);

    const chargerDonnees = async () => {
        try {
            const userId = await getUserId();
            if (!userId) return;
            const [notifRes, userRes, histData, favData] = await Promise.all([
                api.get(`/reservations/conducteur/${userId}/en-attente`),
                api.get(`/utilisateurs/${userId}`),
                AsyncStorage.getItem('clando_historique'),
                AsyncStorage.getItem('clando_favoris'),
            ]);
            setNbNotifications(notifRes.data.length);
            setPrenom(userRes.data.prenom || '');
            if (histData) setHistorique(JSON.parse(histData));
            if (favData) setFavoris(JSON.parse(favData));
        } catch {}
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
        } catch {}
    };

    const effacerHistorique = async () => {
        Alert.alert('Effacer', "Supprimer tout l'historique ?", [
            { text: 'Non', style: 'cancel' },
            { text: 'Oui', style: 'destructive', onPress: async () => {
                setHistorique([]);
                await AsyncStorage.removeItem('clando_historique');
            }}
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
        } catch {}
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

    const inverserVilles = () => {
        const temp = villeDepart;
        setVilleDepart(villeArrivee);
        setVilleArrivee(temp);
        setSuggestions([]);
        setChampActif(null);
    };

    const filtrerSuggestions = (texte) => {
        if (!texte || texte.length < 2) { setSuggestions([]); return; }
        const n = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        setSuggestions(QUARTIERS_CONAKRY.filter(q => n(q).includes(n(texte))).slice(0, 6));
    };

    const onChangeDepart = (texte) => { setVilleDepart(texte); setChampActif('depart'); filtrerSuggestions(texte); };
    const onChangeArrivee = (texte) => { setVilleArrivee(texte); setChampActif('arrivee'); filtrerSuggestions(texte); };

    const choisirSuggestion = (quartier) => {
        if (champActif === 'depart') setVilleDepart(quartier);
        else if (champActif === 'arrivee') setVilleArrivee(quartier);
        setChampActif(null);
        setSuggestions([]);
        Keyboard.dismiss();
    };

    const normaliser = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const rechercher = async () => {
        if (!villeDepart || !villeArrivee) {
            Alert.alert('Champs manquants', 'Veuillez saisir un point de départ et une destination.');
            return;
        }
        if (normaliser(villeDepart.trim()) === normaliser(villeArrivee.trim())) {
            Alert.alert('Erreur', "Le départ et l'arrivée ne peuvent pas être identiques.");
            return;
        }
        Keyboard.dismiss();
        setChampActif(null);
        setSuggestions([]);
        setLoading(true);
        try {
            const response = await api.get('/trajets/rechercher', {
                params: {
                    villeDepart: villeDepart.trim(),
                    villeArrivee: villeArrivee.trim(),
                    dateDepart: `${dateDepart.getFullYear()}-${String(dateDepart.getMonth() + 1).padStart(2, '0')}-${String(dateDepart.getDate()).padStart(2, '0')}`,
                    page: 0, size: 10
                }
            });
            await sauvegarderHistorique(villeDepart.trim(), villeArrivee.trim());
            if (response.data.content.length === 0) {
                Alert.alert('Aucun trajet trouvé', `Aucun trajet disponible de ${villeDepart} vers ${villeArrivee}.`);
            } else {
                navigation.navigate('Resultats', {
                    trajets: response.data.content,
                    villeDepart: villeDepart.trim(),
                    villeArrivee: villeArrivee.trim()
                });
            }
        } catch {
            Alert.alert('Erreur', 'Impossible de se connecter au serveur.');
        } finally {
            setLoading(false);
        }
    };

    const formatDateAffichage = (date) => {
        const aujourd = new Date();
        const demain = new Date();
        demain.setDate(aujourd.getDate() + 1);
        if (date.toDateString() === aujourd.toDateString()) return "Aujourd'hui";
        if (date.toDateString() === demain.toDateString()) return 'Demain';
        return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* ── Header ── */}
<View style={styles.header}>
    <View style={styles.headerRow}>
        <View>
            <Text style={styles.headerSalutation}>
                Bonjour{prenom ? `, ${prenom}` : ''} 👋
            </Text>
        </View>
        <TouchableOpacity
            style={styles.cloche}
            onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color={C.primary} />
            {nbNotifications > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{nbNotifications}</Text>
                </View>
            )}
        </TouchableOpacity>
    </View>

    {/* Question mise en avant */}
    <View style={styles.questionWrapper}>
        <Text style={styles.questionAccent}>Où souhaitez-vous</Text>
        <Text style={styles.questionAccent}>{"aller aujourd'hui ?"}</Text>
    </View>
</View>

                {/* ── Carte recherche ── */}
                <View style={styles.searchCard}>

                    {/* Départ */}
                    <View style={[styles.fieldRow, champActif === 'depart' && styles.fieldRowActif]}>
                        <View style={[styles.fieldIcone, { backgroundColor: C.primaryLight }]}>
                            <Ionicons name="location" size={20} color={C.primary} />
                        </View>
                        <View style={styles.fieldContent}>
                            <Text style={styles.fieldLabel}>DÉPART</Text>
                            <TextInput
                                style={styles.fieldInput}
                                placeholder="D'où partez-vous ?"
                                placeholderTextColor={C.textDisabled}
                                value={villeDepart}
                                onChangeText={onChangeDepart}
                                onFocus={() => { setChampActif('depart'); filtrerSuggestions(villeDepart); }}
                                autoCapitalize="words"
                            />
                        </View>
                        {villeDepart.length > 0 && (
                            <TouchableOpacity onPress={() => { setVilleDepart(''); setSuggestions([]); }}>
                                <Ionicons name="close-circle" size={18} color="#ccc" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {champActif === 'depart' && suggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                            {suggestions.map((q) => (
                                <TouchableOpacity key={q} style={styles.suggestionItem} onPress={() => choisirSuggestion(q)}>
                                    <Ionicons name="location-outline" size={14} color={C.primary} />
                                    <Text style={styles.suggestionTexte}>{q}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Swap */}
                    <View style={styles.separateur}>
                        <View style={styles.separateurLigne} />
                        <TouchableOpacity style={styles.swapBtn} onPress={inverserVilles}>
                            <Ionicons name="swap-vertical" size={18} color={C.primary} />
                        </TouchableOpacity>
                        <View style={styles.separateurLigne} />
                    </View>

                    {/* Arrivée */}
                    <View style={[styles.fieldRow, champActif === 'arrivee' && styles.fieldRowActif]}>
                        <View style={[styles.fieldIcone, { backgroundColor: '#F5F5F5' }]}>
                            <Ionicons name="location" size={20} color="#888" />
                        </View>
                        <View style={styles.fieldContent}>
                            <Text style={styles.fieldLabel}>ARRIVÉE</Text>
                            <TextInput
                                style={styles.fieldInput}
                                placeholder="Où allez-vous ?"
                                placeholderTextColor={C.textDisabled}
                                value={villeArrivee}
                                onChangeText={onChangeArrivee}
                                onFocus={() => { setChampActif('arrivee'); filtrerSuggestions(villeArrivee); }}
                                autoCapitalize="words"
                            />
                        </View>
                        {villeArrivee.length > 0 && (
                            <TouchableOpacity onPress={() => { setVilleArrivee(''); setSuggestions([]); }}>
                                <Ionicons name="close-circle" size={18} color="#ccc" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {champActif === 'arrivee' && suggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                            {suggestions.map((q) => (
                                <TouchableOpacity key={q} style={styles.suggestionItem} onPress={() => choisirSuggestion(q)}>
                                    <Ionicons name="location-outline" size={14} color={C.primary} />
                                    <Text style={styles.suggestionTexte}>{q}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View style={styles.separateurSimple} />

                    {/* Date */}
                    <TouchableOpacity style={styles.fieldRow} onPress={() => setShowDatePicker(true)}>
                        <View style={[styles.fieldIcone, { backgroundColor: '#F8F8F8' }]}>
                            <Ionicons name="calendar-outline" size={20} color="#888" />
                        </View>
                        <View style={styles.fieldContent}>
                            <Text style={styles.fieldLabel}>DATE</Text>
                            <Text style={styles.fieldInputText}>{formatDateAffichage(dateDepart)}</Text>
                        </View>
                        <Ionicons name="chevron-down" size={18} color="#ccc" />
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={dateDepart}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            minimumDate={new Date()}
                            themeVariant="light"
                            locale='fr'
                            onChange={(event, date) => {
                                setShowDatePicker(false);
                                if (date) setDateDepart(date);
                            }}
                        />
                    )}

                    {/* Bouton */}
                    <TouchableOpacity
                        style={[styles.searchButton, loading && { opacity: 0.7 }]}
                        onPress={rechercher}
                        disabled={loading}
                        activeOpacity={0.85}>
                        {loading
                            ? <ActivityIndicator size={20} color="white" />
                            : <>
                                <Ionicons name="search" size={18} color="white" />
                                <Text style={styles.searchButtonText}>Rechercher un trajet</Text>
                            </>
                        }
                    </TouchableOpacity>
                </View>

                {/* Recherches récentes */}
                {historique.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recherches récentes</Text>
                            <TouchableOpacity onPress={effacerHistorique}>
                                <Text style={styles.effacerText}>Tout effacer</Text>
                            </TouchableOpacity>
                        </View>
                        {historique.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.rechercheItem}
                                onPress={() => utiliserRecherche(item.depart, item.arrivee)}>
                                <View style={styles.rechercheIcone}>
                                    <Ionicons name="time-outline" size={16} color="#888" />
                                </View>
                                <View style={styles.rechercheInfo}>
                                    <Text style={styles.rechercheTexte}>{item.depart} → {item.arrivee}</Text>
                                    <Text style={styles.rechercheDate}>{item.date}</Text>
                                </View>
                                <View style={styles.rechercheActions}>
                                    <TouchableOpacity onPress={() => toggleFavori(item.depart, item.arrivee)} style={styles.actionBtn}>
                                        <Ionicons
                                            name={estFavori(item.depart, item.arrivee) ? "heart" : "heart-outline"}
                                            size={18}
                                            color={estFavori(item.depart, item.arrivee) ? C.primary : "#ccc"}
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => supprimerHistorique(item.id)} style={styles.actionBtn}>
                                        <Ionicons name="ellipsis-vertical" size={18} color="#ccc" />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Favoris */}
                {favoris.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Mes favoris</Text>
                        {favoris.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.rechercheItem}
                                onPress={() => utiliserRecherche(item.depart, item.arrivee)}>
                                <View style={[styles.rechercheIcone, { backgroundColor: C.primaryLight }]}>
                                    <Ionicons name="heart" size={16} color={C.primary} />
                                </View>
                                <View style={styles.rechercheInfo}>
                                    <Text style={styles.rechercheTexte}>{item.depart} → {item.arrivee}</Text>
                                </View>
                                <TouchableOpacity onPress={() => toggleFavori(item.depart, item.arrivee)} style={styles.actionBtn}>
                                    <Ionicons name="close" size={16} color="#ccc" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f9fd',
    },

    // ── Header ────────────────────────────────────────────
header: {
    backgroundColor: '#f7f9fd',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
},
headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
},

headerSalutation: {
    fontSize: 20,
    fontWeight: '600',
    color: C.textPrimary,
},
cloche: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primaryLight,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: C.primaryBorder,
},
badge: {
    position: 'absolute',
    top: 0, right: 0,
    backgroundColor: C.red,
    borderRadius: 10,
    minWidth: 16, height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
},
badgeText: { color: 'white', fontSize: 9, fontWeight: 'bold' },

// ── Question mise en avant ────────────────────────────
questionWrapper: {
    borderLeftWidth: 4,
    borderLeftColor: C.primary,
    paddingLeft: 12,
},

questionAccent: {
    fontSize: 22,
    fontWeight: '800',
    color: C.primary,
    lineHeight: 28,
},
    // ── Carte ─────────────────────────────────────────────
    searchCard: {
        backgroundColor: C.surface,
        marginHorizontal: spacing.lg,
        marginTop: 16,
        borderRadius: 20,
        paddingVertical: spacing.sm,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 16,
        elevation: 6,
        borderWidth: 1,
        borderColor: C.primaryBorder,
    },

    // ── Champs ────────────────────────────────────────────
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: 13,
        gap: 12,
        minHeight: BTN_HEIGHT,
    },
    fieldRowActif: { backgroundColor: '#F5F8FF' },
    fieldIcone: {
        width: 42,
        height: 42,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    fieldContent: { flex: 1 },
    fieldLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: C.primary,
        letterSpacing: 0.8,
        marginBottom: 2,
    },
    fieldInput: {
        fontSize: 15,
        color: C.textPrimary,
        fontWeight: '500',
        padding: 0,
    },
    fieldInputText: {
        fontSize: 15,
        color: C.textPrimary,
        fontWeight: '500',
    },

    // ── Swap ─────────────────────────────────────────────
    separateur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        marginVertical: 2,
    },
    separateurLigne: { flex: 1, height: 1, backgroundColor: C.separator },
    swapBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.primaryBorder,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 10,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    separateurSimple: {
        height: 1,
        backgroundColor: C.separator,
        marginHorizontal: spacing.lg,
    },

    // ── Bouton ────────────────────────────────────────────
    searchButton: {
        backgroundColor: C.primary,
        borderRadius: 14,
        height: BTN_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: spacing.lg,
        marginTop: 14,
        marginBottom: 6,
    },
    searchButtonText: { color: 'white', fontSize: 15, fontWeight: '700' },

    // ── Suggestions ───────────────────────────────────────
    suggestionsContainer: {
        backgroundColor: C.surface,
        marginHorizontal: spacing.lg,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: C.primaryBorder,
        marginBottom: 4,
        overflow: 'hidden',
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 11,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: C.separator,
    },
    suggestionTexte: { color: C.textPrimary, fontSize: 14 },

    // ── Sections ──────────────────────────────────────────
    section: { paddingHorizontal: spacing.lg, marginTop: 20 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#aaa',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    effacerText: { fontSize: 13, color: C.primary, fontWeight: '600' },
    rechercheItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: C.surface,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
        borderWidth: 1,
        borderColor: C.border,
    },
    rechercheIcone: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: C.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    rechercheInfo: { flex: 1 },
    rechercheTexte: { fontSize: 14, color: C.textPrimary, fontWeight: '500' },
    rechercheDate: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
    rechercheActions: { flexDirection: 'row', gap: 4 },
    actionBtn: { padding: 6 },
});