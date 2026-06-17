import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { getUserId } from '../services/auth.service';

export default function AideScreen({ navigation }) {
    const [typeSelectionne, setTypeSelectionne] = useState(null);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [onglet, setOnglet] = useState('faq');
    const [mesSignalements, setMesSignalements] = useState([]);
    const [loadingSignalements, setLoadingSignalements] = useState(false);
    const [faqOuverte, setFaqOuverte] = useState(null);

    const types = [
        { key: 'PROBLEME_TECHNIQUE', label: 'Problème technique', icon: 'construct-outline', color: '#00b5e2' },
        { key: 'COMPORTEMENT_INAPPROPRIE', label: 'Comportement inapproprié', icon: 'warning-outline', color: '#e74c3c' },
        { key: 'ARNAQUE', label: 'Arnaque', icon: 'shield-outline', color: '#e74c3c' },
        { key: 'TRAJET_ANNULE', label: 'Trajet annulé injustement', icon: 'car-outline', color: '#f39c12' },
        { key: 'AUTRE', label: 'Autre', icon: 'help-circle-outline', color: '#888' },
    ];

    const faq = [
        {
            question: "Comment réserver un trajet ?",
            reponse: "Recherchez votre destination, cliquez sur un trajet et appuyez sur Réserver. Le conducteur recevra votre demande."
        },
        {
            question: "Comment négocier le prix ?",
            reponse: "Lors de la réservation, vous pouvez proposer un prix différent. Vous avez droit à 2 tentatives de négociation."
        },
        {
            question: "Comment annuler une réservation ?",
            reponse: "Dans l'onglet Réservations, cliquez sur Annuler sur la réservation concernée."
        },
        {
            question: "Comment laisser un avis ?",
            reponse: "5h après le départ du trajet, vous pouvez laisser un avis en cliquant sur le profil du conducteur."
        },
        {
            question: "Comment devenir conducteur ?",
            reponse: "Publiez un trajet depuis l'onglet Publier. Ajoutez d'abord votre véhicule dans votre profil."
        },
    ];

    const chargerMesSignalements = async () => {
        setLoadingSignalements(true);
        try {
            const userId = await getUserId();
            const response = await api.get(`/signalements/utilisateur/${userId}`);
            setMesSignalements(response.data);
        } catch (error) {
            console.log('Erreur signalements');
        } finally {
            setLoadingSignalements(false);
        }
    };

    const envoyer = async () => {
        if (!typeSelectionne) {
            Alert.alert('Erreur', 'Veuillez sélectionner un type de problème');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Erreur', 'Veuillez décrire votre problème');
            return;
        }

        setLoading(true);
        try {
            const userId = await getUserId();
            await api.post('/signalements', null, {
                params: {
                    utilisateurId: userId,
                    type: typeSelectionne,
                    description: description.trim()
                }
            });
            Alert.alert(
                'Signalement envoyé !',
                'Notre équipe va examiner votre signalement et vous répondra dans les plus brefs délais.',
                [{ text: 'OK', onPress: () => {
                    setTypeSelectionne(null);
                    setDescription('');
                    setOnglet('mes-signalements');
                    chargerMesSignalements();
                }}]
            );
        } catch (error) {
            Alert.alert('Erreur', "Impossible d'envoyer le signalement");
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
                <Text style={styles.headerTitle}>Aide & Support</Text>
            </View>

            {/* Onglets */}
            <View style={styles.onglets}>
                <TouchableOpacity
                    style={[styles.onglet, onglet === 'faq' && styles.ongletActif]}
                    onPress={() => setOnglet('faq')}>
                    <Text style={[styles.ongletText, onglet === 'faq' && styles.ongletTextActif]}>FAQ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.onglet, onglet === 'signaler' && styles.ongletActif]}
                    onPress={() => setOnglet('signaler')}>
                    <Text style={[styles.ongletText, onglet === 'signaler' && styles.ongletTextActif]}>Signaler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.onglet, onglet === 'mes-signalements' && styles.ongletActif]}
                    onPress={() => { setOnglet('mes-signalements'); chargerMesSignalements(); }}>
                    <Text style={[styles.ongletText, onglet === 'mes-signalements' && styles.ongletTextActif]}>
                        Mes signalements
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

                {/* FAQ */}
                {onglet === 'faq' && (
                    <View style={styles.section}>
                        {faq.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.faqItem}
                                onPress={() => setFaqOuverte(faqOuverte === index ? null : index)}>
                                <View style={styles.faqHeader}>
                                    <Text style={styles.faqQuestion}>{item.question}</Text>
                                    <Ionicons
                                        name={faqOuverte === index ? "chevron-up" : "chevron-down"}
                                        size={18} color="#666" />
                                </View>
                                {faqOuverte === index && (
                                    <Text style={styles.faqReponse}>{item.reponse}</Text>
                                )}
                            </TouchableOpacity>
                        ))}

                        <View style={styles.contactCard}>
                            <Ionicons name="mail-outline" size={24} color="#00b5e2" />
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactTitre}>Nous contacter</Text>
                                <Text style={styles.contactDetail}>support@clando.africa</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Signaler */}
                {onglet === 'signaler' && (
                    <View style={styles.section}>
                        <Text style={styles.fieldLabel}>Type de problème</Text>
                        {types.map((item) => (
                            <TouchableOpacity
                                key={item.key}
                                style={[
                                    styles.typeItem,
                                    typeSelectionne === item.key && styles.typeItemSelected
                                ]}
                                onPress={() => setTypeSelectionne(item.key)}>
                                <Ionicons
                                    name={item.icon} size={20}
                                    color={typeSelectionne === item.key ? item.color : '#666'} />
                                <Text style={[
                                    styles.typeLabel,
                                    typeSelectionne === item.key && { color: item.color }
                                ]}>
                                    {item.label}
                                </Text>
                                {typeSelectionne === item.key && (
                                    <Ionicons name="checkmark-circle" size={18} color={item.color} />
                                )}
                            </TouchableOpacity>
                        ))}

                        <Text style={styles.fieldLabel}>Description</Text>
                        <TextInput
                            style={styles.descriptionInput}
                            placeholder="Décrivez votre problème en détail..."
                            placeholderTextColor="#666"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={5}
                        />

                        <TouchableOpacity
                            style={[styles.boutonEnvoyer, loading && { opacity: 0.7 }]}
                            onPress={envoyer}
                            disabled={loading}>
                            {loading
                                ? <ActivityIndicator size={20} color="white" />
                                : <>
                                    <Ionicons name="send-outline" size={18} color="white" />
                                    <Text style={styles.boutonEnvoyerText}>Envoyer le signalement</Text>
                                </>
                            }
                        </TouchableOpacity>
                    </View>
                )}

                {/* Mes signalements */}
                {onglet === 'mes-signalements' && (
                    <View style={styles.section}>
                        {loadingSignalements && (
                            <ActivityIndicator size={36} color="#00b5e2" style={{ marginTop: 20 }} />
                        )}
                        {!loadingSignalements && mesSignalements.length === 0 && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="checkmark-circle-outline" size={48} color="#444" />
                                <Text style={styles.emptyText}>Aucun signalement</Text>
                            </View>
                        )}
                        {mesSignalements.map((s) => (
                            <View key={s.id.toString()} style={styles.signalementCard}>
                                <View style={styles.signalementHeader}>
                                    <View style={[
                                        styles.statutBadge,
                                        s.statut === 'RESOLU' ? styles.badgeVert : styles.badgeOrange
                                    ]}>
                                        <Text style={[
                                            styles.statutText,
                                            { color: s.statut === 'RESOLU' ? '#2ecc71' : '#f39c12' }
                                        ]}>
                                            {s.statut === 'RESOLU' ? 'Résolu ✓' : 'En attente'}
                                        </Text>
                                    </View>
                                    <Text style={styles.signalementDate}>
                                        {new Date(s.dateSignalement).toLocaleDateString('fr-FR')}
                                    </Text>
                                </View>
                                <Text style={styles.signalementDescription}>{s.description}</Text>
                                {s.reponseAdmin && (
                                    <View style={styles.reponseCard}>
                                        <Text style={styles.reponseLabel}>
                                            Réponse de l'équipe Clando :
                                        </Text>
                                        <Text style={styles.reponseTexte}>{s.reponseAdmin}</Text>
                                    </View>
                                )}
                            </View>
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
        paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', gap: 16,
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#eee' },
    onglets: {
        flexDirection: 'row', backgroundColor: '#1a1a1a',
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
    },
    onglet: {
        flex: 1, paddingVertical: 14, alignItems: 'center',
        borderBottomWidth: 2, borderBottomColor: 'transparent',
    },
    ongletActif: { borderBottomColor: '#00b5e2' },
    ongletText: { fontSize: 13, color: '#666', fontWeight: '600' },
    ongletTextActif: { color: '#00b5e2' },
    section: { paddingHorizontal: 16, marginTop: 16 },
    faqItem: {
        backgroundColor: '#1e1e1e', borderRadius: 12, padding: 14,
        marginBottom: 8, borderWidth: 1, borderColor: '#2a2a2a',
    },
    faqHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    faqQuestion: { fontSize: 14, fontWeight: '600', color: '#ddd', flex: 1, marginRight: 8 },
    faqReponse: { fontSize: 13, color: '#888', marginTop: 10, lineHeight: 20 },
    fieldLabel: {
        fontSize: 12, fontWeight: '600', color: '#888',
        textTransform: 'uppercase', letterSpacing: 1,
        marginBottom: 8, marginTop: 16,
    },
    typeItem: {
        backgroundColor: '#1e1e1e', borderRadius: 10, padding: 14,
        marginBottom: 8, flexDirection: 'row', alignItems: 'center',
        gap: 12, borderWidth: 1, borderColor: '#2a2a2a',
    },
    typeItemSelected: { borderColor: '#00b5e2', backgroundColor: '#0a2a35' },
    typeLabel: { fontSize: 14, color: '#888', flex: 1 },
    descriptionInput: {
        backgroundColor: '#1e1e1e', borderRadius: 12, padding: 14,
        color: '#eee', fontSize: 14, borderWidth: 1, borderColor: '#2a2a2a',
        minHeight: 120, textAlignVertical: 'top',
    },
    boutonEnvoyer: {
        backgroundColor: '#00b5e2', borderRadius: 12, padding: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, marginTop: 16,
    },
    boutonEnvoyerText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
    contactCard: {
        backgroundColor: '#1e1e1e', borderRadius: 12, padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderWidth: 1, borderColor: '#2a2a2a', marginTop: 16,
    },
    contactInfo: { flex: 1 },
    contactTitre: { fontSize: 14, fontWeight: '600', color: '#eee' },
    contactDetail: { fontSize: 13, color: '#888', marginTop: 2 },
    emptyContainer: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 14, color: '#666', marginTop: 10 },
    signalementCard: {
        backgroundColor: '#1e1e1e', borderRadius: 12, padding: 14,
        marginBottom: 10, borderWidth: 1, borderColor: '#2a2a2a',
    },
    signalementHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 8,
    },
    statutBadge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20 },
    badgeVert: { backgroundColor: '#1a3a2a' },
    badgeOrange: { backgroundColor: '#3a2a1a' },
    statutText: { fontSize: 11, fontWeight: '600' },
    signalementDate: { fontSize: 12, color: '#666' },
    signalementDescription: { fontSize: 13, color: '#aaa', lineHeight: 18 },
    reponseCard: {
        backgroundColor: '#0a2a35', borderRadius: 8, padding: 10,
        marginTop: 10, borderWidth: 1, borderColor: '#00b5e2',
    },
    reponseLabel: { fontSize: 11, color: '#00b5e2', fontWeight: '600', marginBottom: 4 },
    reponseTexte: { fontSize: 13, color: '#aaa', lineHeight: 18 },
});