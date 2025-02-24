import { Component, inject, OnInit } from '@angular/core';
import { HeaderSignComponent } from '../header-sign/header-sign.component';
import { AuthService } from '../../services/auth.service';
import { FirebaseService } from '../../services/firebase.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { IntroAnimationComponent } from '../intro-animation/intro-animation.component';
import { CommonModule } from '@angular/common';
import { ImpressComponent } from '../impress/impress.component';
import { BreakpointObserverService } from '../../services/breakpoint-observer.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    HeaderSignComponent,
    ImpressComponent,
    FormsModule,
    IntroAnimationComponent,
    ReactiveFormsModule,
    CommonModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})


export class LoginComponent implements OnInit {
  authService = inject(AuthService);
  fireService = inject(FirebaseService);
  router = inject(Router);
  fb = inject(NonNullableFormBuilder)
  errorMessage: string | null = null;
  loginFailed: boolean = false;
  errorEmail: boolean = false;
  errorPassword: boolean = false;

  userForm = this.fb.group({
    email: this.fb.control('', { validators: [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)] }),
    password: this.fb.control('', { validators: [Validators.required, Validators.minLength(6)] })
  });


  constructor(public breakpointObserver: BreakpointObserverService) {
    this.authService.errorMessage = '';
  }

  /**
   * Aufgerufen beim Initialisieren der Komponente. 
   * Überprüft, ob der aktuelle Benutzer angemeldet ist. Wenn ja, wird der Benutzer zur Hauptansicht weitergeleitet.
   */
  ngOnInit() {
    if (this.authService.currentUserSig()) {
      this.router.navigate(['/main']);
    }
  }


  // guestLogin() {
  //   this.authService.signInAnonymously();
  // }


  /**
   * Methode zur Anmeldung eines Benutzers.
   * Erstellt einen Benutzer-Objekt aus dem Formular und ruft die `login`-Methode des `authService` auf.
   * Abonniert die Rückmeldungen des Login-Vorgangs.
   * Bei erfolgreichem Login wird der Benutzer zur Hauptansicht weitergeleitet.
   * Bei Fehlern werden entsprechende Fehlermeldungen gesetzt und angezeigt.
   */
  login(): void {
    let user = this.userForm.getRawValue()
    this.loginFailed = false;
    this.errorEmail = false;
    this.errorPassword = false;
    this.authService.login(user.email, user.password)
      .subscribe({
        next: () => {

        },

        error: (err) => {
          //console.log(err.code);          
          if (err.code === "auth/user-not-found") {
            this.loginFailed = true;
            this.errorEmail = true;
            this.userForm.get('password')?.reset();
          }
          if (err.code === "auth/wrong-password") {
            this.loginFailed = true;
            this.errorPassword = true;
            this.userForm.get('password')?.reset();
          }
        }
      })
    // .pipe(
    //   catchError((error) => {
    //     this.loginFailed = true;
    //     console.log('loginFailed', this.loginFailed);

    //     return of(null);  
    //   })
    // )
    // .subscribe(() => {
    // })
  }

  /**
   * Methode zur Durchführung der Anmeldung als Gast.
   * Führt den Gast-Login-Vorgang aus und bei erfolgreichem Login wird der Benutzer zur Hauptansicht weitergeleitet.
   * Bei Fehlern wird der Login-Versuch als fehlgeschlagen markiert.
   */
  async guestLogin() {
    try {
      await this.authService.guestLogin();
      this.router.navigate(['/main']);
    } catch (error) {
      this.loginFailed = true;
    }
  }

  removeErrorMsgEmail() {
    this.errorEmail = false;
  }

  removeErrorMsgPwt() {
    this.errorPassword= false;
  }
}
