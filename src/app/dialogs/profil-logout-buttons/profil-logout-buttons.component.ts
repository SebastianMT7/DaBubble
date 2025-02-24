import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
 

@Component({
  selector: 'app-profil-logout-buttons',
  standalone: true,
  imports: [CommonModule,MatDialogModule],
  templateUrl: './profil-logout-buttons.component.html',
  styleUrl: './profil-logout-buttons.component.scss'
})
export class ProfilLogoutButtonsComponent {
 
}
