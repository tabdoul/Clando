import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environments';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule
    ],
    templateUrl: './register.html',
    styleUrl: './register.css'
})
export class RegisterComponent {

    registerForm: FormGroup;
    loading = false;

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private router: Router,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef
    ) {
        this.registerForm = this.fb.group({
            nom: ['', Validators.required],
            prenom: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            motDePasse: ['', [Validators.required, Validators.minLength(6)]],
            telephone: ['']
        });
    }

    onSubmit(): void {
        if (this.registerForm.invalid) return;

        this.loading = true;
        this.cdr.detectChanges();

        this.http.post(`${environment.apiUrl}/utilisateurs`, this.registerForm.value).subscribe({
            next: () => {
                this.loading = false;
                this.cdr.detectChanges();
                this.snackBar.open('Compte créé avec succès !', 'Fermer', { duration: 3000 });
                this.router.navigate(['/login']);
            },
            error: () => {
                this.loading = false;
                this.cdr.detectChanges();
                this.snackBar.open('Erreur lors de la création du compte', 'Fermer', { duration: 3000 });
            }
        });
    }
}