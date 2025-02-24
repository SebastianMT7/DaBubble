import { Component, inject, ViewEncapsulation, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { Firestore } from '@angular/fire/firestore';
import { User } from '../../models/user.model';
import { getAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [MatDialogModule, CommonModule, FormsModule,],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class EditProfileComponent {
  authService = inject(AuthService);
  firebaseService = inject(FirebaseService);
  user: any;
  currentAvatar:any;
  avatarIcons: string[] = [
    "img/avatars/avatar_big_0.png",
    "img/avatars/avatar_big_1.png",
    "img/avatars/avatar_big_2.png",
    "img/avatars/avatar_big_3.png",
    "img/avatars/avatar_big_4.png",
    "img/avatars/avatar_big_5.png",
  ];

  inputName = '';
  inputEmail = '';
  inputPassword = '';
  isEditingAvatar: boolean = false;
  validUsername: boolean = true;
  showPasswordInput: boolean = false;
  isHoveredClose: boolean = false;
  passwordWrong = computed(() => this.authService.passwordWrong()); // Signal als computed-Wert
  /**
 * Constructor for the EditProfileComponent.
 * Retrieves the current user's ID, subscribes to user data from Firebase, 
 * and initializes the input fields with user data after a short delay.
 * 
 * @param {MatDialogRef<EditProfileComponent>} dialogRef - Reference to the dialog instance.
 */
  constructor(public dialogRef: MatDialogRef<EditProfileComponent>) {
    let userId = this.authService.currentUserSig()?.uid;
    this.firebaseService.subscribeUserById(userId);
    this.dialogRef.afterClosed().subscribe(() => {
      this.authService.passwordWrong.set(false);
    });

    setTimeout(() => {
      this.inputName = this.firebaseService.user.username;
      this.inputEmail = this.firebaseService.user.email;
      this.currentAvatar =this.firebaseService.user.avatar;
      this.setUser();
    }, 100);
  }

  verifyPassword() {
    this.showPasswordInput = true;
  }

  /**
   * Updates the user's profile information with the data entered in the input fields 
   * and saves the updated data to Firebase. Closes the dialog after updating.
   */
  // changeProfil() {
  //   this.user.username = this.inputName;
  //   this.user.email = this.inputEmail;
  //   //console.log('inputPasswort:',this.inputPassword )
  //  // console.log('daten',this.authService.auth )
  //   this.authService.checkPassword(this.user.email, this.user.username, this.user.avatar, this.inputPassword)

  //  // this.authService.changeDatainAuthProfile(this.inputName, this.inputEmail, this.user.avatar, this.inputPassword);
  //   this.firebaseService.updateUserData(this.user);
  //   this.authService.currentUserSig.update((user) => {
  //     if (user) {
  //       return { ...user, username: this.inputName, email: this.inputEmail };
  //     }
  //     return user;
  //   });
  //   this.dialogRef.close();
  // }

  changeProfil() {
    this.authService.checkPassword(this.user.email, this.inputPassword)
      .then(() => {
        if (this.passwordWrong()) {
          //console.log('Änderung gestoppt: Falsches Passwort');
          return;
        }

        this.user.username = this.inputName;
        this.user.avatar = this.currentAvatar;
        this.firebaseService.updateUserData(this.user);
        this.authService.changeDatainAuthProfile(this.inputName,this.currentAvatar);
        this.authService.currentUserSig.update((user) => {
          if (user) {
            return { ...user, username: this.inputName, email: this.inputEmail, avatar:this.currentAvatar};
          }
          return user;
        });
        this.firebaseService.updateUserData(this.user);
        this.inputPassword='';
        this.dialogRef.close();
      });
  }

  /**
   * Sets the `user` object with data fetched from Firebase.
   * Initializes user attributes such as UID, username, email, avatar, status, channels, and role.
   * 
   * @returns {void}
   */
  setUser(): any {
    this.user = {
      uid: this.firebaseService.user.uid,
      username: this.firebaseService.user.username,
      email: this.firebaseService.user.email,
      avatar: this.firebaseService.user.avatar,
      status: this.firebaseService.user.status,
      channels: this.firebaseService.user.channels,
      role: this.firebaseService.user.role,
    };
  }

  closeProfil(): void {
    this.authService.passwordWrong.set(false);
    this.dialogRef.close();
  }

  checkUsername(){
   // console.log(this.inputName.trim().length)
    if(this.inputName.trim().length>0){
      this.validUsername=true;
    }else{
      this.validUsername=false;
    }
  }

showAvatar(){
  this.isEditingAvatar =  true;
}

  selectAvatar(avatar:string){
    this.currentAvatar = avatar;
    this.isEditingAvatar =  false;
  }

}