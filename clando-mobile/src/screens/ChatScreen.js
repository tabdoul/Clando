import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, FlatList, ActivityIndicator,
    KeyboardAvoidingView, Platform, Alert, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { getUserId } from '../services/auth.service';
import { colors, spacing, radius } from '../../constants/theme';

export default function ChatScreen({ route, navigation }) {
    const { reservationId, interlocuteur } = route.params;
    const [messages, setMessages] = useState([]);
    const [contenu, setContenu] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState(null);
    const flatListRef = useRef(null);

    useEffect(() => {
        const init = async () => {
            const id = await getUserId();
            setCurrentUserId(id);
            if (id) {
                try {
                    await api.patch(`/messages/marquer-lus/${reservationId}/${id}`);
                } catch (error) {}
            }
        };
        init();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            chargerMessages();
            const interval = setInterval(chargerMessages, 10000);
            return () => clearInterval(interval);
        }, [])
    );

    const chargerMessages = async () => {
        try {
            const response = await api.get(`/messages/reservation/${reservationId}`);
            setMessages(response.data);
        } catch (error) {
        } finally {
            if (loading) setLoading(false);
        }
    };

    const envoyer = async () => {
        if (!contenu.trim()) return;
        if (!currentUserId) {
            Alert.alert('Erreur', 'Veuillez vous reconnecter');
            return;
        }

        const messageTemp = contenu;
        setContenu('');

        try {
            await api.post('/messages', {
                contenu: messageTemp,
                expediteurId: currentUserId,
                destinataireId: interlocuteur.id,
                reservationId
            });
            chargerMessages();
        } catch (error) {
            Alert.alert('Erreur', "Impossible d'envoyer le message");
            setContenu(messageTemp);
        }
    };

    const formatHeure = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });
    };

    const renderMessage = ({ item }) => {
        const estMoi = item.expediteurId === currentUserId;
        return (
            <View style={[styles.messageWrapper, estMoi ? styles.messageWrapperMoi : styles.messageWrapperAutre]}>
                <View style={[styles.messageBubble, estMoi ? styles.bubbleMoi : styles.bubbleAutre]}>
                    <Text style={[styles.messageTexte, estMoi ? styles.texteMoi : styles.texteAutre]}>
                        {item.contenu}
                    </Text>
                    <Text style={[styles.messageHeure, estMoi ? styles.heureMoi : styles.heureAutre]}>
                        {formatHeure(item.dateEnvoi)}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size={36} color={colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.avatar}>
                    {interlocuteur.photo ? (
                        <Image
                            source={{ uri: interlocuteur.photo }}
                            style={styles.avatarImage}
                        />
                    ) : (
                        <Text style={styles.avatarText}>
                            {interlocuteur.prenom?.charAt(0)}{interlocuteur.nom?.charAt(0)}
                        </Text>
                    )}
                </View>
                <Text style={styles.headerNom}>
                    {interlocuteur.prenom} {interlocuteur.nom}
                </Text>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Votre message..."
                    placeholderTextColor={colors.textDisabled}
                    value={contenu}
                    onChangeText={setContenu}
                    multiline
                />
                <TouchableOpacity
                    style={[styles.sendButton, !contenu.trim() && { opacity: 0.5 }]}
                    onPress={envoyer}
                    disabled={!contenu.trim()}>
                    <Ionicons name="send" size={20} color="white" />
                </TouchableOpacity>
            </View>

        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: {
        flex: 1, backgroundColor: colors.background,
        justifyContent: 'center', alignItems: 'center'
    },
    header: {
        backgroundColor: colors.primary,
        paddingTop: 60, paddingBottom: 16, paddingHorizontal: spacing.lg,
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    backButton: { padding: 4 },
    avatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImage: { width: 40, height: 40, borderRadius: 20 },
    avatarText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
    headerNom: { fontSize: 16, fontWeight: '600', color: 'white' },
    messagesList: { padding: spacing.lg, gap: 8 },
    messageWrapper: { marginBottom: 8 },
    messageWrapperMoi: { alignItems: 'flex-end' },
    messageWrapperAutre: { alignItems: 'flex-start' },
    messageBubble: { maxWidth: '75%', borderRadius: radius.lg, padding: 12 },
    bubbleMoi: { backgroundColor: colors.accent, borderBottomRightRadius: 4 },
    bubbleAutre: {
        backgroundColor: colors.surface, borderBottomLeftRadius: 4,
        borderWidth: 1, borderColor: colors.border,
    },
    messageTexte: { fontSize: 15, lineHeight: 20 },
    texteMoi: { color: 'white' },
    texteAutre: { color: colors.textPrimary },
    messageHeure: { fontSize: 10, marginTop: 4, textAlign: 'right' },
    heureMoi: { color: 'rgba(255,255,255,0.7)' },
    heureAutre: { color: colors.textMuted },
    inputContainer: {
        flexDirection: 'row', alignItems: 'flex-end', padding: 12,
        backgroundColor: colors.surface, borderTopWidth: 1,
        borderTopColor: colors.separator, gap: 10,
    },
    input: {
        flex: 1, backgroundColor: colors.surfaceSecondary, borderRadius: 20,
        paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: colors.textPrimary,
        maxHeight: 100, borderWidth: 1, borderColor: colors.border,
    },
    sendButton: {
        backgroundColor: colors.accent, width: 44, height: 44,
        borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    },
});