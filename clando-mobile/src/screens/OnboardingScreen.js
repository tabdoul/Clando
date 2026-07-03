// OnboardingScreen.js
import React, { useState, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    FlatList, Dimensions, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius } from '../../constants/theme';

const { width } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        titre: 'Bienvenue sur Wayvo',
        description: 'Le covoiturage quotidien à Conakry — simple, sécurisé et abordable.',
        icon: 'car-outline',
        couleurIcon: colors.accent,
        contenu: null,
    },
    {
        id: '2',
        titre: 'Simple et rapide',
        description: 'Trouvez un trajet en quelques secondes et payez via Orange Money.',
        icon: null,
        couleurIcon: null,
        contenu: 'etapes',
    },
    {
        id: '3',
        titre: 'Voyagez en sécurité',
        description: 'Conducteurs vérifiés, paiement sécurisé, trajets femmes disponibles.',
        icon: null,
        couleurIcon: null,
        contenu: 'securite',
    },
];

export default function OnboardingScreen({ navigation }) {
    const [indexActif, setIndexActif] = useState(0);
    const flatListRef = useRef(null);

    const terminer = async () => {
        await AsyncStorage.setItem('wayvo_onboarding_vu', 'true');
        navigation.replace('Login');
    };

    const suivant = () => {
        if (indexActif < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: indexActif + 1 });
            setIndexActif(indexActif + 1);
        } else {
            terminer();
        }
    };

    const renderEtapes = () => (
        <View style={styles.etapesContainer}>
            {[
                { icon: 'search-outline', label: 'Rechercher' },
                { icon: 'checkmark-circle-outline', label: 'Réserver' },
                { icon: 'car-outline', label: 'Voyager' },
            ].map((item, index) => (
                <View key={item.label} style={styles.etapeWrapper}>
                    <View style={styles.etapeIconContainer}>
                        <Ionicons name={item.icon} size={28} color="white" />
                    </View>
                    <Text style={styles.etapeLabel}>{item.label}</Text>
                    {index < 2 && (
                        <Ionicons
                            name="arrow-forward"
                            size={16}
                            color={colors.accent}
                            style={styles.etapeArrow}
                        />
                    )}
                </View>
            ))}
        </View>
    );

    const renderSecurite = () => (
        <View style={styles.securiteGrid}>
            {[
                { icon: 'shield-checkmark-outline', label: 'Conducteurs vérifiés', color: '#7ed9b0' },
                { icon: 'phone-portrait-outline', label: 'Orange Money', color: colors.accent },
                { icon: 'female-outline', label: 'Trajets femmes', color: colors.purple },
                { icon: 'location-outline', label: 'Suivi temps réel', color: '#56b6c2' },
            ].map((item) => (
                <View key={item.label} style={styles.securiteCard}>
                    <Ionicons name={item.icon} size={28} color={item.color} />
                    <Text style={styles.securiteLabel}>{item.label}</Text>
                </View>
            ))}
        </View>
    );

    const renderSlide = ({ item }) => (
        <View style={styles.slide}>
            <View style={styles.slideHeader}>
                {item.icon && (
                    <View style={styles.iconContainer}>
                        <Ionicons name={item.icon} size={56} color={item.couleurIcon} />
                    </View>
                )}
                {item.contenu === 'etapes' && renderEtapes()}
                {item.contenu === 'securite' && renderSecurite()}
            </View>

            <View style={styles.slideContent}>
                <Text style={styles.slideTitre}>{item.titre}</Text>
                <Text style={styles.slideDescription}>{item.description}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>

            {/* Bouton Passer */}
            <TouchableOpacity style={styles.passerBtn} onPress={terminer}>
                <Text style={styles.passerTexte}>Passer</Text>
            </TouchableOpacity>

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={true}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setIndexActif(index);
                }}
            />

            {/* Bas de page — dots + bouton */}
            <View style={styles.footer}>
                {/* Dots */}
                <View style={styles.dotsContainer}>
                    {slides.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                index === indexActif && styles.dotActif
                            ]}
                        />
                    ))}
                </View>

                {/* Bouton suivant / commencer */}
                <TouchableOpacity style={styles.bouton} onPress={suivant}>
                    <Text style={styles.boutonTexte}>
                        {indexActif === slides.length - 1 ? 'Commencer' : 'Suivant'}
                    </Text>
                    <Ionicons
                        name={indexActif === slides.length - 1 ? 'checkmark' : 'arrow-forward'}
                        size={18}
                        color="white"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary,
    },
    passerBtn: {
        position: 'absolute',
        top: 60,
        right: 24,
        zIndex: 10,
        padding: 8,
    },
    passerTexte: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 14,
        fontWeight: '500',
    },
    slide: {
        width,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    slideHeader: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    slideContent: {
        paddingBottom: 140,
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    slideTitre: {
        fontSize: 26,
        fontWeight: '700',
        color: 'white',
        textAlign: 'center',
        marginBottom: 14,
    },
    slideDescription: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.75)',
        textAlign: 'center',
        lineHeight: 24,
    },

    // ── Étapes ────────────────────────────────────────────
    etapesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    etapeWrapper: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    etapeIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    etapeLabel: {
        position: 'absolute',
        bottom: -24,
        fontSize: 11,
        color: 'rgba(255,255,255,0.75)',
        textAlign: 'center',
        width: 64,
    },
    etapeArrow: {
        marginTop: -20,
    },

    // ── Sécurité ──────────────────────────────────────────
    securiteGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    securiteCard: {
        width: '44%',
        backgroundColor: 'rgba(255,255,255,0.10)',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        gap: 10,
    },
    securiteLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        fontWeight: '500',
    },

    // ── Footer ────────────────────────────────────────────
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 48,
        paddingHorizontal: spacing.xl,
        alignItems: 'center',
        gap: 24,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.35)',
    },
    dotActif: {
        width: 22,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.accent,
    },
    bouton: {
        backgroundColor: colors.accent,
        borderRadius: radius.full,
        paddingVertical: 14,
        paddingHorizontal: 40,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        justifyContent: 'center',
    },
    boutonTexte: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});