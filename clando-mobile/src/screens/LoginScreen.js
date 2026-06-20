import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
    KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { login, fetchUtilisateurByEmail } from '../services/auth.service';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        console.log('handleLogin appelé');
        console.log('email:', email);
        console.log('motDePasse:', motDePasse);

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
            console.log('Erreur login:', error.response?.data);
            console.log('Status:', error.response?.status);
            console.log('Message:', error.message);
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
                    <Text style={styles.title}>Clando</Text>
                    <Text style={styles.subtitle}>Covoiturage en Guinée</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="exemple@gmail.com"
                        placeholderTextColor="#999"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Mot de passe</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#999"
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
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#00b5e2',
        letterSpacing: 3,
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        marginTop: 4,
    },
    form: {
        backgroundColor: '#1e1e1e',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#aaa',
        marginBottom: 6,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#2a2a2a',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#252525',
        color: '#eee',
    },
    button: {
        backgroundColor: '#00b5e2',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkButton: {
        alignItems: 'center',
        marginTop: 16,
    },
    linkText: { color: '#888', fontSize: 14 },
    link: { color: '#00b5e2', fontWeight: '600' },
});