// ForgotPasswordScreen.js
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { colors, spacing, radius, shadows } from '../../constants/theme';

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const envoyer = async () => {
        if (!email || !email.includes('@')) {
            Alert.alert('Erreur', 'Veuillez saisir une adresse email valide');
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            Alert.alert(
                'Email envoyé !',
                `Un code de vérification a été envoyé à ${email}`,
                [{
                    text: 'Continuer',
                    onPress: () => navigation.navigate('ResetPassword', { email })
                }]
            );
        } catch (error) {
            Alert.alert('Erreur', error.response?.data?.erreur || 'Impossible d\'envoyer le code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mot de passe oublié</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="lock-open-outline" size={48} color={colors.primary} />
                </View>

                <Text style={styles.titre}>Réinitialiser votre mot de passe</Text>
                <Text style={styles.description}>
                    Saisissez votre adresse email. Nous vous enverrons un code de vérification à 6 chiffres.
                </Text>

                <View style={styles.card}>
                    <Text style={styles.fieldLabel}>Adresse email</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                        <TextInput
                            style={styles.input}
                            placeholder="exemple@gmail.com"
                            placeholderTextColor={colors.textDisabled}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {email.length > 0 && (
                            <TouchableOpacity onPress={() => setEmail('')}>
                                <Ionicons name="close-circle" size={18} color={colors.textDisabled} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.bouton, loading && { opacity: 0.7 }]}
                        onPress={envoyer}
                        disabled={loading}>
                        {loading
                            ? <ActivityIndicator size={20} color="white" />
                            : <>
                                <Ionicons name="send-outline" size={18} color="white" />
                                <Text style={styles.boutonTexte}>Envoyer le code</Text>
                            </>
                        }
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.retourConnexion}
                    onPress={() => navigation.navigate('Login')}>
                    <Ionicons name="arrow-back-outline" size={16} color={colors.primary} />
                    <Text style={styles.retourConnexionTexte}>Retour à la connexion</Text>
                </TouchableOpacity>
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
        paddingHorizontal: 8,
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
        marginBottom: 8,
    },
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
        marginBottom: 20,
    },
    input: {
        flex: 1,
        padding: 12,
        fontSize: 15,
        color: colors.textPrimary,
    },
    bouton: {
        backgroundColor: colors.accent,
        borderRadius: radius.sm,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    boutonTexte: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    retourConnexion: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 24,
    },
    retourConnexionTexte: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});