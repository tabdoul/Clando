import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';
import { getUserId } from '../services/auth.service';

export default function DocumentsScreen({ navigation }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(null);

    const typesDocuments = [
        {
            type: 'CNI',
            label: "Carte Nationale d'Identité",
            icon: 'card-outline',
            description: 'Recto et verso de votre CNI',
            requis: true
        },
        {
            type: 'PASSEPORT',
            label: 'Passeport',
            icon: 'book-outline',
            description: 'Page photo de votre passeport',
            requis: false
        },
        {
            type: 'PERMIS_CONDUIRE',
            label: 'Permis de conduire',
            icon: 'car-outline',
            description: 'Recto de votre permis (conducteurs)',
            requis: false
        },
        {
            type: 'CERTIFICAT_IMMATRICULATION',
            label: "Certificat d'immatriculation",
            icon: 'document-outline',
            description: 'Carte grise du véhicule (conducteurs)',
            requis: false
        }
    ];

    useEffect(() => {
        chargerDocuments();
    }, []);

    const chargerDocuments = async () => {
        try {
            const userId = await getUserId();
            if (!userId) return;
            const response = await api.get(`/documents/utilisateur/${userId}`);
            setDocuments(response.data);
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const getDocumentParType = (type) => {
        return documents.find(d => d.type === type);
    };

    const getStatutStyle = (statut) => {
        switch (statut) {
            case 'VALIDE': return { color: '#2ecc71', label: 'Validé ✓', bg: '#1a3a2a' };
            case 'REJETE': return { color: '#e74c3c', label: 'Rejeté', bg: '#3a1a1a' };
            case 'EN_ATTENTE': return { color: '#f39c12', label: 'En attente', bg: '#3a2a1a' };
            default: return { color: '#666', label: 'Non fourni', bg: '#2a2a2a' };
        }
    };

    const uploaderDocument = async (type) => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission refusée', 'Autorisez l\'accès à la galerie dans les paramètres');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (result.canceled) return;

        setUploading(type);
        try {
            const userId = await getUserId();
            const formData = new FormData();
            formData.append('utilisateurId', userId.toString());
            formData.append('type', type);
            formData.append('fichier', {
                uri: result.assets[0].uri,
                type: 'image/jpeg',
                name: `${type}_${userId}.jpg`
            });

            await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Alert.alert('Document envoyé !', 'Votre document est en cours de vérification.');
            chargerDocuments();
        } catch (error) {
            Alert.alert('Erreur', "Impossible d'envoyer le document");
        } finally {
            setUploading(null);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size={36} color="#00b5e2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#eee" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mes documents</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

                <View style={styles.infoCard}>
                    <Ionicons name="information-circle-outline" size={24} color="#00b5e2" />
                    <Text style={styles.infoText}>
                        Vos documents seront vérifiés sous 24-48h.
                        Un badge "Vérifié ✓" apparaîtra sur votre profil une fois validé.
                    </Text>
                </View>

                {typesDocuments.map((item) => {
                    const doc = getDocumentParType(item.type);
                    const statutStyle = doc ? getStatutStyle(doc.statut) : getStatutStyle(null);
                    const estUploading = uploading === item.type;

                    return (
                        <View key={item.type} style={styles.docCard}>
                            <View style={styles.docHeader}>
                                <View style={styles.docIconContainer}>
                                    <Ionicons name={item.icon} size={24} color="#00b5e2" />
                                </View>
                                <View style={styles.docInfo}>
                                    <View style={styles.docTitleRow}>
                                        <Text style={styles.docLabel}>{item.label}</Text>
                                        {item.requis && (
                                            <View style={styles.requisBadge}>
                                                <Text style={styles.requisText}>Requis</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.docDescription}>{item.description}</Text>
                                </View>
                            </View>

                            <View style={styles.docFooter}>
                                <View style={[styles.statutBadge, { backgroundColor: statutStyle.bg }]}>
                                    <Text style={[styles.statutText, { color: statutStyle.color }]}>
                                        {statutStyle.label}
                                    </Text>
                                </View>

                                {doc?.statut !== 'VALIDE' && (
                                    <TouchableOpacity
                                        style={[styles.boutonUpload, estUploading && { opacity: 0.7 }]}
                                        onPress={() => uploaderDocument(item.type)}
                                        disabled={estUploading}>
                                        {estUploading
                                            ? <ActivityIndicator size={20} color="white" />
                                            : <>
                                                <Ionicons name="cloud-upload-outline" size={16} color="white" />
                                                <Text style={styles.boutonUploadText}>
                                                    {doc ? 'Remplacer' : 'Envoyer'}
                                                </Text>
                                            </>
                                        }
                                    </TouchableOpacity>
                                )}
                            </View>

                            {doc?.statut === 'REJETE' && doc.commentaireAdmin && (
                                <View style={styles.commentaireCard}>
                                    <Text style={styles.commentaireLabel}>Motif du rejet :</Text>
                                    <Text style={styles.commentaireTexte}>{doc.commentaireAdmin}</Text>
                                </View>
                            )}
                        </View>
                    );
                })}

                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    loadingContainer: {
        flex: 1, backgroundColor: '#121212',
        justifyContent: 'center', alignItems: 'center'
    },
    header: {
        backgroundColor: '#1a1a1a',
        paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', gap: 16,
        borderBottomWidth: 1, borderBottomColor: '#2a2a2a',
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#eee' },
    infoCard: {
        backgroundColor: '#0a2a35', margin: 16, borderRadius: 12,
        padding: 16, flexDirection: 'row', gap: 12,
        borderWidth: 1, borderColor: '#00b5e2',
    },
    infoText: { fontSize: 13, color: '#aaa', flex: 1, lineHeight: 18 },
    docCard: {
        backgroundColor: '#1e1e1e', marginHorizontal: 16,
        marginBottom: 12, borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: '#2a2a2a',
    },
    docHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    docIconContainer: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#0a2a35', alignItems: 'center', justifyContent: 'center',
    },
    docInfo: { flex: 1 },
    docTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    docLabel: { fontSize: 14, fontWeight: '600', color: '#eee', flex: 1 },
    requisBadge: {
        backgroundColor: '#3a1a1a', borderRadius: 10,
        paddingVertical: 2, paddingHorizontal: 8,
    },
    requisText: { fontSize: 10, color: '#e74c3c', fontWeight: '600' },
    docDescription: { fontSize: 12, color: '#666' },
    docFooter: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
    },
    statutBadge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20 },
    statutText: { fontSize: 12, fontWeight: '600' },
    boutonUpload: {
        backgroundColor: '#00b5e2', borderRadius: 20,
        paddingVertical: 8, paddingHorizontal: 16,
        flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    boutonUploadText: { color: 'white', fontSize: 13, fontWeight: '600' },
    commentaireCard: {
        backgroundColor: '#3a1a1a', borderRadius: 8, padding: 10, marginTop: 10,
        borderWidth: 1, borderColor: '#e74c3c',
    },
    commentaireLabel: { fontSize: 11, color: '#e74c3c', fontWeight: '600', marginBottom: 4 },
    commentaireTexte: { fontSize: 13, color: '#aaa' },
});