import React, { useState, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    FlatList, Dimensions
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
        contenu: 'logo',
    },
    {
        id: '2',
        titre: 'Simple et rapide',
        description: 'Trouvez un trajet en quelques secondes et payez via Orange Money.',
        contenu: 'etapes',
    },
    {
        id: '3',
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

    const renderLogo = () => (
        <View style={styles.logoContainer}>
            <View style={styles.logoIconWrapper}>
                <Ionicons name="car" size={52} color={colors.primary} />
            </View>
            <Text style={styles.logoTexte}>
                Way<Text style={styles.logoAccent}>vo</Text>
            </Text>
        </View>
    );

    const renderEtapes = () => (
        <View style={styles.etapesContainer}>
            {[
                { icon: 'search-outline', label: 'Chercher' },
                { icon: 'checkmark-circle-outline', label: 'Réserver' },
                { icon: 'car-outline', label: 'Voyager' },
            ].map((item, index) => (
                <View key={item.label} style={styles.etapeGroupe}>
                    <View style={styles.etapeIconWrapper}>
                        <Ionicons name={item.icon} size={26} color={colors.primary} />
                    </View>
                    <Text style={styles.etapeLabel}>{item.label}</Text>
                    {index < 2 && (
                        <Ionicons
                            name="arrow-forward"
                            size={18}
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
                { icon: 'shield-checkmark-outline', label: 'Conducteurs\nvérifiés', color: colors.primary },
                { icon: 'phone-portrait-outline', label: 'Orange\nMoney', color: colors.accent },
                { icon: 'female-outline', label: 'Trajets\nfemmes', color: colors.purple },
                { icon: 'location-outline', label: 'Suivi\ntemps réel', color: colors.primary },
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
            <View style={styles.slideVisuel}>
                {item.contenu === 'logo' && renderLogo()}
                {item.contenu === 'etapes' && renderEtapes()}
                {item.contenu === 'securite' && renderSecurite()}
            </View>

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
                {/* Dots */}
                <View style={styles.dotsContainer}>
                    {slides.map((_, index) => (
                        <View
                            key={index}
                            style={[styles.dot, index === indexActif && styles.dotActif]}
                        />
                    ))}
                </View>

                {/* Bouton */}
                <TouchableOpacity
                    style={[
                        styles.bouton,
                        indexActif === slides.length - 1 && styles.boutonCommencer
                    ]}
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
        top: 60,
        right: 24,
        zIndex: 10,
        padding: 8,
    },
    passerTexte: {
        color: colors.textMuted,
        fontSize: 14,
        fontWeight: '500',
    },

    // ── Slide ─────────────────────────────────────────────
    slide: {
        width,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: 60,
    },
    slideVisuel: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    slideTexte: {
        paddingBottom: 160,
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    slideTitre: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: 12,
    },
    slideDescription: {
        fontSize: 15,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 24,
    },

    // ── Logo écran 1 ──────────────────────────────────────
    logoContainer: {
        alignItems: 'center',
        gap: 16,
    },
    logoIconWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#eef2f7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoTexte: {
        fontSize: 36,
        fontWeight: '800',
        color: colors.primary,
        letterSpacing: 3,
    },
    logoAccent: {
        color: colors.accent,
    },

    // ── Étapes écran 2 ────────────────────────────────────
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
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#eef2f7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 0,
    },
    etapeLabel: {
        position: 'absolute',
        bottom: -28,
        fontSize: 11,
        color: colors.textMuted,
        textAlign: 'center',
        width: 68,
        fontWeight: '500',
    },
    etapeArrow: {
        marginBottom: 0,
    },

    // ── Sécurité écran 3 ──────────────────────────────────
    securiteGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    securiteCard: {
        width: '44%',
        backgroundColor: '#eef2f7',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        gap: 10,
    },
    securiteLabel: {
        fontSize: 12,
        color: colors.textMuted,
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
        borderTopColor: colors.separator,
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
        backgroundColor: colors.primary,
    },
    bouton: {
        backgroundColor: colors.primary,
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
        backgroundColor: colors.accent, // ✅ orange sur le dernier écran
    },
    boutonTexte: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});