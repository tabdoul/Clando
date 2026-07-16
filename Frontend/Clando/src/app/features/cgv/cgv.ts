import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-cgv',
    standalone: true,
    imports: [RouterLink, MatButtonModule, MatIconModule],
    templateUrl: './cgv.html',
    styleUrl: './cgv.css',
})
export class CgvComponent {}
