import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { ReservationService } from './core/services/reservation.service';


@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        RouterOutlet,
        RouterLink,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatBadgeModule,
        CommonModule
    ],
    templateUrl: './app.html',
    styleUrl: './app.css'
})
export class AppComponent implements OnInit {
    title = 'Clando';
    nbNotifications = 0;

    constructor(
        public authService: AuthService,
        private reservationService: ReservationService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.authService.isLoggedIn$.subscribe(isLoggedIn => {
            if (isLoggedIn) {
                this.chargerNotifications();
            } else {
                this.nbNotifications = 0;
            }
        });
    }

    chargerNotifications(): void {
        const userId = this.authService.getUserId();
        if (!userId) return;

        this.reservationService.getEnAttenteParConducteur(userId).subscribe({
            next: (data) => {
                this.nbNotifications = data.length;
                this.cdr.detectChanges();
            },
            error: () => {
                this.nbNotifications = 0;
            }
        });
    }


    logout(): void {
        this.authService.logout();
        this.nbNotifications = 0;
        this.router.navigate(['/login']);
    }

}
