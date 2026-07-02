// ResetPasswordScreen.js
import React, { useState, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { colors, spacing, radius, shadows } from '../../constants/theme';

export default function ResetPasswordScreen({ route, navigation }) {
    const { email } = route.params;
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
    const [confirmerMotDePasse, setConfirmerMotDePasse] = useState('');
    const [showMdp, setShowMdp] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [etape, setEtape] = useState(1); // 1 = code, 2 = nouveau mdp
    const inputs = useRef([]);

    const handleCodeChange = (valeur, index) => {
        const newCode = [...code];
        newCode[index] = valeur;
        setCode(newCode);
        if (valeur && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const verifierCode = async () => {
        const codeComplet = code.join('');
        if (codeComplet.length !== 6) {
            Alert.alert('Erreur', 'Veuillez saisir les 6 chiffres du code');
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/verify-reset-code', { email, code: codeComplet });
            setEtape(2);
        } catch (error) {
            Alert.alert('Erreur', error.response?.data?.erreur || 'Code incorrect');
        } finally {
            setLoading(false);
        }
    };

    const reinitialiser = async () => {
        if (!nouveauMotDePasse || nouveauMotDePasse.length < 6) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
            return;
        }
        if (nouveauMotDePasse !== confirmerMotDePasse) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/reset-password', {
                email,
                code: code.join(''),
                nouveauMotDePasse
            });
            Alert.alert(
                'Mot de passe modifié !',
                'Votre mot de passe a été réinitialisé avec succès.',
                [{
                    text: 'Se connecter',
                    onPress: () => navigation.navigate('Login')
                }]
            );
        } catch (error) {
            Alert.alert('Erreur', error.response?.data?.erreur || 'Impossible de réinitialiser');
        } finally {
            setLoading(false);
        }
    };

    const renvoyer = async () => {
        try {
            await api.post('/auth/forgot-password', { email });
            setCode(['', '', '', '', '', '']);
            Alert.alert('Code renvoyé !', `Un nouveau code a été envoyé à ${email}`);
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de renvoyer le code');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => etape === 1 ? navigation.goBack() : setEtape(1)}
                    style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {etape === 1 ? 'Vérification' : 'Nouveau mot de passe'}
                </Text>
            </View>

            <View style={styles.content}>

                {/* Étape 1 — Saisie du code */}
                {etape === 1 && (
                    <>
                        <View style={styles.iconContainer}>
                            <Ionicons name="mail-outline" size={48} color={colors.primary} />
                        </View>

                        <Text style={styles.titre}>Vérifiez votre email</Text>
                        <Text style={styles.description}>
                            Nous avons envoyé un code à 6 chiffres à{'\n'}
                            <Text style={styles.emailHighlight}>{email}</Text>
                        </Text>

                        <View style={styles.card}>
                            <Text style={styles.fieldLabel}>Code de vérification</Text>
                            <View style={styles.codeContainer}>
                                {code.map((c, index) => (
                                    <TextInput
                                        key={index}
                                        ref={ref => inputs.current[index] = ref}
                                        style={[styles.codeInput, c && styles.codeInputRempli]}
                                        value={c}
                                        onChangeText={val => handleCodeChange(val.replace(/[^0-9]/g, ''), index)}
                                        onKeyPress={e => handleKeyPress(e, index)}
                                        keyboardType="numeric"
                                        maxLength={1}
                                        textAlign="center"
                                        selectTextOnFocus
                                    />
                                ))}
                            </View>

                            <TouchableOpacity
                                style={[styles.bouton, loading && { opacity: 0.7 }]}
                                onPress={verifierCode}
                                disabled={loading}>
                                {loading
                                    ? <ActivityIndicator size={20} color="white" />
                                    : <>
                                        <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                                        <Text style={styles.boutonTexte}>Vérifier le code</Text>
                                    </>
                                }
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.renvoyerBtn} onPress={renvoyer}>
                                <Text style={styles.renvoyerTexte}>
                                    {"Vous n'avez pas reçu le code ?"}{' '}
                                    <Text style={styles.renvoyerLien}>Renvoyer</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {/* Étape 2 — Nouveau mot de passe */}
                {etape === 2 && (
                    <>
                        <View style={styles.iconContainer}>
                            <Ionicons name="lock-closed-outline" size={48} color={colors.primary} />
                        </View>

                        <Text style={styles.titre}>Nouveau mot de passe</Text>
                        <Text style={styles.description}>
                           {"Choisissez un mot de passe sécurisé d'au moins 6 caractères"} 
                        </Text>

                        <View style={styles.card}>
                            <Text style={styles.fieldLabel}>Nouveau mot de passe</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Minimum 6 caractères"
                                    placeholderTextColor={colors.textDisabled}
                                    value={nouveauMotDePasse}
                                    onChangeText={setNouveauMotDePasse}
                                    secureTextEntry={!showMdp}
                                />
                                <TouchableOpacity onPress={() => setShowMdp(!showMdp)}>
                                    <Ionicons
                                        name={showMdp ? 'eye-off-outline' : 'eye-outline'}
                                        size={18}
                                        color={colors.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>
                                Confirmer le mot de passe
                            </Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Répétez le mot de passe"
                                    placeholderTextColor={colors.textDisabled}
                                    value={confirmerMotDePasse}
                                    onChangeText={setConfirmerMotDePasse}
                                    secureTextEntry={!showConfirm}
                                />
                                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                                    <Ionicons
                                        name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                                        size={18}
                                        color={colors.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Indicateur de correspondance */}
                            {confirmerMotDePasse.length > 0 && (
                                <View style={styles.matchIndicator}>
                                    <Ionicons
                                        name={nouveauMotDePasse === confirmerMotDePasse ? 'checkmark-circle' : 'close-circle'}
                                        size={16}
                                        color={nouveauMotDePasse === confirmerMotDePasse ? colors.green : colors.red}
                                    />
                                    <Text style={{
                                        fontSize: 12,
                                        color: nouveauMotDePasse === confirmerMotDePasse ? colors.green : colors.red,
                                        marginLeft: 4,
                                    }}>
                                        {nouveauMotDePasse === confirmerMotDePasse
                                            ? 'Les mots de passe correspondent'
                                            : 'Les mots de passe ne correspondent pas'}
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.bouton, { marginTop: 20 }, loading && { opacity: 0.7 }]}
                                onPress={reinitialiser}
                                disabled={loading}>
                                {loading
                                    ? <ActivityIndicator size={20} color="white" />
                                    : <>
                                        <Ionicons name="save-outline" size={18} color="white" />
                                        <Text style={styles.boutonTexte}>Réinitialiser le mot de passe</Text>
                                    </>
                                }
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        backgroundColor: colors.primary,
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    content: {
        flex: 1,
        padding: spacing.xl,
        alignItems: 'center',
    },
    iconContainer: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
        marginBottom: 24,
    },
    titre: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    emailHighlight: {
        color: colors.primary,
        fontWeight: '600',
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
        width: '100%',
        ...shadows.card,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },

    // Code à 6 chiffres
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 20,
    },
    codeInput: {
        flex: 1,
        height: 52,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: radius.sm,
        fontSize: 22,
        fontWeight: '700',
        color: colors.textPrimary,
        backgroundColor: colors.surfaceSecondary,
        textAlign: 'center',
    },
    codeInputRempli: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },

    // Champs mot de passe
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: 2,
        backgroundColor: colors.surfaceSecondary,
        gap: 10,
        marginBottom: 4,
    },
    input: {
        flex: 1,
        padding: 12,
        fontSize: 15,
        color: colors.textPrimary,
    },
    matchIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        marginBottom: 4,
    },
    bouton: {
        backgroundColor: colors.accent,
        borderRadius: radius.sm,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
    },
    boutonTexte: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    renvoyerBtn: {
        alignItems: 'center',
        marginTop: 16,
    },
    renvoyerTexte: {
        fontSize: 13,
        color: colors.textMuted,
        textAlign: 'center',
    },
    renvoyerLien: {
        color: colors.primary,
        fontWeight: '600',
    },
});