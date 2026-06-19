// src/app/features/reservations/reservation-list/reservation-list.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { ReservationService } from '../../../core/services/reservation.service';
import { Reservation } from '../../../shared/models/reservation.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-reservation-list',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        MatTabsModule,
        MatDividerModule
    ],
    templateUrl: './reservation-list.html',
    styleUrl: './reservation-list.css'
})
export class ReservationListComponent implements OnInit {

    // Onglet passager : mes réservations effectuées
    mesReservations: Reservation[] = [];
    loadingPassager = false;

    // Onglet conducteur : toutes les demandes sur mes trajets
    reservationsRecues: Reservation[] = [];
    loadingConducteur = false;

    constructor(
        private reservationService: ReservationService,
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.chargerMesReservations();
        this.chargerReservationsRecues();
    }

    // ─── ONGLET PASSAGER ────────────────────────────────────────

    chargerMesReservations(): void {
        this.loadingPassager = true;
        const userId = this.authService.getUserId();
        if (!userId) { this.loadingPassager = false; return; }

        this.reservationService.getByPassager(userId).subscribe({
            next: (data) => {
                // Trier : actives en premier, terminées/annulées en bas
                this.mesReservations = data.sort((a, b) => {
                    const ordre: Record<string, number> = {
                        'EN_ATTENTE': 0,
                        'CONFIRMEE': 1,
                        'PRIX_REFUSE': 2,
                        'REFUSEE': 3,
                        'ANNULEE': 4,
                        'TERMINEE': 5
                    };
                    return (ordre[a.statut] ?? 9) - (ordre[b.statut] ?? 9);
                });
                this.loadingPassager = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loadingPassager = false;
                this.cdr.detectChanges();
                this.snackBar.open('Erreur lors du chargement', 'Fermer', { duration: 3000 });
            }
        });
    }

    // Un passager peut annuler uniquement si EN_ATTENTE, CONFIRMEE ou PRIX_REFUSE
    peutAnnuler(r: Reservation): boolean {
        return r.statut === 'EN_ATTENTE'
            || r.statut === 'CONFIRMEE'
            || r.statut === 'PRIX_REFUSE';
    }

    annulerReservation(r: Reservation): void {
        if (!r.id) return;
        if (!confirm('Confirmer l\'annulation de cette réservation ?')) return;

        // On utilise l'endpoint /annuler qui gère le remboursement Djomy
        this.reservationService.annuler(r.id).subscribe({
            next: (res) => {
                this.snackBar.open(res.message, 'Fermer', { duration: 5000 });
                this.chargerMesReservations();
            },
            error: (err) => {
                const message = err.error?.erreur || 'Erreur lors de l\'annulation';
                this.snackBar.open(message, 'Fermer', { duration: 3000 });
            }
        });
    }

    // ─── ONGLET CONDUCTEUR ──────────────────────────────────────

    chargerReservationsRecues(): void {
        this.loadingConducteur = true;
        const userId = this.authService.getUserId();
        if (!userId) { this.loadingConducteur = false; return; }

        // On charge toutes les réservations du conducteur (pas seulement EN_ATTENTE)
        // pour afficher l'historique complet
        this.reservationService.getEnAttenteParConducteur(userId).subscribe({
            next: (data) => {
                this.reservationsRecues = data;
                this.loadingConducteur = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loadingConducteur = false;
                this.cdr.detectChanges();
                this.snackBar.open('Erreur lors du chargement', 'Fermer', { duration: 3000 });
            }
        });
    }

    confirmerReservation(r: Reservation): void {
        if (!r.id) return;
        this.reservationService.changerStatut(r.id, 'CONFIRMEE').subscribe({
            next: () => {
                this.snackBar.open('✅ Réservation confirmée !', 'Fermer', { duration: 3000 });
                this.chargerReservationsRecues();
            },
            error: (err) => {
                const message = err.error?.erreur || 'Erreur';
                this.snackBar.open(message, 'Fermer', { duration: 3000 });
            }
        });
    }

    refuserReservation(r: Reservation): void {
        if (!r.id) return;
        if (!confirm('Refuser cette demande de réservation ?')) return;

        // Le backend gère REFUSEE si nbTentatives >= 1, sinon PRIX_REFUSE
        // Ici le conducteur refuse directement → on passe REFUSEE via repondreNegociation
        this.reservationService.repondreNegociation(r.id, false).subscribe({
            next: () => {
                this.snackBar.open('Réservation refusée', 'Fermer', { duration: 3000 });
                this.chargerReservationsRecues();
            },
            error: (err) => {
                const message = err.error?.erreur || 'Erreur';
                this.snackBar.open(message, 'Fermer', { duration: 3000 });
            }
        });
    }

    // ─── UTILITAIRES ────────────────────────────────────────────

    getStatutLabel(statut: string): string {
        switch (statut) {
            case 'EN_ATTENTE':  return '⏳ En attente';
            case 'CONFIRMEE':   return '✅ Confirmée';
            case 'ANNULEE':     return '❌ Annulée';
            case 'REFUSEE':     return ' Refusée';
            case 'PRIX_REFUSE': return ' Prix refusé';
            case 'TERMINEE':    return ' Terminée';
            default:            return statut;
        }
    }

    getStatutStyle(statut: string): string {
        const base = 'padding:4px 12px;border-radius:20px;font-size:0.8rem;white-space:nowrap;font-weight:500;';
        switch (statut) {
            case 'EN_ATTENTE':  return base + 'background:#ff9800;color:white;';
            case 'CONFIRMEE':   return base + 'background:#4caf50;color:white;';
            case 'ANNULEE':     return base + 'background:#f44336;color:white;';
            case 'REFUSEE':     return base + 'background:#9c27b0;color:white;';
            case 'PRIX_REFUSE': return base + 'background:#2196f3;color:white;';
            case 'TERMINEE':    return base + 'background:#9e9e9e;color:white;';
            default:            return base;
        }
    }

    getNomPassager(r: Reservation): string {
        return `${r.passagerPrenom ?? ''} ${r.passagerNom ?? ''}`.trim() || 'Passager inconnu';
    }

    getTrajetLabel(r: Reservation): string {
        if (!r.villeDepart && !r.villeArrivee) return '—';
        return `${r.villeDepart ?? '?'} → ${r.villeArrivee ?? '?'}`;
    }
}