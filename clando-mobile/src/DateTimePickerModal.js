import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = { primary: '#182D5A', primaryLight: '#EEF2F7', primaryBorder: '#D8E4F0', bg: '#ffffff', text: '#1a1a1a', muted: '#888888', disabled: '#cccccc' };
const BTN_HEIGHT = 52;
const ICON_SIZE = 22;

const JOURS_LETTRES = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const JOURS_NOM = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MOIS_LONG = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MOIS_COURT = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc'];

export const formatDate = (date) => !date ? 'Choisir une date' : `${JOURS_NOM[date.getDay()]} ${date.getDate()} ${MOIS_COURT[date.getMonth()]} ${date.getFullYear()}`;
export const formatHeure = (date) => !date ? 'Choisir une heure' : `${date.getHours().toString().padStart(2, '0')}h${date.getMinutes().toString().padStart(2, '0')}`;

const genererJoursMois = (annee, mois) => {
    const premierJour = new Date(annee, mois, 1).getDay();
    const nbJours = new Date(annee, mois + 1, 0).getDate();
    const jours = Array(premierJour).fill(null);
    for (let i = 1; i <= nbJours; i++) jours.push(i);
    return jours;
};

const PAS_MINUTES = [0, 15, 30, 45];
const indexMinuteProche = (m) => PAS_MINUTES.reduce((iProche, val, i) => Math.abs(val - m) < Math.abs(PAS_MINUTES[iProche] - m) ? i : iProche, 0);

export default function DateTimePickerModal({ visible, mode, value, minimumDate, onConfirm, onClose }) {
    const initial = value || new Date();
    const [moisAffiche, setMoisAffiche] = useState(initial.getMonth());
    const [anneeAffichee, setAnneeAffichee] = useState(initial.getFullYear());
    const [jourSelectionne, setJourSelectionne] = useState(initial.getDate());
    const [moisSelectionne, setMoisSelectionne] = useState(initial.getMonth());
    const [anneeSelectionnee, setAnneeSelectionnee] = useState(initial.getFullYear());
    const [heure, setHeure] = useState(initial.getHours());
    const [minuteIndex, setMinuteIndex] = useState(indexMinuteProche(initial.getMinutes()));
    const minute = PAS_MINUTES[minuteIndex];

    if (!visible) return null;

    const jours = genererJoursMois(anneeAffichee, moisAffiche);
    const min = minimumDate || new Date();
    const minJour = new Date(min.getFullYear(), min.getMonth(), min.getDate());
    const estPasse = (jour) => new Date(anneeAffichee, moisAffiche, jour) < minJour;

    const changerMois = (delta) => {
        let m = moisAffiche + delta, a = anneeAffichee;
        if (m < 0) { m = 11; a--; } else if (m > 11) { m = 0; a++; }
        setMoisAffiche(m); setAnneeAffichee(a);
    };

    const selectionnerJour = (jour) => { setJourSelectionne(jour); setMoisSelectionne(moisAffiche); setAnneeSelectionnee(anneeAffichee); };

    const maintenant = () => { const n = new Date(); setHeure(n.getHours()); setMinuteIndex(indexMinuteProche(n.getMinutes())); };

    const confirmer = () => {
        if (mode === 'date') onConfirm(new Date(anneeSelectionnee, moisSelectionne, jourSelectionne));
        else { const d = new Date(); d.setHours(heure, minute, 0, 0); onConfirm(d); }
        onClose();
    };

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <Pressable style={s.overlay} onPress={onClose}>
                <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>

                    {mode === 'date' ? (
                        <>
                            <View style={s.moisHeader}>
                                <TouchableOpacity onPress={() => changerMois(-1)} style={s.navBtn}><Ionicons name="chevron-back" size={ICON_SIZE} color={C.primary} /></TouchableOpacity>
                                <Text style={s.moisTexte}>{MOIS_LONG[moisAffiche]} {anneeAffichee}</Text>
                                <TouchableOpacity onPress={() => changerMois(1)} style={s.navBtn}><Ionicons name="chevron-forward" size={ICON_SIZE} color={C.primary} /></TouchableOpacity>
                            </View>
                            <View style={s.joursLettres}>{JOURS_LETTRES.map((j, i) => <Text key={i} style={s.jourLettre}>{j}</Text>)}</View>
                            <View style={s.grilleJours}>
                                {jours.map((jour, i) => {
                                    if (!jour) return <View key={i} style={s.caseJour} />;
                                    const passe = estPasse(jour);
                                    const selectionne = jour === jourSelectionne && moisAffiche === moisSelectionne && anneeAffichee === anneeSelectionnee;
                                    return (
                                        <TouchableOpacity key={i} disabled={passe} onPress={() => selectionnerJour(jour)} style={[s.caseJour, selectionne && s.caseJourActive]}>
                                            <Text style={[s.jourTexte, passe && s.jourTextePasse, selectionne && s.jourTexteActif]}>{jour}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={s.stepperLabel}>Heure du trajet</Text>
                            <View style={s.stepperRow}>
                                <View style={s.stepperCol}>
                                    <TouchableOpacity style={s.stepperBtn} onPress={() => setHeure((heure + 1) % 24)}><Ionicons name="chevron-up" size={20} color={C.primary} /></TouchableOpacity>
                                    <Text style={s.stepperValeur}>{heure.toString().padStart(2, '0')}</Text>
                                    <TouchableOpacity style={s.stepperBtn} onPress={() => setHeure((heure + 23) % 24)}><Ionicons name="chevron-down" size={20} color={C.primary} /></TouchableOpacity>
                                </View>
                                <Text style={s.stepperDeuxPoints}>:</Text>
                                <View style={s.stepperCol}>
                                    <TouchableOpacity style={s.stepperBtn} onPress={() => setMinuteIndex((minuteIndex + 1) % 4)}><Ionicons name="chevron-up" size={20} color={C.primary} /></TouchableOpacity>
                                    <Text style={s.stepperValeur}>{minute.toString().padStart(2, '0')}</Text>
                                    <TouchableOpacity style={s.stepperBtn} onPress={() => setMinuteIndex((minuteIndex + 3) % 4)}><Ionicons name="chevron-down" size={20} color={C.primary} /></TouchableOpacity>
                                </View>
                            </View>
                            <TouchableOpacity style={s.maintenantBtn} onPress={maintenant}><Text style={s.maintenantTexte}>Maintenant</Text></TouchableOpacity>
                        </>
                    )}

                    <View style={s.footer}>
                        <TouchableOpacity style={s.annulerBtn} onPress={onClose}><Text style={s.annulerTexte}>Annuler</Text></TouchableOpacity>
                        <TouchableOpacity style={s.validerBtn} onPress={confirmer}><Text style={s.validerTexte}>Valider</Text></TouchableOpacity>
                    </View>

                </Pressable>
            </Pressable>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 30 },
    moisHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    moisTexte: { fontSize: 16, fontWeight: '600', color: C.text },
    joursLettres: { flexDirection: 'row', marginBottom: 6 },
    jourLettre: { flex: 1, textAlign: 'center', fontSize: 12, color: C.muted, fontWeight: '600' },
    grilleJours: { flexDirection: 'row', flexWrap: 'wrap' },
    caseJour: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10, marginVertical: 2 },
    caseJourActive: { backgroundColor: C.primary },
    jourTexte: { fontSize: 14, color: C.text },
    jourTextePasse: { color: C.disabled },
    jourTexteActif: { color: '#ffffff', fontWeight: '700' },
    stepperLabel: { fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 16 },
    stepperCol: { alignItems: 'center', gap: 8 },
    stepperBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
    stepperValeur: { fontSize: 32, fontWeight: '600', color: C.text, minWidth: 56, textAlign: 'center' },
    stepperDeuxPoints: { fontSize: 32, fontWeight: '600', color: C.disabled },
    maintenantBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: C.primaryBorder, marginBottom: 10 },
    maintenantTexte: { fontSize: 13, fontWeight: '600', color: C.primary },
    footer: { flexDirection: 'row', gap: 12, marginTop: 10 },
    annulerBtn: { flex: 1, height: BTN_HEIGHT, borderRadius: 14, borderWidth: 1, borderColor: C.primaryBorder, alignItems: 'center', justifyContent: 'center' },
    annulerTexte: { fontSize: 15, fontWeight: '600', color: C.muted },
    validerBtn: { flex: 1, height: BTN_HEIGHT, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
    validerTexte: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
});