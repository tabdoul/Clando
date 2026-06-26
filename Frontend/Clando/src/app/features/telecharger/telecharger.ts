import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'app-telecharger',
    standalone: true,
    imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatCardModule],
    templateUrl: './telecharger.html',
    styleUrl: './telecharger.css'
})
export class TelechargerComponent {
    apkUrl = 'https://expo.dev/accounts/th_abdoul/projects/clando-mobile';
}