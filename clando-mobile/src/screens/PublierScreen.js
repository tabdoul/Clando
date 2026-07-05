import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator,
    Platform, Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../services/api';
import { getUserId } from '../services/auth.service';
import { QUARTIERS_CONAKRY } from '../../constants/QUARTIERS_CONAKRY';
import { colors, spacing, radius, shadows } from '../../constants/theme';

export default function PublierScreen({ navigation }) {
    const [villeDepart, setVilleDepart] = useState('');
    const [villeArrivee, setVilleArrivee] = useState('');
    const [dateDepart, setDateDepart] = useState(null);
    const [heure, setHeure] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [prix, setPrix] = useState('');
    const [places, setPlaces] = useState('');
    const [itineraire, setItineraire] = useState('');
    const [vehicules, setVehicules] = useState([]);
    const [vehiculeSelectionne, setVehiculeSelectionne] = useState(null);
    const [showNouveauVehicule, setShowNouveauVehicule] = useState(false);
    const [marque, setMarque] = useState('');
    const [modele, setModele] = useState('');
    const [immatriculation, setImmatriculation] = useState('');
    const [nbPlaces, setNbPlaces] = useState('');
    const [loading, setLoading] = useState(false);
    const [femmesUniquement, setFemmesUniquement] = useState(false);
    const [utilisateur, setUtilisateur] = useState(null);
    const [champActif, setChampActif] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [trajetsRecents, setTrajetsRecents] = useState([]);

    const itineraires = ['Autoroute', 'Route du Prince', 'Corniche'];

    useEffect(() => {
        chargerDonnees();
    }, []);

    const chargerDonnees = async () => {
        try {
            const userId = await getUserId();
            if (!userId) return;
            const [vehiculesRes, userRes, trajetsRes] = await Promise.all([
                api.get(`/vehicules/conducteur/${userId}`),
                api.get(`/utilisateurs/${userId}`),
                api.get(`/trajets/conducteur/${userId}`)
            ]);
            setVehicules(vehiculesRes.data);
            setUtilisateur(userRes.data);
            if (vehiculesRes.data.length > 0) setVehiculeSelectionne(vehiculesRes.data[0]);

            // ✅ Trajets récents uniques (départ/arrivée)
            const vus = new Set();
            const recents = trajetsRes.data
                .sort((a, b) => new Date(b.dateHeureDepart) - new Date(a.dateHeureDepart))
                .filter(t => {
                    const cle = `${t.villeDepart}-${t.villeArrivee}`;
                    if (vus.has(cle)) return false;
                    vus.add(cle);
                    return true;
                })
                .slice(0, 3);
            setTrajetsRecents(recents);
        } catch (error) {}
    };

    const reutiliserTrajet = (trajet) => {
        setVilleDepart(trajet.villeDepart);
        setVilleArrivee(trajet.villeArrivee);
        setPrix(trajet.prixConducteur?.toString() || '');
        setPlaces(trajet.placesDisponibles?.toString() || '');
        setItineraire(trajet.itineraire || '');
        if (trajet.vehiculeId) {
            const v = vehicules.find(v => v.id === trajet.vehiculeId);
            if (v) setVehiculeSelectionne(v);
        }
    };

    const filtrerSuggestions = (texte) => {
        if (!texte || texte.length < 2) { setSuggestions([]); return; }
        const normalise = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        setSuggestions(QUARTIERS_CONAKRY.filter(q => normalise(q).includes(normalise(texte))).slice(0, 6));
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

    const ajouterVehicule = async () => {
        if (!marque || !modele || !immatriculation || !nbPlaces) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs du vehicule');
            return;
        }
        try {
            const userId = await getUserId();
            const response = await api.post('/vehicules', {
                marque, modele, immatriculation,
                nbPlaces: parseInt(nbPlaces),
                conducteurId: userId
            });
            setVehiculeSelectionne(response.data);
            setShowNouveauVehicule(false);
            setMarque(''); setModele(''); setImmatriculation(''); setNbPlaces('');
            chargerDonnees();
            Alert.alert('Vehicule ajoute !');
        } catch (error) {
            Alert.alert('Erreur', "Impossible d'ajouter le vehicule");
        }
    };

    const publier = async () => {
        if (!villeDepart || !villeArrivee || !dateDepart || !heure || !prix || !places) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
            return;
        }
        if (!vehiculeSelectionne) {
            Alert.alert('Erreur', 'Veuillez selectionner un vehicule');
            return;
        }
        setLoading(true);
        try {
            const userId = await getUserId();
            const date = new Date(dateDepart);
            date.setHours(heure.getHours(), heure.getMinutes(), 0);
            const pad = (n) => n.toString().padStart(2, '0');
            const dateFormatee = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;

            await api.post('/trajets', {
                villeDepart, villeArrivee,
                dateHeureDepart: dateFormatee,
                prix: parseFloat(prix),
                placesDisponibles: parseInt(places),
                itineraire,
                conducteurId: userId,
                vehiculeId: vehiculeSelectionne.id,
                femmesUniquement
            });

            Alert.alert('Trajet publie !', 'Votre trajet est maintenant disponible.', [{
                text: 'OK',
                onPress: () => {
                    setVilleDepart(''); setVilleArrivee('');
                    setDateDepart(null); setHeure(null);
                    setPrix(''); setPlaces(''); setItineraire('');
                    setFemmesUniquement(false);
                    setVehiculeSelectionne(vehicules.length > 0 ? vehicules[0] : null);
                    chargerDonnees();
                }
            }]);
        } catch (error) {
            const message = error.response?.data?.erreur || 'Erreur lors de la publication';
            if (message.includes('permis') || message.includes("identit")) {
                Alert.alert('Documents requis',
                    "Vous devez avoir un permis de conduire et une piece d'identite valides pour publier un trajet.",
                    [
                        { text: 'Annuler', style: 'cancel' },
                        { text: 'Mes documents', onPress: () => navigation.navigate('Documents') }
                    ]
                );
            } else {
                Alert.alert('Erreur', message);
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Choisir une date';
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const formatHeure = (date) => {
        if (!date) return 'Choisir une heure';
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Publier un trajet</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">

                {/* ✅ Trajets récents */}
                {trajetsRecents.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Reprendre un trajet récent</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.recentsRow}>
                                {trajetsRecents.map((t) => (
                                    <TouchableOpacity
                                        key={t.id.toString()}
                                        style={styles.recentCard}
                                        onPress={() => reutiliserTrajet(t)}>
                                        <View style={styles.recentRoute}>
                                            <View style={styles.recentDot} />
                                            <View style={styles.recentLigne} />
                                            <Ionicons name="car" size={14} color={colors.primary} />
                                            <View style={styles.recentLigne} />
                                            <View style={[styles.recentDot, { backgroundColor: colors.accent }]} />
                                        </View>
                                        <Text style={styles.recentVilles} numberOfLines={1}>
                                            {t.villeDepart} → {t.villeArrivee}
                                        </Text>
                                        <Text style={styles.recentPrix}>
                                            {t.prixConducteur?.toLocaleString()} GNF
                                        </Text>
                                        <View style={styles.recentBtnContainer}>
                                            <Text style={styles.recentBtn}>Réutiliser</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )}

                {/* Informations du trajet */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informations du trajet</Text>
                    <View style={styles.card}>

                        {/* Depart */}
                        <Text style={styles.fieldLabel}>Départ</Text>
                        <View style={[styles.inputContainer, champActif === 'depart' && styles.inputContainerActif]}>
                            <Ionicons name="radio-button-on" size={16} color={colors.primary} />
                            <TextInput
                                style={styles.input}
                                placeholder="Quartier de départ"
                                placeholderTextColor={colors.textDisabled}
                                value={villeDepart}
                                onChangeText={onChangeDepart}
                                onFocus={() => { setChampActif('depart'); filtrerSuggestions(villeDepart); }}
                                autoCapitalize="words"
                            />
                            {villeDepart.length > 0 && (
                                <TouchableOpacity onPress={() => { setVilleDepart(''); setSuggestions([]); }}>
                                    <Ionicons name="close-circle" size={18} color={colors.textDisabled} />
                                </TouchableOpacity>
                            )}
                        </View>
                        {champActif === 'depart' && suggestions.length > 0 && (
                            <View style={styles.suggestionsContainer}>
                                {suggestions.map((q) => (
                                    <TouchableOpacity key={q} style={styles.suggestionItem} onPress={() => choisirSuggestion(q)}>
                                        <Ionicons name="location-outline" size={14} color={colors.primary} />
                                        <Text style={styles.suggestionTexte}>{q}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Arrivee */}
                        <Text style={styles.fieldLabel}>Arrivée</Text>
                        <View style={[styles.inputContainer, champActif === 'arrivee' && styles.inputContainerActif]}>
                            <Ionicons name="location" size={16} color={colors.accent} />
                            <TextInput
                                style={styles.input}
                                placeholder="Quartier d'arrivée"
                                placeholderTextColor={colors.textDisabled}
                                value={villeArrivee}
                                onChangeText={onChangeArrivee}
                                onFocus={() => { setChampActif('arrivee'); filtrerSuggestions(villeArrivee); }}
                                autoCapitalize="words"
                            />
                            {villeArrivee.length > 0 && (
                                <TouchableOpacity onPress={() => { setVilleArrivee(''); setSuggestions([]); }}>
                                    <Ionicons name="close-circle" size={18} color={colors.textDisabled} />
                                </TouchableOpacity>
                            )}
                        </View>
                        {champActif === 'arrivee' && suggestions.length > 0 && (
                            <View style={styles.suggestionsContainer}>
                                {suggestions.map((q) => (
                                    <TouchableOpacity key={q} style={styles.suggestionItem} onPress={() => choisirSuggestion(q)}>
                                        <Ionicons name="location-outline" size={14} color={colors.primary} />
                                        <Text style={styles.suggestionTexte}>{q}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Date */}
                        <Text style={styles.fieldLabel}>Date de départ</Text>
                        <TouchableOpacity
                            style={styles.inputContainer}
                            onPress={() => { Keyboard.dismiss(); setChampActif(null); setSuggestions([]); setShowDatePicker(true); }}>
                            <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                            <Text style={[styles.input, !dateDepart && styles.placeholder]}>
                                {formatDate(dateDepart)}
                            </Text>
                            <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
                        </TouchableOpacity>

                        {/* Heure */}
                        <Text style={styles.fieldLabel}>Heure de départ</Text>
                        <TouchableOpacity
                            style={styles.inputContainer}
                            onPress={() => { setChampActif(null); setSuggestions([]); setShowTimePicker(true); }}>
                            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                            <Text style={[styles.input, !heure && styles.placeholder]}>
                                {formatHeure(heure)}
                            </Text>
                            <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={dateDepart || new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                minimumDate={new Date()}
                                themeVariant="light"
                                onChange={(event, date) => { setShowDatePicker(false); if (date) setDateDepart(date); }}
                            />
                        )}
                        {showTimePicker && (
                            <DateTimePicker
                                value={heure || new Date()}
                                mode="time"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                themeVariant="light"
                                onChange={(event, date) => { setShowTimePicker(false); if (date) setHeure(date); }}
                            />
                        )}

                        {/* Prix et places */}
                        <View style={styles.row}>
                            <View style={styles.halfField}>
                                <Text style={styles.fieldLabel}>Prix (GNF)</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="cash-outline" size={16} color={colors.textMuted} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="50000"
                                        placeholderTextColor={colors.textDisabled}
                                        value={prix}
                                        onChangeText={setPrix}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                            <View style={styles.halfField}>
                                <Text style={styles.fieldLabel}>Places</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="people-outline" size={16} color={colors.textMuted} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="3"
                                        placeholderTextColor={colors.textDisabled}
                                        value={places}
                                        onChangeText={setPlaces}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Itineraire */}
                        <Text style={styles.fieldLabel}>Itinéraire (optionnel)</Text>
                        <View style={styles.itineraireContainer}>
                            {itineraires.map((it) => (
                                <TouchableOpacity
                                    key={it}
                                    style={[styles.itineraireBadge, itineraire === it && styles.itineraireBadgeSelected]}
                                    onPress={() => setItineraire(itineraire === it ? '' : it)}>
                                    <Text style={[styles.itineraireBadgeText, itineraire === it && styles.itineraireBadgeTextSelected]}>
                                        {it}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Femmes uniquement */}
                        {utilisateur?.genre === 'FEMME' && (
                            <TouchableOpacity
                                style={styles.femmesUniquementContainer}
                                onPress={() => setFemmesUniquement(!femmesUniquement)}>
                                <View style={[styles.checkbox, femmesUniquement && styles.checkboxActif]}>
                                    {femmesUniquement && <Ionicons name="checkmark" size={14} color="white" />}
                                </View>
                                <Text style={styles.femmesUniquementText}>Trajet femmes uniquement</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Vehicule */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Véhicule</Text>
                    <View style={styles.vehiculesGrid}>
                        {vehicules.map((v) => (
                            <TouchableOpacity
                                key={v.id.toString()}
                                style={[styles.vehiculeCard, vehiculeSelectionne?.id === v.id && styles.vehiculeCardSelected]}
                                onPress={() => setVehiculeSelectionne(v)}>
                                <Ionicons
                                    name="car-outline"
                                    size={28}
                                    color={vehiculeSelectionne?.id === v.id ? colors.primary : colors.textMuted}
                                />
                                <Text style={[styles.vehiculeNom, vehiculeSelectionne?.id === v.id && { color: colors.primary }]}>
                                    {v.marque} {v.modele}
                                </Text>
                                <Text style={styles.vehiculeImmat}>{v.immatriculation}</Text>
                                {vehiculeSelectionne?.id === v.id && (
                                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={{ marginTop: 4 }} />
                                )}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={styles.ajouterVehiculeCard}
                            onPress={() => setShowNouveauVehicule(!showNouveauVehicule)}>
                            <Ionicons name="add-circle-outline" size={28} color={colors.accent} />
                            <Text style={styles.ajouterVehiculeText}>Ajouter</Text>
                        </TouchableOpacity>
                    </View>

                    {showNouveauVehicule && (
                        <View style={styles.card}>
                            {[
                                { label: 'Marque', value: marque, set: setMarque, placeholder: 'Toyota' },
                                { label: 'Modèle', value: modele, set: setModele, placeholder: 'Corolla' },
                                { label: 'Immatriculation', value: immatriculation, set: setImmatriculation, placeholder: 'GN-1234-A' },
                                { label: 'Nombre de places', value: nbPlaces, set: setNbPlaces, placeholder: '4', numeric: true },
                            ].map((item) => (
                                <View key={item.label}>
                                    <Text style={styles.fieldLabel}>{item.label}</Text>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder={item.placeholder}
                                            placeholderTextColor={colors.textDisabled}
                                            value={item.value}
                                            onChangeText={item.set}
                                            keyboardType={item.numeric ? 'numeric' : 'default'}
                                        />
                                    </View>
                                </View>
                            ))}
                            <TouchableOpacity style={styles.boutonAjouter} onPress={ajouterVehicule}>
                                <Text style={styles.boutonAjouterText}>Enregistrer le véhicule</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Bouton publier */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={[styles.boutonPublier, loading && { opacity: 0.7 }]}
                        onPress={publier}
                        disabled={loading}>
                        {loading
                            ? <ActivityIndicator size={20} color="white" />
                            : <>
                                <Ionicons name="paper-plane-outline" size={20} color="white" />
                                <Text style={styles.boutonPublierText}>Publier le trajet</Text>
                            </>
                        }
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        backgroundColor: '#182D5A',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: spacing.xl,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    section: {
        paddingHorizontal: spacing.lg,
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#888888',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: '#EEF2F7',
        shadowColor: '#182D5A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#182D5A',
        marginBottom: 6,
        marginTop: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EEF2F7',
        borderRadius: radius.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: 2,
        backgroundColor: '#FAFAFA',
        gap: 10,
    },
    inputContainerActif: {
        borderColor: '#182D5A',
        borderWidth: 1.5,
        backgroundColor: '#EEF2F7',
    },
    input: {
        flex: 1,
        padding: 10,
        fontSize: 15,
        color: '#1a1a1a',
    },
    placeholder: {
        color: '#cccccc',
    },
    suggestionsContainer: {
        backgroundColor: '#ffffff',
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: '#EEF2F7',
        marginTop: 4,
        overflow: 'hidden',
        shadowColor: '#182D5A',
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
        borderBottomColor: '#EEF2F7',
    },
    suggestionTexte: {
        color: '#1a1a1a',
        fontSize: 14,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfField: { flex: 1 },
    itineraireContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    itineraireBadge: {
        borderWidth: 1,
        borderColor: '#EEF2F7',
        borderRadius: radius.full,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#FAFAFA',
    },
    itineraireBadgeSelected: {
        borderColor: '#182D5A',
        backgroundColor: '#EEF2F7',
    },
    itineraireBadgeText: {
        color: '#888888',
        fontSize: 13,
    },
    itineraireBadgeTextSelected: {
        color: '#182D5A',
        fontWeight: '600',
    },
    femmesUniquementContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 16,
        padding: 12,
        backgroundColor: '#f3e5f5',
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: '#9b59b6',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#EEF2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActif: {
        backgroundColor: '#9b59b6',
        borderColor: '#9b59b6',
    },
    femmesUniquementText: {
        fontSize: 14,
        color: '#9b59b6',
        fontWeight: '600',
        flex: 1,
    },
    vehiculesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 12,
    },
    vehiculeCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EEF2F7',
        minWidth: '45%',
        flex: 1,
        shadowColor: '#182D5A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    vehiculeCardSelected: {
        borderColor: '#182D5A',
        backgroundColor: '#EEF2F7',
    },
    vehiculeNom: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1a1a1a',
        marginTop: 6,
        textAlign: 'center',
    },
    vehiculeImmat: {
        fontSize: 11,
        color: '#888888',
        marginTop: 2,
    },
    ajouterVehiculeCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EEF2F7',
        borderStyle: 'dashed',
        minWidth: '45%',
        flex: 1,
        justifyContent: 'center',
    },
    ajouterVehiculeText: {
        color: '#182D5A',
        fontSize: 13,
        marginTop: 6,
    },
    boutonAjouter: {
        backgroundColor: '#182D5A',
        borderRadius: radius.sm,
        padding: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    boutonAjouterText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    boutonPublier: {
        backgroundColor: '#182D5A',
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    boutonPublierText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // ── Trajets récents ───────────────────────────────────
    recentsRow: {
        flexDirection: 'row',
        gap: 12,
        paddingBottom: 4,
    },
    recentCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#EEF2F7',
        minWidth: 180,
        shadowColor: '#182D5A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    recentRoute: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    recentDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#182D5A',
    },
    recentLigne: {
        flex: 1,
        height: 1,
        backgroundColor: '#EEF2F7',
        maxWidth: 24,
    },
    recentVilles: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    recentPrix: {
        fontSize: 12,
        color: '#182D5A',
        fontWeight: '700',
        marginBottom: 10,
    },
    recentBtnContainer: {
        backgroundColor: '#EEF2F7',
        borderRadius: radius.full,
        paddingVertical: 6,
        paddingHorizontal: 12,
        alignSelf: 'flex-start',
    },
    recentBtn: {
        fontSize: 12,
        color: '#182D5A',
        fontWeight: '600',
    },
});