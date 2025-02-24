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
 * Handler für das Formular-Sendenereignis.
 * Führt das Zurücksetzen des Passworts durch und leitet dann nach einem Verzögerungszeitraum von 1 Sekunde zur Startseite um.
 */
  onSubmit() {
    this.resetPassword();
    setTimeout(() => {
      this.router.navigate(['/']);
    }, 1000);
  }

/**
 * Asynchrone Methode zum Zurücksetzen des Passworts.
 * Extrahiert den One-Time-Password-Code (oobCode) aus den URL-Parametern und das geänderte Passwort aus dem Formular.
 * Ruft Firebase `confirmPasswordReset` auf, um das Passwort zurückzusetzen.
 * Gibt bei Erfolg eine Erfolgsmeldung aus, andernfalls wird ein Fehler protokolliert.
 * @throws Fehler, falls beim Zurücksetzen des Passworts ein Problem auftritt.
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
 * Überprüft, ob die eingegebenen Passwörter übereinstimmen.
 * Vergleicht die Werte des `firstPassword`-Controls und des `verifyPassword`-Controls.
 * Gibt `null` zurück, wenn die Passwörter übereinstimmen, andernfalls ein Objekt mit der Eigenschaft `notSame`.
 * @param {AbstractControl} control Das aktuelle Formularelement, das überprüft wird.
 * @returns {ValidationErrors | null} Rückgabeobjekt, das `null` bedeutet, wenn die Passwörter übereinstimmen oder ein Fehlerobjekt, wenn nicht.
 */
  private validateSamePassword(control: AbstractControl): ValidationErrors | null {
    const password = control.parent?.get('firstPassword');
    const confirmPassword = control.parent?.get('verifyPassword');
    return password?.value == confirmPassword?.value ? null : { 'notSame': true };
  }
}
