import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal, { formatDate, formatHeure } from '../DateTimePickerModal';
import api from '../services/api';
import { getUserId } from '../services/auth.service';
import { QUARTIERS_CONAKRY } from '../../constants/QUARTIERS_CONAKRY';
import { spacing, radius } from '../../constants/theme';

const C = { primary: '#182D5A', primaryLight: '#EEF2F7', primaryBorder: '#D8E4F0', bg: '#ffffff', surface: '#FAFAFA', text: '#1a1a1a', muted: '#888888', disabled: '#cccccc', red: '#E52424', purple: '#9b59b6' };
const BTN_HEIGHT = 52;
const PRIX_MAX_CHIFFRES = 5;

const TYPES_VEHICULE = [
    { label: 'Moto', icon: 'bicycle-outline', placesMax: 1 },
    { label: 'Voiture', icon: 'car-outline', placesMax: 5 },
];

const formatMontant = (chiffres) => {
    if (!chiffres) return '';
    return chiffres.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const Champ = ({ label, children }) => (
    <View style={{ marginTop: 14 }}>
        <Text style={s.label}>{label}</Text>
        {children}
    </View>
);

const Suggestion = ({ items, onSelect }) => items.length === 0 ? null : (
    <View style={s.suggestBox}>
        {items.map(q => (
            <TouchableOpacity key={q} style={s.suggestItem} onPress={() => onSelect(q)}>
                <Ionicons name="location-outline" size={14} color={C.primary} />
                <Text style={s.suggestTxt}>{q}</Text>
            </TouchableOpacity>
        ))}
    </View>
);

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
    const [typeVehicule, setTypeVehicule] = useState('Voiture');
    const [loading, setLoading] = useState(false);
    const [femmesUniquement, setFemmesUniquement] = useState(false);
    const [utilisateur, setUtilisateur] = useState(null);
    const [champActif, setChampActif] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [trajetsRecents, setTrajetsRecents] = useState([]);

    const itineraires = ['Autoroute', 'Route du Prince', 'Corniche'];
    const placesMax = TYPES_VEHICULE.find(t => t.label === typeVehicule)?.placesMax || 5;

    useEffect(() => { chargerDonnees(); }, []);
    useEffect(() => { if (typeVehicule === 'Moto') { setPlaces('1'); setNbPlaces('1'); } }, [typeVehicule]);

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
            const vus = new Set();
            const recents = trajetsRes.data
                .sort((a, b) => new Date(b.dateHeureDepart) - new Date(a.dateHeureDepart))
                .filter(t => { const cle = `${t.villeDepart}-${t.villeArrivee}`; if (vus.has(cle)) return false; vus.add(cle); return true; })
                .slice(0, 3);
            setTrajetsRecents(recents);
        } catch {}
    };

    const reutiliserTrajet = (t) => {
        setVilleDepart(t.villeDepart); setVilleArrivee(t.villeArrivee);
        setPrix(t.prixConducteur ? Math.round(t.prixConducteur).toString().slice(0, PRIX_MAX_CHIFFRES) : ''); setPlaces(t.placesDisponibles?.toString() || '');
        setItineraire(t.itineraire || '');
        if (t.vehiculeId) { const v = vehicules.find(v => v.id === t.vehiculeId); if (v) setVehiculeSelectionne(v); }
    };

    const filtrerSuggestions = (texte) => {
        if (!texte || texte.length < 2) { setSuggestions([]); return; }
        const n = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        setSuggestions(QUARTIERS_CONAKRY.filter(q => n(q).includes(n(texte))).slice(0, 6));
    };

    const choisirSuggestion = (quartier) => {
        if (champActif === 'depart') setVilleDepart(quartier);
        else if (champActif === 'arrivee') setVilleArrivee(quartier);
        setChampActif(null); setSuggestions([]); Keyboard.dismiss();
    };

    const onChangePrix = (texte) => {
        const chiffres = texte.replace(/\D/g, '').slice(0, PRIX_MAX_CHIFFRES);
        setPrix(chiffres);
    };

    const onChangePlaces = (texte) => {
        const nb = parseInt(texte.replace(/\D/g, '')) || 0;
        if (nb > placesMax) { Alert.alert('Places limitées', `Maximum ${placesMax} place(s) pour une ${typeVehicule.toLowerCase()}`); setPlaces(placesMax.toString()); }
        else setPlaces(texte.replace(/\D/g, ''));
    };

    const onChangeNbPlaces = (texte) => {
        const nb = parseInt(texte.replace(/\D/g, '')) || 0;
        setNbPlaces(nb > placesMax ? placesMax.toString() : texte.replace(/\D/g, ''));
    };

    const ajouterVehicule = async () => {
        if (!marque || !modele || !immatriculation || !nbPlaces) { Alert.alert('Erreur', 'Veuillez remplir tous les champs du véhicule'); return; }
        try {
            const userId = await getUserId();
            const response = await api.post('/vehicules', { marque, modele, immatriculation, nbPlaces: parseInt(nbPlaces), conducteurId: userId });
            setVehiculeSelectionne(response.data); setShowNouveauVehicule(false);
            setMarque(''); setModele(''); setImmatriculation(''); setNbPlaces(''); setTypeVehicule('Voiture');
            chargerDonnees(); Alert.alert('Véhicule ajouté !');
        } catch { Alert.alert('Erreur', "Impossible d'ajouter le véhicule"); }
    };

    const publier = async () => {
        if (!villeDepart || !villeArrivee || !dateDepart || !heure || !prix || !places) { Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires'); return; }
        if (!vehiculeSelectionne) { Alert.alert('Erreur', 'Veuillez sélectionner un véhicule'); return; }
        setLoading(true);
        try {
            const userId = await getUserId();
            const date = new Date(dateDepart);
            date.setHours(heure.getHours(), heure.getMinutes(), 0);
            const pad = (n) => n.toString().padStart(2, '0');
            const dateFormatee = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
            await api.post('/trajets', { villeDepart, villeArrivee, dateHeureDepart: dateFormatee, prix: parseFloat(prix), placesDisponibles: parseInt(places), itineraire, conducteurId: userId, vehiculeId: vehiculeSelectionne.id, femmesUniquement });
            Alert.alert('Trajet publié !', 'Votre trajet est maintenant disponible.', [{ text: 'OK', onPress: () => { setVilleDepart(''); setVilleArrivee(''); setDateDepart(null); setHeure(null); setPrix(''); setPlaces(''); setItineraire(''); setFemmesUniquement(false); setVehiculeSelectionne(vehicules.length > 0 ? vehicules[0] : null); chargerDonnees(); } }]);
        } catch (error) {
            const message = error.response?.data?.erreur || 'Erreur lors de la publication';
            if (message.includes('permis') || message.includes("identit")) {
                Alert.alert('Documents requis', "Vous devez avoir un permis de conduire et une pièce d'identité valides.", [{ text: 'Annuler', style: 'cancel' }, { text: 'Mes documents', onPress: () => navigation.navigate('Documents') }]);
            } else { Alert.alert('Erreur', message); }
        } finally { setLoading(false); }
    };

    return (
        <View style={s.container}>
            <View style={s.header}>
                <Text style={s.headerTitle}>Publier un trajet</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">

                {trajetsRecents.length > 0 && (
                    <View style={s.section}>
                        <Text style={s.sectionTitle}>Trajets récents</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={{ flexDirection: 'row', gap: 12, paddingBottom: 4 }}>
                                {trajetsRecents.map(t => (
                                    <TouchableOpacity key={t.id.toString()} style={s.recentCard} onPress={() => reutiliserTrajet(t)}>
                                        <Text style={s.recentVilles} numberOfLines={1}>{t.villeDepart} → {t.villeArrivee}</Text>
                                        <Text style={s.recentPrix}>{t.prixConducteur?.toLocaleString()} GNF</Text>
                                        <View style={s.recentBtn}><Text style={s.recentBtnTxt}>Réutiliser</Text></View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                )}

                <View style={s.section}>
                    <Text style={s.sectionTitle}>Informations du trajet</Text>
                    <View style={s.card}>

                        <Champ label="Départ">
                            <View style={[s.field, champActif === 'depart' && s.fieldActif]}>
                                <Ionicons name="radio-button-on" size={16} color={C.primary} />
                                <TextInput style={s.input} placeholder="Quartier de départ" placeholderTextColor={C.disabled} value={villeDepart}
                                    onChangeText={t => { setVilleDepart(t); setChampActif('depart'); filtrerSuggestions(t); }}
                                    onFocus={() => { setChampActif('depart'); filtrerSuggestions(villeDepart); }} autoCapitalize="words" />
                                {villeDepart.length > 0 && <TouchableOpacity onPress={() => { setVilleDepart(''); setSuggestions([]); }}><Ionicons name="close-circle" size={18} color={C.disabled} /></TouchableOpacity>}
                            </View>
                            {champActif === 'depart' && <Suggestion items={suggestions} onSelect={choisirSuggestion} />}
                        </Champ>

                        <Champ label="Arrivée">
                            <View style={[s.field, champActif === 'arrivee' && s.fieldActif]}>
                                <Ionicons name="location" size={16} color={C.muted} />
                                <TextInput style={s.input} placeholder="Quartier d'arrivée" placeholderTextColor={C.disabled} value={villeArrivee}
                                    onChangeText={t => { setVilleArrivee(t); setChampActif('arrivee'); filtrerSuggestions(t); }}
                                    onFocus={() => { setChampActif('arrivee'); filtrerSuggestions(villeArrivee); }} autoCapitalize="words" />
                                {villeArrivee.length > 0 && <TouchableOpacity onPress={() => { setVilleArrivee(''); setSuggestions([]); }}><Ionicons name="close-circle" size={18} color={C.disabled} /></TouchableOpacity>}
                            </View>
                            {champActif === 'arrivee' && <Suggestion items={suggestions} onSelect={choisirSuggestion} />}
                        </Champ>

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.label}>Date</Text>
                                <TouchableOpacity style={s.field} onPress={() => { Keyboard.dismiss(); setChampActif(null); setSuggestions([]); setShowDatePicker(true); }}>
                                    <Ionicons name="calendar-outline" size={16} color={C.muted} />
                                    <Text style={[s.input, !dateDepart && { color: C.disabled }]}>{formatDate(dateDepart)}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.label}>Heure</Text>
                                <TouchableOpacity style={s.field} onPress={() => { setChampActif(null); setSuggestions([]); setShowTimePicker(true); }}>
                                    <Ionicons name="time-outline" size={16} color={C.muted} />
                                    <Text style={[s.input, !heure && { color: C.disabled }]}>{formatHeure(heure)}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <DateTimePickerModal visible={showDatePicker} mode="date" value={dateDepart} minimumDate={new Date()} onConfirm={setDateDepart} onClose={() => setShowDatePicker(false)} />
                        <DateTimePickerModal visible={showTimePicker} mode="time" value={heure} onConfirm={setHeure} onClose={() => setShowTimePicker(false)} />

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.label}>Prix (GNF)</Text>
                                <View style={s.field}>
                                    <Ionicons name="cash-outline" size={16} color={C.muted} />
                                    <TextInput
                                        style={s.input}
                                        value={formatMontant(prix)}
                                        onChangeText={onChangePrix}
                                        keyboardType="numeric"
                                        placeholder="10 000"
                                        placeholderTextColor={C.disabled}
                                        returnKeyType="done"
                                        onSubmitEditing={() => Keyboard.dismiss()}
                                    />
                                </View>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={s.label}>Places (max {placesMax})</Text>
                                <View style={s.field}>
                                    <Ionicons name="people-outline" size={16} color={C.muted} />
                                    <TextInput style={s.input} value={places} onChangeText={onChangePlaces} keyboardType="numeric" maxLength={1} returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />
                                </View>
                            </View>
                        </View>

                        <Champ label="Itinéraire (optionnel)">
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                                {itineraires.map(it => (
                                    <TouchableOpacity key={it} style={[s.badge, itineraire === it && s.badgeActif]} onPress={() => setItineraire(itineraire === it ? '' : it)}>
                                        <Text style={[s.badgeTxt, itineraire === it && s.badgeTxtActif]}>{it}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Champ>

                        {utilisateur?.genre === 'FEMME' && (
                            <TouchableOpacity style={s.femmesRow} onPress={() => setFemmesUniquement(!femmesUniquement)}>
                                <View style={[s.checkbox, femmesUniquement && s.checkboxActif]}>
                                    {femmesUniquement && <Ionicons name="checkmark" size={14} color="white" />}
                                </View>
                                <Text style={s.femmesTxt}>Trajet femmes uniquement</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={s.section}>
                    <Text style={s.sectionTitle}>Véhicule</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                        {vehicules.map(v => (
                            <TouchableOpacity key={v.id.toString()} style={[s.vehiculeCard, vehiculeSelectionne?.id === v.id && s.vehiculeCardActif]} onPress={() => setVehiculeSelectionne(v)}>
                                <Ionicons name="car-outline" size={26} color={vehiculeSelectionne?.id === v.id ? C.primary : C.muted} />
                                <Text style={[s.vehiculeNom, vehiculeSelectionne?.id === v.id && { color: C.primary }]}>{v.marque} {v.modele}</Text>
                                <Text style={s.vehiculeImmat}>{v.immatriculation}</Text>
                                {vehiculeSelectionne?.id === v.id && <Ionicons name="checkmark-circle" size={18} color={C.primary} style={{ marginTop: 4 }} />}
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={s.ajouterCard} onPress={() => setShowNouveauVehicule(!showNouveauVehicule)}>
                            <Ionicons name="add-circle-outline" size={26} color={C.primary} />
                            <Text style={s.ajouterTxt}>Ajouter</Text>
                        </TouchableOpacity>
                    </View>

                    {showNouveauVehicule && (
                        <View style={s.card}>
                            <Champ label="Type de véhicule">
                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                                    {TYPES_VEHICULE.map(t => (
                                        <TouchableOpacity key={t.label} style={[s.typeBtn, typeVehicule === t.label && s.typeBtnActif]} onPress={() => setTypeVehicule(t.label)}>
                                            <Ionicons name={t.icon} size={22} color={typeVehicule === t.label ? C.primary : C.muted} />
                                            <Text style={[s.typeTxt, typeVehicule === t.label && { color: C.primary }]}>{t.label}</Text>
                                            <Text style={s.typeMax}>max {t.placesMax}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </Champ>

                            {[
                                { label: 'Marque', value: marque, set: setMarque, placeholder: 'Toyota' },
                                { label: 'Modèle', value: modele, set: setModele, placeholder: 'Corolla' },
                                { label: 'Immatriculation', value: immatriculation, set: setImmatriculation, placeholder: 'GN-1234-A', caps: 'characters' },
                            ].map(item => (
                                <Champ key={item.label} label={item.label}>
                                    <View style={s.field}>
                                        <TextInput style={s.input} placeholder={item.placeholder} placeholderTextColor={C.disabled} value={item.value} onChangeText={item.set} autoCapitalize={item.caps || 'words'} />
                                    </View>
                                </Champ>
                            ))}

                            <Champ label={`Places (max ${placesMax})`}>
                                <View style={s.field}>
                                    <Ionicons name="people-outline" size={16} color={C.muted} />
                                    <TextInput style={s.input} placeholder={placesMax.toString()} placeholderTextColor={C.disabled} value={nbPlaces} onChangeText={onChangeNbPlaces} keyboardType="numeric" maxLength={1} returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()} />
                                </View>
                            </Champ>

                            <TouchableOpacity style={[s.btn, { marginTop: 16 }]} onPress={ajouterVehicule}>
                                <Text style={s.btnTxt}>Enregistrer le véhicule</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={[s.section, { marginBottom: 40 }]}>
                    <TouchableOpacity style={[s.btn, loading && { opacity: 0.7 }]} onPress={publier} disabled={loading}>
                        {loading ? <ActivityIndicator size={20} color="white" /> : <>
                            <Ionicons name="paper-plane-outline" size={20} color="white" />
                            <Text style={s.btnTxt}>Publier le trajet</Text>
                        </>}
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    header: { backgroundColor: '#182D5A', paddingTop: 60, paddingBottom: 20, paddingHorizontal: spacing.xl },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
    section: { paddingHorizontal: spacing.lg, marginTop: 20 },
    sectionTitle: { fontSize: 11, fontWeight: '700', color: '#888888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
    card: { backgroundColor: '#ffffff', borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: '#EEF2F7', shadowColor: '#182D5A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    label: { fontSize: 11, fontWeight: '700', color: '#182D5A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
    field: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EEF2F7', borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 2, backgroundColor: '#FAFAFA', gap: 10, minHeight: BTN_HEIGHT },
    fieldActif: { borderColor: '#182D5A', borderWidth: 1.5, backgroundColor: '#EEF2F7' },
    input: { flex: 1, fontSize: 15, color: '#1a1a1a', paddingVertical: 10 },
    suggestBox: { backgroundColor: '#ffffff', borderRadius: radius.sm, borderWidth: 1, borderColor: '#EEF2F7', marginTop: 4, overflow: 'hidden', shadowColor: '#182D5A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    suggestItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#EEF2F7' },
    suggestTxt: { color: '#1a1a1a', fontSize: 14 },
    badge: { borderWidth: 1, borderColor: '#EEF2F7', borderRadius: radius.full, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#FAFAFA' },
    badgeActif: { borderColor: '#182D5A', backgroundColor: '#EEF2F7' },
    badgeTxt: { color: '#888888', fontSize: 13 },
    badgeTxtActif: { color: '#182D5A', fontWeight: '600' },
    femmesRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, padding: 12, backgroundColor: '#f3e5f5', borderRadius: radius.sm, borderWidth: 1, borderColor: '#9b59b6' },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#EEF2F7', alignItems: 'center', justifyContent: 'center' },
    checkboxActif: { backgroundColor: '#9b59b6', borderColor: '#9b59b6' },
    femmesTxt: { fontSize: 14, color: '#9b59b6', fontWeight: '600', flex: 1 },
    vehiculeCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#EEF2F7', minWidth: '45%', flex: 1, shadowColor: '#182D5A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    vehiculeCardActif: { borderColor: '#182D5A', backgroundColor: '#EEF2F7' },
    vehiculeNom: { fontSize: 13, fontWeight: '600', color: '#1a1a1a', marginTop: 6, textAlign: 'center' },
    vehiculeImmat: { fontSize: 11, color: '#888888', marginTop: 2 },
    ajouterCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#EEF2F7', borderStyle: 'dashed', minWidth: '45%', flex: 1, justifyContent: 'center' },
    ajouterTxt: { color: '#182D5A', fontSize: 13, marginTop: 6 },
    typeBtn: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#EEF2F7', backgroundColor: '#FAFAFA', gap: 4 },
    typeBtnActif: { borderColor: '#182D5A', backgroundColor: '#EEF2F7' },
    typeTxt: { fontSize: 12, color: '#888888', fontWeight: '600' },
    typeMax: { fontSize: 10, color: '#aaaaaa' },
    recentCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#EEF2F7', minWidth: 180, shadowColor: '#182D5A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    recentVilles: { fontSize: 13, fontWeight: '600', color: '#1a1a1a', marginBottom: 4 },
    recentPrix: { fontSize: 12, color: '#182D5A', fontWeight: '700', marginBottom: 10 },
    recentBtn: { backgroundColor: '#EEF2F7', borderRadius: radius.full, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start' },
    recentBtnTxt: { fontSize: 12, color: '#182D5A', fontWeight: '600' },
    btn: { backgroundColor: '#182D5A', borderRadius: 14, height: BTN_HEIGHT, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    btnTxt: { color: 'white', fontSize: 15, fontWeight: '700' },
});