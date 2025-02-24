import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { user } from '@angular/fire/auth';
import { BreakpointObserverService } from '../../services/breakpoint-observer.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [MatDialogModule,CommonModule ],
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class ProfilComponent {
  isHoveredClose = false;

  constructor( public dialogRef: MatDialogRef<ProfilComponent>,  @Inject(MAT_DIALOG_DATA) public data:any, public breakpointObserver: BreakpointObserverService){
    
  }

  closeMyProfil(): void {
    this.dialogRef.close();
  }
}
