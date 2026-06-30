import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
    KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import api from '../services/api';
import { colors, spacing, radius, shadows } from '../../constants/theme';

export default function RegisterScreen({ navigation }) {
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [email, setEmail] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [telephone, setTelephone] = useState('');
    const [genre, setGenre] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!nom || !prenom || !email || !motDePasse || !genre) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
            return;
        }
        setLoading(true);
        try {
            await api.post('/utilisateurs', { nom, prenom, email, motDePasse, telephone, genre });
            Alert.alert('Compte créé !', 'Vous pouvez maintenant vous connecter.', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
        } catch (error) {
            Alert.alert('Erreur', 'Erreur lors de la création du compte');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.header}>
                    <Text style={styles.title}>Créer un compte</Text>
                </View>

                <View style={styles.form}>

                    <Text style={styles.label}>Nom *</Text>
                    <TextInput
                        style={styles.input}
                        placeholderTextColor={colors.textDisabled}
                        value={nom}
                        onChangeText={setNom}
                    />

                    <Text style={styles.label}>Prénom *</Text>
                    <TextInput
                        style={styles.input}
                        placeholderTextColor={colors.textDisabled}
                        value={prenom}
                        onChangeText={setPrenom}
                    />

                    <Text style={styles.label}>Email *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="exemple@gmail.com"
                        placeholderTextColor={colors.textDisabled}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Mot de passe *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Minimum 6 caractères"
                        placeholderTextColor={colors.textDisabled}
                        value={motDePasse}
                        onChangeText={setMotDePasse}
                        secureTextEntry
                    />

                    <Text style={styles.label}>Téléphone</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="620000000"
                        placeholderTextColor={colors.textDisabled}
                        value={telephone}
                        onChangeText={setTelephone}
                        keyboardType="phone-pad"
                    />

                    <Text style={styles.label}>Genre *</Text>
                    <View style={styles.genreContainer}>
                        <TouchableOpacity
                            style={[styles.genreBouton, genre === 'HOMME' && styles.genreBoutonActif]}
                            onPress={() => setGenre('HOMME')}>
                            <Text style={[styles.genreTexte, genre === 'HOMME' && styles.genreTexteActif]}>
                                Homme
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.genreBouton, genre === 'FEMME' && styles.genreBoutonActif]}
                            onPress={() => setGenre('FEMME')}>
                            <Text style={[styles.genreTexte, genre === 'FEMME' && styles.genreTexteActif]}>
                                Femme
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={loading}>
                        {loading
                            ? <ActivityIndicator size={20} color="white" />
                            : <Text style={styles.buttonText}>{"S'inscrire"}</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.linkText}>
                            Déjà un compte ?{' '}
                            <Text style={styles.link}>Se connecter</Text>
                        </Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
    header: { alignItems: 'center', marginBottom: 32 },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
    form: {
        backgroundColor: colors.surface, borderRadius: radius.lg,
        padding: spacing.xl, borderWidth: 1, borderColor: colors.border,
        ...shadows.card,
    },
    label: {
        fontSize: 14, fontWeight: '600', color: colors.textSecondary,
        marginBottom: 6, marginTop: 12,
    },
    input: {
        borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
        padding: 12, fontSize: 16,
        backgroundColor: colors.surfaceSecondary, color: colors.textPrimary,
    },
    genreContainer: { flexDirection: 'row', gap: 12, marginTop: 4 },
    genreBouton: {
        flex: 1, padding: 14, borderRadius: radius.sm,
        borderWidth: 1, borderColor: colors.border,
        backgroundColor: colors.surfaceSecondary, alignItems: 'center',
    },
    genreBoutonActif: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    genreTexte: { fontSize: 15, color: colors.textMuted, fontWeight: '600' },
    genreTexteActif: { color: colors.primary },
    button: {
        backgroundColor: colors.accent, borderRadius: radius.sm,
        padding: 16, alignItems: 'center', marginTop: 24,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    linkButton: { alignItems: 'center', marginTop: 16 },
    linkText: { color: colors.textMuted, fontSize: 14 },
    link: { color: colors.primary, fontWeight: '600' },
});