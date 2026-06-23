import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSnackBarModule,
        MatIconModule
    ],
    templateUrl: './login.html',
    styleUrl: './login.css'
})
export class LoginComponent {

    loginForm: FormGroup;
    loading = false;
    hidePassword = true;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            motDePasse: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    onSubmit(): void {
        if (this.loginForm.invalid) return;

        this.loading = true;
        this.cdr.detectChanges();
        const { email, motDePasse } = this.loginForm.value;

        this.authService.login(email, motDePasse).subscribe({
            next: () => {
                this.loading = false;
                this.cdr.detectChanges();

                //  Rediriger vers l'URL sauvegardée ou /trajets par défaut
                const redirectUrl = this.authService.getAndClearRedirectUrl();
                this.router.navigateByUrl(redirectUrl || '/trajets');
            },
            error: () => {
                this.loading = false;
                this.cdr.detectChanges();
                this.snackBar.open('Email ou mot de passe incorrect', 'Fermer', {
                    duration: 3000
                });
            }
        });
    }
}