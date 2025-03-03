import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HeaderSignComponent } from '../header-sign/header-sign.component';
import { confirmPasswordReset, getAuth } from '@angular/fire/auth';
import { ImpressComponent } from '../impress/impress.component';

@Component({
  selector: 'app-new-password',
  standalone: true,
  imports: [
    HeaderSignComponent,
    ReactiveFormsModule,
    CommonModule,
    RouterLink,
    ImpressComponent
  ],
  templateUrl: './new-password.component.html',
  styleUrl: './new-password.component.scss'
})
export class NewPasswordComponent {
  fb = inject(NonNullableFormBuilder);
  router = inject(Router);

  resetPasswordForm = this.fb.group({
    firstPassword: this.fb.control('', { validators: [Validators.required, Validators.minLength(6)] }),
    verifyPassword: this.fb.control('', { validators: [Validators.required, Validators.minLength(6), this.validateSamePassword] })
  });

/**
 * Handler for the form submit event.
 * Executes the password reset process and redirects to the homepage after a 1-second delay.
 */
onSubmit() {
  this.resetPassword();
  setTimeout(() => {
    this.router.navigate(['/']);
  }, 1000);
}

/**
 * Asynchronous method to reset the password.
 * Extracts the one-time password code (oobCode) from the URL parameters and the new password from the form.
 * Calls Firebase's `confirmPasswordReset` to reset the password.
 * Logs a success message on completion or an error in case of failure.
 * @throws Error if an issue occurs during the password reset process.
 */
async resetPassword(): Promise<void> {
  const auth = getAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const oobCode = urlParams.get('oobCode');
  let changedPassword = this.resetPasswordForm.get('firstPassword')?.value;

  if(oobCode && changedPassword) {
    try {
      await confirmPasswordReset(auth, oobCode, changedPassword);
      //console.log("Passwort erfolgreich zurückgesetzt.");
    } catch (error) {
      console.error("Fehler beim Zurücksetzen des Passworts:", error);
      throw error;
    }
  }
}

/**
 * Checks if the entered passwords match.
 * Compares the values of the `firstPassword` and `verifyPassword` input fields.
 * Returns `null` if the passwords match, otherwise an object with the `notSame` property.
 * @param {AbstractControl} control - The current form control being validated.
 * @returns {ValidationErrors | null} - `null` if the passwords match, or an error object if they do not.
 */
private validateSamePassword(control: AbstractControl): ValidationErrors | null {
  const password = control.parent?.get('firstPassword');
  const confirmPassword = control.parent?.get('verifyPassword');
  return password?.value == confirmPassword?.value ? null : { 'notSame': true };
}

}
