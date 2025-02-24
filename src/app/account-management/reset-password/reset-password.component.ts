import { Component, inject } from '@angular/core';
import { HeaderSignComponent } from '../header-sign/header-sign.component';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { ImpressComponent } from '../impress/impress.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    HeaderSignComponent,
    ReactiveFormsModule,
    CommonModule,
    RouterLink,
    ImpressComponent
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  authService = inject(AuthService);
  router = inject(Router)
  emailForm = new FormControl('', [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)]);
  emailConfirmed: boolean;


  constructor() {
    this.emailConfirmed = false;
  }

  /**
   * Methode zum Senden eines Passwort-Reset-Links.
   * Überprüft, ob eine gültige E-Mail-Adresse eingegeben wurde. Wenn ja, sendet einen Passwort-Reset-Link an diese E-Mail-Adresse.
   * Setzt das Flag `emailConfirmed` auf `true`. Wenn keine E-Mail-Adresse eingegeben wurde, zeigt ein Alert mit der Nachricht "ERROR".
   */
  onSubmit() {
    if (this.emailForm.value) {
      let email: string = this.emailForm.value;
      this.emailConfirmed = true;
      this.authService.sendPasswordReset(email);
    } else {
      alert('ERROR')
    }
  }
}
