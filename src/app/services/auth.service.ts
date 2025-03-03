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
   * Speichert die Registrierungsdaten des Benutzers vorübergehend in einer Instanzvariablen.
   * Diese Daten können verwendet werden, um den Benutzer nach der Registrierung weiter zu verarbeiten.
   * @param email Die E-Mail-Adresse des Benutzers.
   * @param username Der Benutzername des Benutzers.
   * @param password Das Passwort des Benutzers.
   */
  saveRegistrationData(email: string, username: string, password: string) {
    this.currentRegData = { email, username, password };
  }

  /**
   * Ruft die Daten des aktuell angemeldeten Benutzers aus der Firestore-Datenbank ab.
   * Verwendet die UID des Benutzers, um dessen Datensatz zu identifizieren.
   */
  getCurrentUserData() {
    this.fireService.getCurrentUser(this.currentUserSig()?.uid as string);
  }

  /**
   * Registriert einen neuen Benutzer mit E-Mail, Benutzername, Passwort und Avatar.
   * Nach erfolgreicher Registrierung wird der Benutzer erstellt, seine Profildaten aktualisiert,
   * und er in der Firestore-Datenbank gespeichert.
   * @param email Die E-Mail-Adresse des neuen Benutzers.
   * @param username Der Benutzername des neuen Benutzers.
   * @param password Das Passwort des neuen Benutzers.
   * @param avatar Die URL des Avatars des neuen Benutzers.
   * @returns Ein Observable, das den Abschluss der Registrierung signalisiert.
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
   * Verarbeitet die Benutzerdaten nach erfolgreicher Registrierung.
   * Aktualisiert das Profil des Benutzers mit einem Benutzernamen und einem Avatar,
   * und speichert die neuen Benutzerdaten in der Firestore-Datenbank.
   * @param response Die Antwort des Registrierungsprozesses, die die Benutzerinformationen enthält.
   * @param email Die E-Mail-Adresse des Benutzers.
   * @param username Der Benutzername des Benutzers.
   * @param password Das Passwort des Benutzers.
   * @param avatar Die URL des Avatars des Benutzers.
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

  changeDatainAuthProfile(username: string, avatar: string) {
    let user = this.auth.currentUser;
    if (user) {
      updateProfile(user, {
        displayName: username,
        photoURL: avatar,
      });
    }
  }

  verifyAndUpdateEmail(user: any, email: string, currentPassword: string) {
    // Re-Authentifiziere den Benutzer
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    // console.log(user);

    reauthenticateWithCredential(user, credential)
      .then(() => {
        // console.log('Re-authentication successful.');

        // Sende eine Verifizierungs-E-Mail
        sendEmailVerification(user)
          .then(() => {
            //console.log( 'Verification email sent. Please verify your new email address.' );

            // Nach Verifizierung E-Mail-Adresse aktualisieren
            setTimeout(() => {
              this.updateEmail(user, email);
            }, 1000); // Simulierter Ablauf, in Realität auf tatsächliche Verifizierung warten
          })
          .catch((error) => {
            console.error('Error sending verification email:', error);
          });
      })
      .catch((error) => {
        console.error('Error during re-authentication:', error);
      });
  }

  updateEmail(user: any, email: string) {
    // Update email
    updateEmail(user, email)
      .then(() => {
        console.log('Email updated successfully.');
      })
      .catch((error) => {
        // An error occurred
        console.log('error', error);
      });
  }

  /**
   * Erstellt und speichert einen neuen Benutzereintrag in der Firestore-Datenbank.
   * Setzt Standardwerte für neue Benutzer, wie beispielsweise die Rolle und Kanäle.
   * @param email Die E-Mail-Adresse des Benutzers.
   * @param username Der Benutzername des Benutzers.
   * @param uid Die eindeutige Benutzer-ID (UID) des Benutzers.
   * @param avatar Die URL des Avatars des Benutzers.
   * @returns Eine Promise, die den Abschluss des Speicherprozesses signalisiert.
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
   * Authentifiziert einen Benutzer mit einer E-Mail-Adresse und einem Passwort.
   * Nach erfolgreichem Login werden die Benutzerdaten gesetzt, der Status aktualisiert,
   * und der Benutzer wird auf die Hauptseite weitergeleitet.
   * @param email Die E-Mail-Adresse des Benutzers.
   * @param password Das Passwort des Benutzers.
   * @returns Ein Observable, das den Erfolg oder Fehler des Logins enthält.
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
   * Führt einen Gast-Login mit vordefinierten Zugangsdaten aus.
   * Setzt den Status des Gastes und leitet ihn nach erfolgreichem Login weiter.
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
   * Meldet den Benutzer über ein Google-Konto an.
   * Erstellt einen neuen Benutzer in der Firestore-Datenbank, falls dieser noch nicht existiert.
   * Aktualisiert den Status des Benutzers und leitet ihn auf die Hauptseite weiter.
   * Bei Fehlern wird eine entsprechende Fehlermeldung gespeichert.
   */
  signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(this.auth, provider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        this.currentCredentials = result;
        // The signed-in user info.
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
        // IdP data available using getAdditionalUserInfo(result)
        // ...
      })
      .catch((error) => {
        // Handle Errors here.
        this.errorCode = error.code;
        this.errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
      });
  }

  /**
   * Meldet den aktuellen Benutzer ab und setzt den Status auf "offline".
   * Entfernt die aktuellen Anmeldedaten und navigiert zur Startseite.
   * Bei Fehlern wird der Fehler protokolliert.
   * @throws Fehler beim Setzen des Status oder beim Abmelden.
   */
  async signOut() {
    try {
      // Setze den Benutzerstatus auf "offline", bevor der Logout erfolgt.
      await this.fireService.setUserStatus(this.currentCredentials, 'offline');
      // Führe den eigentlichen Logout durch.
      await signOut(this.auth);
      // Navigiere zur Startseite nach erfolgreichem Logout.
      this.router.navigateByUrl('');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Speichert die Daten des aktuellen Benutzers in einer Signalstruktur.
   * @param user Ein Benutzerobjekt, das Informationen wie E-Mail, Benutzername, UID und Avatar enthält.
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
   * Setzt Standarddaten für einen Gastbenutzer in einer Signalstruktur.
   * Gastbenutzer haben keine E-Mail-Adresse oder UID.
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
   * Initialisiert die Authentifizierungsüberwachung und setzt den Benutzerstatus basierend
   * auf der Authentifizierungsänderung. Falls ein Benutzer eingeloggt ist, werden relevante
   * Daten geladen. Andernfalls werden die Benutzerdaten entfernt.
   */
  initialize() {
    const auth = getAuth();

    onAuthStateChanged(this.auth, (user) => {
      // Entferne alle Listener, sobald der Auth-Status sich ändert
      this.fireService.unsubscribeAll();

      if (user) {
        this.setCurrentUserData(user);
        this.currentUser = user;

        // Lade alle relevanten Daten
        this.fireService.initializeData(user.uid);
      } else {
        // User wird ausgeloggt
        this.currentUserSig.set(null);
      }
    });
  }

  /**
   * Sendet eine E-Mail, um das Passwort zurückzusetzen.
   * Nach erfolgreichem Senden wird der Benutzer zur Startseite weitergeleitet.
   * @param email Die E-Mail-Adresse, an die die Passwort-Zurücksetzungs-E-Mail gesendet werden soll.
   * @returns Eine Promise, die entweder erfolgreich ist oder einen Fehler zurückgibt.
   * @throws Fehler beim Senden der E-Mail.
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
