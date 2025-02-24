import { Component, inject } from '@angular/core';
import { HeaderSignComponent } from '../header-sign/header-sign.component';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-select-avatar',
  standalone: true,
  imports: [
    HeaderSignComponent,
    RouterLink,
    CommonModule
  ],
  templateUrl: './select-avatar.component.html',
  styleUrl: './select-avatar.component.scss'
})
export class SelectAvatarComponent {
  authService = inject(AuthService);
  router = inject(Router);
  currentData = this.authService.currentRegData;
  avatarIcons: string[] = [
    "img/avatars/avatar_big_0.png",
    "img/avatars/avatar_big_1.png",
    "img/avatars/avatar_big_2.png",
    "img/avatars/avatar_big_3.png",
    "img/avatars/avatar_big_4.png",
    "img/avatars/avatar_big_5.png",
  ];
  chosenAvatar!: string;
  registrationFailed: boolean = false;
  errorMassage: String = '';
  selectedFile?: File;
  downloadURL?: string;
  storageService = inject(StorageService);

  constructor() { }

/**
 * Funktion zum Triggern des versteckten Datei-Inputs.
 * Findet den Datei-Input-Element im DOM und simuliert einen Klick darauf, um die Datei-Auswahl zu starten.
 */  triggerFileInput(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLElement;
    fileInput.click();
  }


/**
 * Event-Handler für das Selektieren einer Datei.
 * Überprüft, ob eine Datei ausgewählt wurde, und ruft `uploadFile()` auf, um die Datei zu speichern und hochzuladen.
 * 
 * @param {Event} event - Das Event-Objekt, das durch das Selektieren einer Datei ausgelöst wird.
 */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadFile();
    }
  }


/**
 * Funktion zum Hochladen einer Datei in Firebase Storage.
 * Bestimmt den Speicherort der Datei und verwendet `uploadFile` aus dem `storageService`, um die Datei hochzuladen.
 * Auf Erfolgreichmeldung wird die Download-URL gespeichert, andernfalls wird der Fehler in der Konsole ausgegeben.
 */
  uploadFile(): void {
    if (this.selectedFile) {
      const filePath = `uploads/${this.selectedFile.name}`; // Speicherort in Firebase Storage
      this.storageService.uploadFile(filePath, this.selectedFile)
        .subscribe(
          (url) => this.downloadURL = url,
          (error) => console.error('Upload error:', error)
        );
    }
  }

/**
 * Setzt das Avatar-Bild für den Benutzer.
 * 
 * @param {string} avatar - Die URL des Avatar-Bildes.
 */
  setAvatar(avatar: string) {
    this.chosenAvatar = avatar;
  }

/**
 * Sendet das Registrierungsformular.
 * Überprüft, ob die E-Mail bereits in Gebrauch ist, und navigiert entsprechend. Falls ein Fehler auftritt, wird eine Fehlermeldung angezeigt.
 */
  submitRegistration(): void {
    this.authService.register(this.currentData.email, this.currentData.username, this.currentData.password, this.chosenAvatar)
      .subscribe({
        next: () => {
          this.authService.login(this.currentData.email, this.currentData.password);
        },

        error: (err) => {
          console.log(err.code);
          if (err.code === 'auth/email-already-in-use') {
            this.registrationFailed = true;
            this.authService.errorMessage = 'Email existiert bereits!';
          } else {
            this.registrationFailed = true;
            this.authService.errorMessage = 'Irgendetwas ist schief gelaufen!';
          }
          this.router.navigateByUrl('/register');
        }
      })
  }


}
