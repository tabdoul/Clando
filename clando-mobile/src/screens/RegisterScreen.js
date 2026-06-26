import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
    KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import api from '../services/api';

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
                        placeholder=""
                        placeholderTextColor="#999"
                        value={nom}
                        onChangeText={setNom}
                    />

                    <Text style={styles.label}>Prénom *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder=""
                        placeholderTextColor="#999"
                        value={prenom}
                        onChangeText={setPrenom}
                    />

                    <Text style={styles.label}>Email *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="exemple@gmail.com"
                        placeholderTextColor="#999"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Mot de passe *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Minimum 6 caractères"
                        placeholderTextColor="#999"
                        value={motDePasse}
                        onChangeText={setMotDePasse}
                        secureTextEntry
                    />

                    <Text style={styles.label}>Téléphone</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="620000000"
                        placeholderTextColor="#999"
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
    container: { flex: 1, backgroundColor: '#121212' },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    header: { alignItems: 'center', marginBottom: 32 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#00b5e2' },
    form: { backgroundColor: '#1e1e1e', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#2a2a2a' },
    label: { fontSize: 14, fontWeight: '600', color: '#aaa', marginBottom: 6, marginTop: 12 },
    input: {
        borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 8,
        padding: 12, fontSize: 16, backgroundColor: '#252525', color: '#eee',
    },
    genreContainer: { flexDirection: 'row', gap: 12, marginTop: 4 },
    genreBouton: {
        flex: 1, padding: 14, borderRadius: 10,
        borderWidth: 1, borderColor: '#2a2a2a',
        backgroundColor: '#252525', alignItems: 'center',
    },
    genreBoutonActif: { borderColor: '#00b5e2', backgroundColor: '#0a2a35' },
    genreTexte: { fontSize: 15, color: '#888', fontWeight: '600' },
    genreTexteActif: { color: '#00b5e2' },
    button: {
        backgroundColor: '#00b5e2', borderRadius: 8,
        padding: 16, alignItems: 'center', marginTop: 24,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    linkButton: { alignItems: 'center', marginTop: 16 },
    linkText: { color: '#888', fontSize: 14 },
    link: { color: '#00b5e2', fontWeight: '600' },
});