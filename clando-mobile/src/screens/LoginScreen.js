import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
    KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { login, fetchUtilisateurByEmail } from '../services/auth.service';
import { colors, spacing, radius, shadows } from '../../constants/theme';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !motDePasse) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }
        setLoading(true);
        try {
            await login(email, motDePasse);
            await fetchUtilisateurByEmail(email);
            navigation.replace('Main');
        } catch (error) {
            Alert.alert('Erreur', 'Email ou mot de passe incorrect');
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
                    <Text style={styles.title}>Wayvo</Text>
                    <Text style={styles.subtitle}>Partagez votre route, simplifiez votre quotidien</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="exemple@gmail.com"
                        placeholderTextColor={colors.textDisabled}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Mot de passe</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor={colors.textDisabled}
                        value={motDePasse}
                        onChangeText={setMotDePasse}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}>
                        {loading
                            ? <ActivityIndicator size={20} color="white" />
                            : <Text style={styles.buttonText}>Se connecter</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.linkText}>
                            Pas encore de compte ?{' '}
                            <Text style={styles.link}>{"S'inscrire"}</Text>
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
    style={styles.forgotBtn}
    onPress={() => navigation.navigate('ForgotPassword')}>
    <Text style={styles.forgotTexte}>Mot de passe oublié ?</Text>
</TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor:'#ffffff' },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
    header: { alignItems: 'center', marginBottom: 40 },
    title: {
        fontSize: 36, fontWeight: 'bold',
        color: '#182D5A', letterSpacing: 3,
    },
    subtitle: { fontSize: 14, color:'#888888', marginTop: 6, textAlign: 'center' },
    form: {
        backgroundColor:'#ffffff', borderRadius:20,
        padding: spacing.xl, borderWidth: 1, borderColor: '#EEF2F7',
        ...shadows.card,
    },
    label: { 
        fontSize: 11, fontWeight: '700', color: '#182D5A', marginBottom: 6, marginTop: 12 , textTransform: 'uppercase', letterSpacing: 0.8,
},
    input: {
        borderWidth: 1, borderColor:'#EEF2F7', borderRadius: radius.sm,
        padding: 12, fontSize: 16,
        backgroundColor: colors.surfaceSecondary, color: colors.textPrimary,
    },
    button: {
        backgroundColor:'#182D5A', borderRadius: radius.sm,
        padding: 16, alignItems: 'center', marginTop: 24,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    linkButton: { alignItems: 'center', marginTop: 16 },
    linkText: { color: colors.textMuted, fontSize: 14 },
    link: { color: '#182D5A', fontWeight: '600' },
    forgotTexte: { 
    color: '#182D5A', 
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
},
});