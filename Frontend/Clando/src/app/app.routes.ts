import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
    { path: '', redirectTo: '/trajets', pathMatch: 'full' },
    { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent) },
    { path: 'register', loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent) },
    { path: 'trajets', loadComponent: () => import('./features/trajets/trajet-list/trajet-list').then(m => m.TrajetListComponent), canActivate: [authGuard] },
    { path: 'vehicules', loadComponent: () => import('./features/vehicules/vehicule-list/vehicule-list').then(m => m.VehiculeListComponent), canActivate: [authGuard] },
    { path: 'publier', loadComponent: () => import('./features/vehicules/vehicule-list/vehicule-list').then(m => m.VehiculeListComponent), canActivate: [authGuard] },
    { path: 'reservations', loadComponent: () => import('./features/reservations/reservation-list/reservation-list').then(m => m.ReservationListComponent), canActivate: [authGuard] },
    { path: 'paiements', loadComponent: () => import('./features/paiements/paiement-list/paiement-list').then(m => m.PaiementListComponent), canActivate: [authGuard] },
    { path: 'avis', loadComponent: () => import('./features/avis/avis-list/avis-list').then(m => m.AvisListComponent), canActivate: [authGuard] },
    { path: 'notifications', loadComponent: () => import('./features/reservations/notifications/notifications').then(m => m.NotificationsComponent), canActivate: [authGuard] },
    { path: 'profil', loadComponent: () => import('./features/profil/profil').then(m => m.ProfilComponent), canActivate: [authGuard] },
    { path: '**', redirectTo: '/trajets' },
]
