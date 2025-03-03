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
   * Triggers the hidden file input.
   * Finds the file input element in the DOM and simulates a click to open the file selection dialog.
   */
  triggerFileInput(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLElement;
    fileInput.click();
  }

  /**
   * Event handler for file selection.
   * Checks if a file has been selected and calls `uploadFile()` to save and upload the file.
   * 
   * @param {Event} event - The event object triggered by selecting a file.
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadFile();
    }
  }

  /**
   * Uploads a file to Firebase Storage.
   * Determines the file's storage path and uses `uploadFile` from the `storageService` to upload the file.
   * On success, the download URL is saved. If an error occurs, it is logged to the console.
   */
  uploadFile(): void {
    if (this.selectedFile) {
      const filePath = `uploads/${this.selectedFile.name}`;
      this.storageService.uploadFile(filePath, this.selectedFile)
        .subscribe(
          (url) => this.downloadURL = url,
          (error) => console.error('Upload error:', error)
        );
    }
  }

  /**
   * Sets the user's avatar image.
   * 
   * @param {string} avatar - The URL of the avatar image.
   */
  setAvatar(avatar: string): void {
    this.chosenAvatar = avatar;
  }

  /**
   * Submits the registration form.
   * Checks if the email is already in use and navigates accordingly. Displays an error message if a problem occurs.
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
            this.authService.errorMessage = 'Email already exists!';
          } else {
            this.registrationFailed = true;
            this.authService.errorMessage = 'Something went wrong!';
          }
          this.router.navigateByUrl('/register');
        }
      });
  }

}
