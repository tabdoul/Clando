// constants/theme.js

export const colors = {
    // Primaires — Bleu marine WayVo
    primary: '#182d5a',
    primaryLight: '#e8edf5',
    primaryDark: '#0f1d3d',

    // Accent — utilisé pour les éléments secondaires (arrivée, inverser, favoris)
    accent: '#8a5f2e',
    accentLight: '#e8f0f7',
    accentDark: '#1f4566',

    orange: '#f39c12',
    orangeLight: '#fff3e0',
    green: '#1b5e3b',
    greenLight: '#e8f5ee',
    red: '#e74c3c',
    redLight: '#fdecea',
    purple: '#9b59b6',
    purpleLight: '#f3e9f8',

    // Fond
    background: '#eef2f7',
    surface: '#ffffff',
    surfaceSecondary: '#f4f7fa',

    // Texte
    textPrimary: '#1a1a1a',
    textSecondary: '#444444',
    textMuted: '#888888',
    textDisabled: '#cccccc',

    // Bordures
    border: '#e2e8ef',
    borderStrong: '#c8d3de',

    // Séparateur
    separator: '#eef2f7',
};

export const typography = {
    h1: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
    h2: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
    h3: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
    body: { fontSize: 14, color: colors.textPrimary },
    bodySmall: { fontSize: 13, color: colors.textSecondary },
    caption: { fontSize: 12, color: colors.textMuted },
    label: {
        fontSize: 12, fontWeight: '600',
        color: colors.textMuted,
        textTransform: 'uppercase', letterSpacing: 1,
    },
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
};

export const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
};

export const shadows = {
    card: {
        shadowColor: '#182d5a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    bottom: {
        shadowColor: '#182d5a',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 10,
    },
};

export const components = {
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        ...shadows.card,
    },
    input: {
        backgroundColor: colors.surfaceSecondary,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: 15,
        color: colors.textPrimary,
    },
    btnPrimary: {
        backgroundColor: colors.primary,
        borderRadius: radius.sm,
        padding: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    btnPrimaryText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '700',
    },
    btnSecondary: {
        backgroundColor: colors.surface,
        borderRadius: radius.sm,
        padding: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    btnSecondaryText: {
        color: colors.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    badge: {
        paddingVertical: 3,
        paddingHorizontal: 10,
        borderRadius: radius.full,
        fontSize: 11,
        fontWeight: '600',
    },
    bottomBar: {
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.separator,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        ...shadows.bottom,
    },
};

export const statutStyles = {
    EN_ATTENTE: {
        background: colors.orangeLight,
        color: '#e65100',
        label: 'En attente',
    },
    CONFIRMEE: {
        background: colors.greenLight,
        color: colors.green,
        label: 'Confirmée',
    },
    REFUSEE: {
        background: colors.redLight,
        color: '#c62828',
        label: 'Refusée',
    },
    ANNULEE: {
        background: colors.surfaceSecondary,
        color: colors.textMuted,
        label: 'Annulée',
    },
    TERMINEE: {
        background: colors.accentLight,
        color: colors.accentDark,
        label: 'Terminée',
    },
};