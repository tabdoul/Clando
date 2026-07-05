export const colors = {
    // ── Primaire — Marron WayVo ──────────────────────
    primary: '#5A2E16',
    primaryLight: '#fdf0ea',
    primaryDark: '#8b3a1c',

    // ── Accent — Marron moyen ────────────────────────
    accent: '#5c3317',
    accentLight: '#fdf0ea',
    accentDark: '#3d2210',

    // ── Couleurs fonctionnelles ──────────────────────
    orange: '#e07b39',
    orangeLight: '#fdf0e6',
    green: '#2e7d32',
    greenLight: '#e8f5e9',
    red: '#c62828',
    redLight: '#ffebee',
    purple: '#7b1fa2',
    purpleLight: '#f3e5f5',

    // ── Fond ─────────────────────────────────────────
    background: '#ffffff',
    surface: '#ffffff',
    surfaceSecondary: '#fafafa',

    // ── Texte ─────────────────────────────────────────
    textPrimary: '#1a1a1a',
    textSecondary: '#333333',
    textMuted: '#777777',
    textDisabled: '#cccccc',

    // ── Bordures ──────────────────────────────────────
    border: '#edddd0',
    borderStrong: '#d4a090',

    // ── Séparateur ────────────────────────────────────
    separator: '#f5ede8',
};

export const typography = {
    h1: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
    h2: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
    h3: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
    body: { fontSize: 14, color: colors.textPrimary },
    bodySmall: { fontSize: 13, color: colors.textSecondary },
    caption: { fontSize: 12, color: colors.textMuted },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
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
        shadowColor: '#5c3317',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    bottom: {
        shadowColor: '#5c3317',
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
        borderRadius: radius.md,
        paddingVertical: 14,
        paddingHorizontal: spacing.xl,
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
        borderRadius: radius.md,
        paddingVertical: 14,
        paddingHorizontal: spacing.xl,
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
        background: '#fff3e0',
        color: '#e65100',
        label: 'En attente',
    },
    CONFIRMEE: {
        background: '#fdf0e6',
        color: '#5c3317',
        label: 'Confirmée',
    },
    REFUSEE: {
        background: '#ffebee',
        color: '#c62828',
        label: 'Refusée',
    },
    ANNULEE: {
        background: '#fafafa',
        color: colors.textMuted,
        label: 'Annulée',
    },
    TERMINEE: {
        background: '#fdf0e6',
        color: '#8b3a1c',
        label: 'Terminée',
    },
};