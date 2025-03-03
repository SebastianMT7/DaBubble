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
 * Sends a password reset link.
 * Checks if a valid email address has been entered. If so, it sends a password reset link to the provided email address.
 * Sets the `emailConfirmed` flag to `true`. If no email address is entered, an alert with the message "ERROR" is displayed.
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
