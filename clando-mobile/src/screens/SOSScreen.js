import React from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, Linking, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SOSScreen({ navigation }) {

    const urgences = [
        {
            id: 1,
            service: 'Police Nationale',
            numero: '117',
            description: 'En cas d\'agression, vol ou danger immédiat',
            icon: 'shield-outline',
            couleur: '#3498db'
        },
        {
            id: 2,
            service: 'Pompiers / SAMU',
            numero: '18',
            description: 'Accident, incendie ou urgence médicale',
            icon: 'medical-outline',
            couleur: '#e74c3c'
        },
        {
            id: 3,
            service: 'Gendarmerie Nationale',
            numero: '122',
            description: 'Zones périphériques et routes nationales',
            icon: 'car-outline',
            couleur: '#2ecc71'
        },
        {
            id: 4,
            service: 'SAMU Guinée',
            numero: '15',
            description: 'Urgences médicales et ambulances',
            icon: 'pulse-outline',
            couleur: '#e74c3c'
        },
        {
            id: 5,
            service: 'Orange Assistance',
            numero: '610',
            description: 'Assistance client Orange Money',
            icon: 'call-outline',
            couleur: '#f39c12'
        }
    ];

    const appeler = (numero, service) => {
        Alert.alert(
            `Appeler ${service}`,
            `Confirmer l'appel au ${numero} ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Appeler',
                    onPress: () => Linking.openURL(`tel:${numero}`)
                }
            ]
        );
    };

    return (
        <View style={styles.container}>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#eee" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Numéros durgence</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

                {/* Bannière SOS */}
                <View style={styles.sosBanner}>
                    <Ionicons name="warning-outline" size={32} color="white" />
                    <View style={styles.sosBannerText}>
                        <Text style={styles.sosBannerTitle}>{'En cas d\'urgence'}</Text>
                        <Text style={styles.sosBannerSubtitle}>
                            Appelez immédiatement les secours. Restez calme et donnez votre position.
                        </Text>
                    </View>
                </View>

                {/* Liste des numéros */}
                {urgences.map((item) => (
                    <View key={item.id} style={styles.cardWrapper}>
                        <View style={[styles.card, { borderLeftColor: item.couleur }]}>
                            <View style={styles.cardLeft}>
                                <View style={[styles.iconContainer, { backgroundColor: item.couleur + '22' }]}>
                                    <Ionicons name={item.icon} size={24} color={item.couleur} />
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardService}>{item.service}</Text>
                                    <Text style={styles.cardDescription}>{item.description}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={[styles.boutonAppeler, { backgroundColor: item.couleur }]}
                                onPress={() => appeler(item.numero, item.service)}>
                                <Ionicons name="call" size={16} color="white" />
                                <Text style={styles.boutonAppelerNumero}>{item.numero}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                {/* Conseil de sécurité */}
                <View style={styles.conseilContainer}>
                    <Text style={styles.conseilTitre}>Conseils de sécurité</Text>
                    <View style={styles.conseilItem}>
                        <Ionicons name="location-outline" size={16} color="#00b5e2" />
                        <Text style={styles.conseilTexte}>Partagez votre position GPS avec un proche avant le trajet</Text>
                    </View>
                    <View style={styles.conseilItem}>
                        <Ionicons name="person-outline" size={16} color="#00b5e2" />
                        <Text style={styles.conseilTexte}>Vérifiez le profil et les avis du conducteur avant de monter</Text>
                    </View>
                    <View style={styles.conseilItem}>
                        <Ionicons name="phone-portrait-outline" size={16} color="#00b5e2" />
                        <Text style={styles.conseilTexte}>Gardez votre téléphone chargé pendant le trajet</Text>
                    </View>
                    <View style={styles.conseilItem}>
                        <Ionicons name="chatbubble-outline" size={16} color="#00b5e2" />
                        <Text style={styles.conseilTexte}>{'Informez un proche de l\'heure d\'arrivée prévue'}</Text>
                    </View>
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        backgroundColor: '#182D5A',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#D8E4F0',
    },
    backButton: { padding: 4 },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
    },
    sosBanner: {
        backgroundColor: '#E52424',
        margin: 16,
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sosBannerText: { flex: 1 },
    sosBannerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    sosBannerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 18,
    },
    cardWrapper: {
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderLeftWidth: 3,
        borderWidth: 1,
        borderColor: '#EEF2F7',
        shadowColor: '#182D5A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardInfo: { flex: 1 },
    cardService: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    cardDescription: {
        fontSize: 12,
        color: '#888888',
        lineHeight: 16,
    },
    boutonAppeler: {
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginLeft: 8,
    },
    boutonAppelerNumero: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    conseilContainer: {
        backgroundColor: '#ffffff',
        margin: 16,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EEF2F7',
        shadowColor: '#182D5A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    conseilTitre: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    conseilItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 10,
    },
    conseilTexte: {
        fontSize: 13,
        color: '#888888',
        flex: 1,
        lineHeight: 18,
    },
});