import { Component, inject } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { EditProfileComponent } from '../edit-profile/edit-profile.component';
import { MyProfilComponent } from '../my-profil/my-profil.component';
import { UserDataService } from '../../services/user.service';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-profil-button-mobile',
  standalone: true,
  imports: [],
  templateUrl: './profil-button-mobile.component.html',
  styleUrl: './profil-button-mobile.component.scss'
})
export class ProfilButtonMobileComponent {
  private _bottomSheetRef =
    inject<MatBottomSheetRef<ProfilButtonMobileComponent>>(MatBottomSheetRef);
  readonly dialog = inject(MatDialog);


  /**
 * Constructor for the component.
 * Initializes authentication and Firebase services.
 * 
 * @param {AuthService} authService - Service for handling authentication-related operations.
 * @param {FirebaseService} firebaseService - Service for handling Firebase-related operations.
 */
  constructor(private authService: AuthService, public firebaseService: FirebaseService) { }

  /**
   * Handles user actions based on the provided status.
   * Closes the bottom sheet, logs out the user if the status is 'logout',
   * or opens the Edit Profile dialog if the status is 'profil'.
   * 
   * @param {MouseEvent} event - The mouse event triggered by the user interaction.
   * @param {'profil' | 'logout'} [status] - The action to perform: 'profil' to edit the profile or 'logout' to log out.
   * @returns {Promise<void>} Resolves when the logout process is complete, if applicable.
   */
  async openLink(event: MouseEvent, status?: 'profil' | 'logout'): Promise<void> {
    this._bottomSheetRef.dismiss();
    event.preventDefault();

    if (status === 'logout') {
      const currentUser = this.authService.currentCredentials;
      //console.log(currentUser);

      await this.authService.signOut();
    }

    if (status === 'profil') {
      this.openEditProfilDialog();
    }
  }

  /**
   * Opens the Edit Profile dialog.
   * Configures the dialog's width and maximum width.
   */
  openEditProfilDialog() {
    const dialogRef = this.dialog.open(MyProfilComponent, {
      width: '100%',
      maxWidth: '873px',
    });
  }

}
