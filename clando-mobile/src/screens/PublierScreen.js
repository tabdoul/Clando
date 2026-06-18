import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../services/api';
import { getUserId } from '../services/auth.service';

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

    const itineraires = ['Autoroute', 'Route du Prince', 'Corniche'];

    useEffect(() => {
        chargerVehicules();
    }, []);

    const chargerVehicules = async () => {
        try {
            const userId = await getUserId();
            if (!userId) return;
            const response = await api.get(`/vehicules/conducteur/${userId}`);
            setVehicules(response.data);
            if (response.data.length > 0) {
                setVehiculeSelectionne(response.data[0]);
            }
        } catch (error) {
        }
    };

    const ajouterVehicule = async () => {
        if (!marque || !modele || !immatriculation || !nbPlaces) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs du véhicule');
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
            chargerVehicules();
            Alert.alert('Véhicule ajouté !');
        } catch (error) {
            Alert.alert('Erreur', "Impossible d'ajouter le véhicule");
        }
    };

    const publier = async () => {
        if (!villeDepart || !villeArrivee || !dateDepart || !heure || !prix || !places) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
            return;
        }
        if (!vehiculeSelectionne) {
            Alert.alert('Erreur', 'Veuillez sélectionner un véhicule');
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
                villeDepart,
                villeArrivee,
                dateHeureDepart: dateFormatee,
                prix: parseFloat(prix),
                placesDisponibles: parseInt(places),
                itineraire,
                conducteurId: userId,
                vehiculeId: vehiculeSelectionne.id
            });

            Alert.alert('Trajet publié !', 'Votre trajet est maintenant disponible.', [
                {
                    text: 'OK',
                    onPress: () => {
                        setVilleDepart('');
                        setVilleArrivee('');
                        setDateDepart(null);
                        setHeure(null);
                        setPrix('');
                        setPlaces('');
                        setItineraire('');
                        setVehiculeSelectionne(vehicules.length > 0 ? vehicules[0] : null);
                    }
                }
            ]);
        } catch (error) {
    const message = error.response?.data?.erreur || 'Erreur lors de la publication';
    if (message.includes('permis') || message.includes("d'identit")) {
        Alert.alert(
            'Documents requis',
            "Vous devez avoir un permis de conduire et une pièce d'identité validés pour publier un trajet.",
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
            setLoading(false);
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

            <ScrollView showsVerticalScrollIndicator={false}>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informations du trajet</Text>
                    <View style={styles.card}>

                        <Text style={styles.fieldLabel}>Départ</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="location-outline" size={18} color="#888" />
                            <TextInput
                                style={styles.input}
                                placeholder="Ville de départ"
                                placeholderTextColor="#666"
                                value={villeDepart}
                                onChangeText={setVilleDepart}
                            />
                        </View>

                        <Text style={styles.fieldLabel}>Arrivée</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="location" size={18} color="#888" />
                            <TextInput
                                style={styles.input}
                                placeholder="Ville d'arrivée"
                                placeholderTextColor="#666"
                                value={villeArrivee}
                                onChangeText={setVilleArrivee}
                            />
                        </View>

                        <Text style={styles.fieldLabel}>Date de départ</Text>
                        <TouchableOpacity
                            style={styles.inputContainer}
                            onPress={() => setShowDatePicker(true)}>
                            <Ionicons name="calendar-outline" size={18} color="#888" />
                            <Text style={[styles.input, !dateDepart && styles.placeholder]}>
                                {formatDate(dateDepart)}
                            </Text>
                        </TouchableOpacity>

                        <Text style={styles.fieldLabel}>Heure de départ</Text>
                        <TouchableOpacity
                            style={styles.inputContainer}
                            onPress={() => setShowTimePicker(true)}>
                            <Ionicons name="time-outline" size={18} color="#888" />
                            <Text style={[styles.input, !heure && styles.placeholder]}>
                                {formatHeure(heure)}
                            </Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={dateDepart || new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                minimumDate={new Date()}
                                themeVariant="dark"
                                onChange={(event, date) => {
                                    setShowDatePicker(false);
                                    if (date) setDateDepart(date);
                                }}
                            />
                        )}

                        {showTimePicker && (
                            <DateTimePicker
                                value={heure || new Date()}
                                mode="time"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                themeVariant="dark"
                                onChange={(event, date) => {
                                    setShowTimePicker(false);
                                    if (date) setHeure(date);
                                }}
                            />
                        )}

                        <View style={styles.row}>
                            <View style={styles.halfField}>
                                <Text style={styles.fieldLabel}>Prix (GNF)</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="cash-outline" size={18} color="#888" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="50000"
                                        placeholderTextColor="#666"
                                        value={prix}
                                        onChangeText={setPrix}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.halfField}>
                                <Text style={styles.fieldLabel}>Places</Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="people-outline" size={18} color="#888" />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="3"
                                        placeholderTextColor="#666"
                                        value={places}
                                        onChangeText={setPlaces}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        </View>

                        <Text style={styles.fieldLabel}>Itinéraire (optionnel)</Text>
                        <View style={styles.itineraireContainer}>
                            {itineraires.map((it) => (
                                <TouchableOpacity
                                    key={it}
                                    style={[
                                        styles.itineraireBadge,
                                        itineraire === it && styles.itineraireBadgeSelected
                                    ]}
                                    onPress={() => setItineraire(itineraire === it ? '' : it)}>
                                    <Text style={[
                                        styles.itineraireBadgeText,
                                        itineraire === it && styles.itineraireBadgeTextSelected
                                    ]}>
                                        {it}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Véhicule</Text>

                    <View style={styles.vehiculesGrid}>
                        {vehicules.map((v) => (
                            <TouchableOpacity
                                key={v.id.toString()}
                                style={[
                                    styles.vehiculeCard,
                                    vehiculeSelectionne?.id === v.id && styles.vehiculeCardSelected
                                ]}
                                onPress={() => setVehiculeSelectionne(v)}>
                                <Ionicons name="car-outline" size={28} color={vehiculeSelectionne?.id === v.id ? '#00b5e2' : '#666'} />
                                <Text style={[styles.vehiculeNom, vehiculeSelectionne?.id === v.id && { color: '#00b5e2' }]}>
                                    {v.marque} {v.modele}
                                </Text>
                                <Text style={styles.vehiculeImmat}>{v.immatriculation}</Text>
                                {vehiculeSelectionne?.id === v.id && (
                                    <Ionicons name="checkmark-circle" size={18} color="#00b5e2" style={{ marginTop: 4 }} />
                                )}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.ajouterVehiculeCard}
                            onPress={() => setShowNouveauVehicule(!showNouveauVehicule)}>
                            <Ionicons name="add-circle-outline" size={28} color="#00b5e2" />
                            <Text style={styles.ajouterVehiculeText}>Ajouter</Text>
                        </TouchableOpacity>
                    </View>

                    {showNouveauVehicule && (
                        <View style={styles.card}>
                            <Text style={styles.fieldLabel}>Marque</Text>
                            <View style={styles.inputContainer}>
                                <TextInput style={styles.input} placeholder="Toyota" placeholderTextColor="#666" value={marque} onChangeText={setMarque} />
                            </View>
                            <Text style={styles.fieldLabel}>Modèle</Text>
                            <View style={styles.inputContainer}>
                                <TextInput style={styles.input} placeholder="Corolla" placeholderTextColor="#666" value={modele} onChangeText={setModele} />
                            </View>
                            <Text style={styles.fieldLabel}>Immatriculation</Text>
                            <View style={styles.inputContainer}>
                                <TextInput style={styles.input} placeholder="GN-1234-A" placeholderTextColor="#666" value={immatriculation} onChangeText={setImmatriculation} />
                            </View>
                            <Text style={styles.fieldLabel}>Nombre de places</Text>
                            <View style={styles.inputContainer}>
                                <TextInput style={styles.input} placeholder="4" placeholderTextColor="#666" value={nbPlaces} onChangeText={setNbPlaces} keyboardType="numeric" />
                            </View>
                            <TouchableOpacity style={styles.boutonAjouter} onPress={ajouterVehicule}>
                                <Text style={styles.boutonAjouterText}>Enregistrer le véhicule</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

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
    container: { flex: 1, backgroundColor: '#121212' },
    header: {
        backgroundColor: '#1a1a1a',
        paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#eee' },
    section: { paddingHorizontal: 16, marginTop: 20 },
    sectionTitle: {
        fontSize: 13, fontWeight: '600', color: '#888',
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
    },
    card: {
        backgroundColor: '#1e1e1e', borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: '#2a2a2a',
    },
    fieldLabel: {
        fontSize: 12, fontWeight: '600', color: '#888',
        marginBottom: 6, marginTop: 12,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', borderWidth: 1,
        borderColor: '#2a2a2a', borderRadius: 10, paddingHorizontal: 12,
        paddingVertical: 4, backgroundColor: '#252525', gap: 10,
    },
    input: { flex: 1, padding: 10, fontSize: 15, color: '#eee' },
    placeholder: { color: '#666' },
    row: { flexDirection: 'row', gap: 12 },
    halfField: { flex: 1 },
    itineraireContainer: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4,
    },
    itineraireBadge: {
        borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 20,
        paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#252525',
    },
    itineraireBadgeSelected: { borderColor: '#00b5e2', backgroundColor: '#0a2a35' },
    itineraireBadgeText: { color: '#888', fontSize: 13 },
    itineraireBadgeTextSelected: { color: '#00b5e2', fontWeight: '600' },
    vehiculesGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12,
    },
    vehiculeCard: {
        backgroundColor: '#1e1e1e', borderRadius: 12, padding: 14,
        alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a',
        minWidth: '45%', flex: 1,
    },
    vehiculeCardSelected: { borderColor: '#00b5e2', backgroundColor: '#0a2a35' },
    vehiculeNom: { fontSize: 13, fontWeight: '600', color: '#ddd', marginTop: 6, textAlign: 'center' },
    vehiculeImmat: { fontSize: 11, color: '#666', marginTop: 2 },
    ajouterVehiculeCard: {
        backgroundColor: '#1e1e1e', borderRadius: 12, padding: 14,
        alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a',
        borderStyle: 'dashed', minWidth: '45%', flex: 1, justifyContent: 'center',
    },
    ajouterVehiculeText: { color: '#00b5e2', fontSize: 13, marginTop: 6 },
    boutonAjouter: {
        backgroundColor: '#00b5e2', borderRadius: 10,
        padding: 12, alignItems: 'center', marginTop: 12,
    },
    boutonAjouterText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
    boutonPublier: {
        backgroundColor: '#00b5e2', borderRadius: 14, padding: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    boutonPublierText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});