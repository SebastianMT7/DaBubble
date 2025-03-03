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
   * Called when the component is initialized.
   * Checks if the current user is logged in. If true, the user is redirected to the main view.
   */
    ngOnInit() {
      if (this.authService.currentUserSig()) {
        this.router.navigate(['/main']);
      }
    }
  
    /**
     * Handles user login.
     * Retrieves user data from the form and calls the `login` method from the `authService`.
     * Subscribes to the login process.
     * On successful login, the user is redirected to the main view.
     * On error, appropriate error messages are set and displayed.
     */
    login(): void {
      let user = this.userForm.getRawValue();
      this.loginFailed = false;
      this.errorEmail = false;
      this.errorPassword = false;
      this.authService.login(user.email, user.password)
        .subscribe({
          next: () => {},
          error: (err) => {          
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
        });
    }
  
    /**
     * Handles guest login.
     * Executes the guest login process. 
     * On successful login, the user is redirected to the main view.
     * On error, the login attempt is marked as failed.
     */
    async guestLogin() {
      try {
        await this.authService.guestLogin();
        this.router.navigate(['/main']);
      } catch (error) {
        this.loginFailed = true;
      }
    }
  
    /**
     * Removes the email error message.
     */
    removeErrorMsgEmail() {
      this.errorEmail = false;
    }
  
    /**
     * Removes the password error message.
     */
    removeErrorMsgPwt() {
      this.errorPassword = false;
    }
  }