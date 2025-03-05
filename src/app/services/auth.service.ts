import { forwardRef, Inject, inject, Injectable, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateEmail,
  updateProfile,
  UserCredential,
  UserInfo,
} from '@angular/fire/auth';
import { from, Observable } from 'rxjs';
import { User } from '../models/user.model';
import { FirebaseService } from './firebase.service';
import { UserInterface } from '../interfaces/user';
import { Router } from '@angular/router';
import { ChannelService } from './channel.service';
import {
  collection,
  DocumentData,
  Firestore,
  onSnapshot,
  query,
  QuerySnapshot,
  where,
} from '@angular/fire/firestore';
import { Channel } from '../models/channel.model';
import { ConversationService } from './conversation.service';
import { UserDataService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  auth = inject(Auth);
  router = inject(Router);
  currentRegData!: {
    email: any;
    username: string;
    password: string;
    response?: UserCredential;
  };
  currentUserSig = signal<UserInterface | null | undefined>(undefined);
  currentCredentials!: UserCredential;
  showAnimation: boolean = true;
  errorMessage: string = '';
  errorCode!: string;
  guestLoggedIn: boolean = false;
  currentUser: any = null;
  passwordWrong: boolean = false;

  constructor(
    private fireService: FirebaseService,
    private firestore: Firestore
  ) { }

  /**
   * Temporarily stores the user's registration data in an instance variable.
   * This data can be used to further process the user after registration.
   * @param email The user's email address.
   * @param username The username of the user.
   * @param password The user's password.
   */
  saveRegistrationData(email: string, username: string, password: string) {
    this.currentRegData = { email, username, password };
  }

  /**
   * Retrieves the currently logged in user's information from the Firestore database.
   * Uses the user's UID to identify their record.
   */
  getCurrentUserData() {
    this.fireService.getCurrentUser(this.currentUserSig()?.uid as string);
  }

  /**
   * Registers a new user with email, username, password and avatar.
   * After successful registration, the user is created, his profile data is updated,
   * and it saved in the Firestore database.
   * @param email The user's email address.
   * @param username The username of the user.
   * @param password The user's password.
   * @param avatar The URL of the new user's avatar.
   * @returns An Observable that signals registration completion.
   */
  register(
    email: string,
    username: string,
    password: string,
    avatar: string
  ): Observable<void> {
    const promise = createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    ).then((response) => {
      this.handleUserData(response, email, username, password, avatar);
    });
    return from(promise);
  }

  /**
   * Processes user data after successful registration.
   * Updates the user's profile with a username and avatar,
   * and saves the new user data in the Firestore database.
   * @param response The registration process response containing the user information.
   * @param email The user's email address..
   * @param username The username of the user.
   * @param password The user's password.
   * @param avatar The URL of the new user's avatar.
   */
  handleUserData(
    response: UserCredential,
    email: string,
    username: string,
    password: string,
    avatar: string
  ) {
    // if(username === 'Gast') {
    //   avatar = '/img/avatars/avatar_default.png'
    // }
    updateProfile(response.user, {
      displayName: username,
      photoURL: avatar,
    });
    this.saveNewUserInFirestore(email, username, response.user.uid, avatar);
  }

  /**
   * Updates the authenticated user's profile in Firebase Authentication.
   * Changes the display name and avatar URL for the current user.
   * @param username The new display name for the user.
   * @param avatar The new avatar URL for the user.
   */
  changeDatainAuthProfile(username: string, avatar: string) {
    let user = this.auth.currentUser;
    if (user) {
      updateProfile(user, {
        displayName: username,
        photoURL: avatar,
      });
    }
  }

  /**
   * Verifies the user's identity by re-authenticating them with their current password.
   * If successful, sends an email verification and updates the email address.
   * @param user The current authenticated user.
   * @param email The new email address to be set.
   * @param currentPassword The user's current password for re-authentication.
   */
  verifyAndUpdateEmail(user: any, email: string, currentPassword: string) {
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );

    reauthenticateWithCredential(user, credential)
      .then(() => {
        // Sends a verification email before updating the email address
        sendEmailVerification(user)
          .then(() => {
            // Delays the email update slightly to allow verification processing
            setTimeout(() => {
              this.updateEmail(user, email);
            }, 1000);
          })
          .catch((error) => {
            console.error('Error sending verification email:', error);
          });
      })
      .catch((error) => {
        console.error('Error during re-authentication:', error);
      });
  }

  /**
   * Updates the user's email address in Firebase Authentication.
   * @param user The current authenticated user.
   * @param email The new email address to be updated.
   */
  updateEmail(user: any, email: string) {
    updateEmail(user, email)
      .then(() => {
        console.log('Email updated successfully.');
      })
      .catch((error) => {
        console.log('error', error);
      });
  }


  /**
   * Creates and saves a new user entry in the Firestore database.
   * Sets default values ​​for new users, such as role and channels.
   * @param email The user's email address.
   * @param username The username of the user.
   * @param uid The user's unique user ID (UID).
   * @param avatar The URL of the user's avatar.
   * @returns A promise that signals the completion of the save process.
   */
  async saveNewUserInFirestore(
    email: string,
    username: string,
    uid: string,
    avatar: string
  ) {
    let newUser = new User();
    newUser.avatar = avatar;
    newUser.email = email;
    newUser.username = username;
    newUser.uid = uid;
    newUser.channels = [];
    newUser.role = 'user';
    await this.fireService.addUser(newUser);
  }

  /**
   * Authenticates a user with an email address and password.
   * After successful login, the user data is set, the status is updated,
   * and the user will be redirected to the main page.
   * @param email The user's email address.
   * @param password The user's password.
   * @returns An Observable that contains the success or failure of the login.
   */
  login(email: string, password: string) {
    const promise = signInWithEmailAndPassword(this.auth, email, password).then(
      (userCredential) => {
        // Signed in
        this.currentCredentials = userCredential;
        this.setCurrentUserData(this.currentCredentials.user);
        this.fireService.setUserStatus(this.currentCredentials, 'online');
        this.getCurrentUserData();
        this.router.navigate(['/main']);
      }
    );

    return from(promise);
  }

  /**
   * Performs a guest login with predefined credentials.
   * Sets the guest's status and forwards it after a successful login.
   */
  guestLogin() {
    const guestEmail = 'gast@mail.com';
    const guestPassword = 'gast123';
    this.guestLoggedIn = true;
    this.login(guestEmail, guestPassword);
  }

  ///////////////////////////////////////////////////////////////////
  // signInAnonymously() {
  //   signInAnonymously(this.auth)
  //     .then(() => {
  //       // Signed in..
  //       this.setGuestData();
  //       this.router.navigate(['/main']);
  //     })
  //     .catch((error) => {
  //       this.errorCode = error.code;
  //       this.errorMessage = error.message;
  //       // ...
  //     });
  // }
  /////////////////////////////////////////////////////////////////

  /**
   * Signs the user in using a Google account.
   * Creates a new user in the Firestore database if it does not already exist.
   * Updates the user's status and redirects them to the main page.
   * In the event of errors, a corresponding error message is saved.
   */
  signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(this.auth, provider)
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        this.currentCredentials = result;
        if (
          result.user.email &&
          result.user.displayName &&
          result.user.photoURL
        ) {
          this.saveNewUserInFirestore(
            result.user.email,
            result.user.displayName,
            result.user.uid,
            result.user.photoURL
          );
          this.setCurrentUserData(result.user);
          this.fireService.setUserStatus(result, 'online');
          this.router.navigate(['/main']);
        }
        const user = result.user;
      })
      .catch((error) => {
        this.errorCode = error.code;
        this.errorMessage = error.message;
        const email = error.customData.email;
        const credential = GoogleAuthProvider.credentialFromError(error);
      });
  }

  /**
   * Logs out the current user and sets the status to "offline".
   * Removes the current login details and navigates to the home page.
   * If errors occur, the error is logged.
   * @throws Error setting status or logging out.
   */
  async signOut() {
    try {
      await this.fireService.setUserStatus(this.currentCredentials, 'offline');
      await signOut(this.auth);
      this.router.navigateByUrl('');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Stores the current user's data in a signal structure.
   * @param user A user object that contains information such as email, username, UID, and avatar.
   */
  setCurrentUserData(user: any) {
    this.currentUserSig.set({
      email: user.email!,
      username: user.displayName!,
      uid: user.uid!,
      avatar: user.photoURL!,
    });
  }

  /**
   * Sets default data for a guest user in a signal structure.
   * Guest users do not have an email address or UID.
   */
  setGuestData() {
    this.currentUserSig.set({
      email: 'Keine email',
      username: 'Gast',
      uid: '',
      avatar: 'img/avatars/avatar_default.png',
    });
  }
  /**
   * Initializes authentication monitoring and sets user status based
   * on the authentication change. If a user is logged in, relevant
   * Data loaded. Otherwise the user data will be removed.
   */
  initialize() {
    const auth = getAuth();

    onAuthStateChanged(this.auth, (user) => {
      this.fireService.unsubscribeAll();

      if (user) {
        this.setCurrentUserData(user);
        this.currentUser = user;
        this.fireService.initializeData(user.uid);
      } else {
        this.currentUserSig.set(null);
      }
    });
  }

/**
   * Sends an email to reset the password.
   * After successful submission, user will be redirected to home page.
   * @param email The email address to send the password reset email to.
   * @returns A Promise that either succeeds or returns an error.
   * @throws Error sending email.
   */
  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 4000);
    } catch (error) {
      throw error;
    }
  }

  // checkPassword(email: string, password: string): Promise<void> {
  //   const user = this.auth.currentUser;
  //   if (!user) {
  //     return Promise.reject('Kein Nutzer angemeldet.');
  //   }

  //   const credential = EmailAuthProvider.credential(email, password);
  //   return reauthenticateWithCredential(user, credential)
  //     .then(() => {
  //       this.passwordWrong = false;
  //     })
  //     .catch((error) => {
  //       if (error.code === 'auth/wrong-password') {
  //         this.passwordWrong = true; // Erwarte falsches Passwort, kein echtes "Problem"
  //       } else {
  //         // Nur unerwartete Fehler wirklich loggen
  //         console.error('Ein unerwarteter Fehler ist aufgetreten:', error);
  //       }
  //       return Promise.resolve(); // WICHTIG: Verhindert unhandled Promise rejections
  //     });
  // }

}
