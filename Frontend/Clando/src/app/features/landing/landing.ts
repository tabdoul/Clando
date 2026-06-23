import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatCardModule],
    templateUrl: './landing.html',
    styleUrl: './landing.css'
})
export class LandingComponent {}