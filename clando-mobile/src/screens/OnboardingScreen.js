import React, { useState, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    FlatList, Dimensions, ImageBackground, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { spacing, radius } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const C = {
    primary: '#182D5A',
    primaryLight: '#EEF2F7',
    textPrimary: '#1a1a1a',
    textMuted: '#888888',
    border: '#f0f0f0',
};

const slides = [
    {
        id: '1',
        image: require('../../assets/images/hero-covoiturage.webp'),
        titre: 'Bienvenue sur Wayvo',
        description: 'Le covoiturage quotidien à Conakry — simple, sécurisé et abordable.',
        contenu: null,
    },
    {
        id: '2',
        image: null,
        titre: 'Simple et rapide',
        description: 'Trouvez un trajet en quelques secondes et faites le trajet ensemble.',
        contenu: 'etapes',
    },
    {
        id: '3',
        image: null,
        titre: 'Voyagez en sécurité',
        description: 'Conducteurs vérifiés, paiement sécurisé, trajets femmes disponibles.',
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
            const nextIndex = indexActif + 1;
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
            setIndexActif(nextIndex);
        } else {
            terminer();
        }
    };

    const renderEtapes = () => (
        <View style={styles.etapesContainer}>
            {[
                { icon: 'search-outline', label: 'Chercher' },
                { icon: 'checkmark-circle-outline', label: 'Réserver' },
                { icon: 'car-outline', label: 'Faites le trajet' },
            ].map((item, index) => (
                <View key={item.label} style={styles.etapeGroupe}>
                    <View style={styles.etapeIconWrapper}>
                        <Ionicons name={item.icon} size={28} color={C.primary} />
                    </View>
                    <Text style={styles.etapeLabel}>{item.label}</Text>
                    {index < 2 && (
                        <Ionicons
                            name="arrow-forward"
                            size={18}
                            color={C.primary}
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
                { icon: 'shield-checkmark-outline', label: 'Conducteurs\nvérifiés', color: C.primary },
                { icon: 'phone-portrait-outline', label: 'Orange\nMoney', color: C.primary },
                { icon: 'female-outline', label: 'Trajets\nfemmes', color: '#9b59b6' },
                { icon: 'location-outline', label: 'Suivi\ntemps réel', color: C.primary },
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

            {/* ── Partie haute ── */}
            {item.image ? (
                <ImageBackground
                    source={item.image}
                    style={styles.slideImage}
                    imageStyle={{ resizeMode: 'cover' }}>
                    {/* Overlay dégradé bas */}
                    <View style={styles.imageOverlay} />
                    {/* Logo sur l'image */}
                    <View style={styles.logoSurImage}>
                        <Text style={styles.logoTexte}>
                            <Text style={styles.logoAccent}>Wayvo</Text>
                        </Text>
                        <Text style={styles.logoSousTexte}>Conakry, Guinée</Text>
                    </View>
                </ImageBackground>
            ) : (
                <View style={styles.slideVisuel}>
                    {item.contenu === 'etapes' && renderEtapes()}
                    {item.contenu === 'securite' && renderSecurite()}
                </View>
            )}

            {/* ── Partie basse ── */}
            <View style={styles.slideTexte}>
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
                scrollEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setIndexActif(index);
                }}
            />

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.dotsContainer}>
                    {slides.map((_, index) => (
                        <View
                            key={index}
                            style={[styles.dot, index === indexActif && styles.dotActif]}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.bouton, indexActif === slides.length - 1 && styles.boutonCommencer]}
                    onPress={suivant}>
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
        backgroundColor: '#ffffff',
    },

    // ── Passer ────────────────────────────────────────────
    passerBtn: {
        position: 'absolute',
        top: 56,
        right: 24,
        zIndex: 10,
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 20,
    },
    passerTexte: {
        color: C.textMuted,
        fontSize: 14,
        fontWeight: '500',
    },

    // ── Slide ─────────────────────────────────────────────
    slide: {
        width,
        flex: 1,
    },

    // ── Image slide 1 ─────────────────────────────────────
    slideImage: {
        width: '100%',
        height: height * 0.30,
        justifyContent: 'flex-end',
        marginTop:45,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 120,
        background: 'linear-gradient(transparent, white)',
        backgroundColor: 'transparent',
    },
    logoSurImage: {
        padding: 28,
        paddingBottom: 32,
    },
    logoTexte: {
        fontSize: 36,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 2,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
  
    logoSousTexte: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
        marginTop: 4,
    },

    // ── Visuel slides 2 et 3 ──────────────────────────────
    slideVisuel: {
        height: height * 0.40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.primaryLight,
        paddingHorizontal: spacing.xl,
        marginTop:60,
    },

    // ── Texte bas ─────────────────────────────────────────
    slideTexte: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        paddingTop: 28,
        paddingBottom: 160,
        alignItems: 'center',
    },
    slideTitre: {
        fontSize: 24,
        fontWeight: '800',
        color: C.textPrimary,
        textAlign: 'center',
        marginBottom: 12,
    },
    slideDescription: {
        fontSize: 15,
        color: C.textMuted,
        textAlign: 'center',
        lineHeight: 24,
    },

    // ── Étapes ────────────────────────────────────────────
    etapesContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    etapeGroupe: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 4,
    },
    etapeIconWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
        elevation: 4,
    },
    etapeLabel: {
        position: 'absolute',
        bottom: -28,
        fontSize: 11,
        color: C.textMuted,
        textAlign: 'center',
        width: 72,
        fontWeight: '500',
    },
    etapeArrow: {
        marginBottom: 0,
    },

    // ── Sécurité ──────────────────────────────────────────
    securiteGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    securiteCard: {
        width: '44%',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        gap: 10,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    securiteLabel: {
        fontSize: 12,
        color: C.textMuted,
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 18,
    },

    // ── Footer ────────────────────────────────────────────
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 52,
        paddingHorizontal: spacing.xl,
        alignItems: 'center',
        gap: 20,
        backgroundColor: '#ffffff',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: C.border,
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
        backgroundColor: '#e0e0e0',
    },
    dotActif: {
        width: 22,
        height: 6,
        borderRadius: 3,
        backgroundColor: C.primary,
    },
    bouton: {
        backgroundColor: C.primary,
        borderRadius: radius.full,
        paddingVertical: 14,
        paddingHorizontal: 40,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        justifyContent: 'center',
    },
    boutonCommencer: {
        backgroundColor: C.primary,
    },
    boutonTexte: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});