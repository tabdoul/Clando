import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
    // Publiques
    { path: '', loadComponent: () => import('./features/landing/landing').then(m => m.LandingComponent) },
    { path: 'trajets', loadComponent: () => import('./features/trajets/trajet-list/trajet-list').then(m => m.TrajetListComponent) },
    { path: 'trajets/:id', loadComponent: () => import('./features/trajets/trajet-detail/trajet-detail').then(m => m.TrajetDetailComponent) },
    { path: 'mentions-legales', loadComponent: () => import('./features/mentions-legales/mentions-legales').then(m => m.MentionsLegalesComponent) },
    { path: 'telecharger', loadComponent: () => import('./features/telecharger/telecharger').then(m => m.TelechargerComponent) },
    { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent) },
    { path: 'register', loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent) },

    // Protégées
    { path: 'mes-reservations', loadComponent: () => import('./features/reservations/reservation-list/reservation-list').then(m => m.ReservationListComponent), canActivate: [authGuard] },
    { path: 'paiements', loadComponent: () => import('./features/paiements/paiement-list/paiement-list').then(m => m.PaiementListComponent), canActivate: [authGuard] },
    { path: 'avis', loadComponent: () => import('./features/avis/avis-list/avis-list').then(m => m.AvisListComponent), canActivate: [authGuard] },
    { path: 'notifications', loadComponent: () => import('./features/reservations/notifications/notifications').then(m => m.NotificationsComponent), canActivate: [authGuard] },
    { path: 'profil', loadComponent: () => import('./features/profil/profil').then(m => m.ProfilComponent), canActivate: [authGuard] },
    { path: '**', redirectTo: '' }
];
