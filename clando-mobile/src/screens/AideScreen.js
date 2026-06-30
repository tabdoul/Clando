import React, { useState } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { getUserId } from '../services/auth.service';
import { colors, spacing, radius, shadows } from '../../constants/theme';

export default function AideScreen({ navigation }) {
    const [typeSelectionne, setTypeSelectionne] = useState(null);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [onglet, setOnglet] = useState('faq');
    const [mesSignalements, setMesSignalements] = useState([]);
    const [loadingSignalements, setLoadingSignalements] = useState(false);
    const [faqOuverte, setFaqOuverte] = useState(null);

    const types = [
        { key: 'PROBLEME_TECHNIQUE', label: 'Problème technique', icon: 'construct-outline', color: colors.primary },
        { key: 'COMPORTEMENT_INAPPROPRIE', label: 'Comportement inapproprié', icon: 'warning-outline', color: colors.red },
        { key: 'ARNAQUE', label: 'Arnaque', icon: 'shield-outline', color: colors.red },
        { key: 'TRAJET_ANNULE', label: 'Trajet annulé injustement', icon: 'car-outline', color: colors.orange },
        { key: 'AUTRE', label: 'Autre', icon: 'help-circle-outline', color: colors.textMuted },
    ];

    const faq = [
        {
            question: "Comment réserver un trajet ?",
            reponse: "Recherchez votre destination, cliquez sur un trajet et appuyez sur Réserver. Le conducteur recevra votre demande."
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
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Aide & Support</Text>
            </View>

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
                                        size={18} color={colors.textMuted} />
                                </View>
                                {faqOuverte === index && (
                                    <Text style={styles.faqReponse}>{item.reponse}</Text>
                                )}
                            </TouchableOpacity>
                        ))}

                        <View style={styles.contactCard}>
                            <Ionicons name="mail-outline" size={24} color={colors.primary} />
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactTitre}>Nous contacter</Text>
                                <Text style={styles.contactDetail}>support@wayvo.guinee</Text>
                            </View>
                        </View>
                    </View>
                )}

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
                                    color={typeSelectionne === item.key ? item.color : colors.textMuted} />
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
                            placeholderTextColor={colors.textDisabled}
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

                {onglet === 'mes-signalements' && (
                    <View style={styles.section}>
                        {loadingSignalements && (
                            <ActivityIndicator size={36} color={colors.primary} style={{ marginTop: 20 }} />
                        )}
                        {!loadingSignalements && mesSignalements.length === 0 && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="checkmark-circle-outline" size={48} color={colors.border} />
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
                                            { color: s.statut === 'RESOLU' ? colors.primary : '#e65100' }
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
                                            {"Réponse de l'équipe Wayvo :"}
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
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        backgroundColor: colors.primary,
        paddingTop: 60, paddingBottom: 20, paddingHorizontal: spacing.xl,
        flexDirection: 'row', alignItems: 'center', gap: 16,
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
    onglets: {
        flexDirection: 'row', backgroundColor: colors.surface,
        borderBottomWidth: 1, borderBottomColor: colors.separator,
    },
    onglet: {
        flex: 1, paddingVertical: 14, alignItems: 'center',
        borderBottomWidth: 2, borderBottomColor: 'transparent',
    },
    ongletActif: { borderBottomColor: colors.accent },
    ongletText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
    ongletTextActif: { color: colors.accent },
    section: { paddingHorizontal: spacing.lg, marginTop: 16 },
    faqItem: {
        backgroundColor: colors.surface, borderRadius: radius.md, padding: 14,
        marginBottom: 8, borderWidth: 1, borderColor: colors.border,
        ...shadows.card,
    },
    faqHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    faqQuestion: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, flex: 1, marginRight: 8 },
    faqReponse: { fontSize: 13, color: colors.textMuted, marginTop: 10, lineHeight: 20 },
    fieldLabel: {
        fontSize: 12, fontWeight: '600', color: colors.textMuted,
        textTransform: 'uppercase', letterSpacing: 1,
        marginBottom: 8, marginTop: 16,
    },
    typeItem: {
        backgroundColor: colors.surface, borderRadius: radius.sm, padding: 14,
        marginBottom: 8, flexDirection: 'row', alignItems: 'center',
        gap: 12, borderWidth: 1, borderColor: colors.border,
    },
    typeItemSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    typeLabel: { fontSize: 14, color: colors.textMuted, flex: 1 },
    descriptionInput: {
        backgroundColor: colors.surface, borderRadius: radius.md, padding: 14,
        color: colors.textPrimary, fontSize: 14, borderWidth: 1, borderColor: colors.border,
        minHeight: 120, textAlignVertical: 'top',
    },
    boutonEnvoyer: {
        backgroundColor: colors.accent, borderRadius: radius.md, padding: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, marginTop: 16,
    },
    boutonEnvoyerText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
    contactCard: {
        backgroundColor: colors.surface, borderRadius: radius.md, padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderWidth: 1, borderColor: colors.border, marginTop: 16,
        ...shadows.card,
    },
    contactInfo: { flex: 1 },
    contactTitre: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    contactDetail: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    emptyContainer: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 14, color: colors.textMuted, marginTop: 10 },
    signalementCard: {
        backgroundColor: colors.surface, borderRadius: radius.md, padding: 14,
        marginBottom: 10, borderWidth: 1, borderColor: colors.border,
    },
    signalementHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 8,
    },
    statutBadge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20 },
    badgeVert: { backgroundColor: colors.greenLight },
    badgeOrange: { backgroundColor: colors.orangeLight },
    statutText: { fontSize: 11, fontWeight: '600' },
    signalementDate: { fontSize: 12, color: colors.textMuted },
    signalementDescription: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    reponseCard: {
        backgroundColor: colors.primaryLight, borderRadius: 8, padding: 10,
        marginTop: 10, borderWidth: 1, borderColor: colors.primary,
    },
    reponseLabel: { fontSize: 11, color: colors.primary, fontWeight: '600', marginBottom: 4 },
    reponseTexte: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
});