import { Component, inject } from '@angular/core';
import { HeaderSignComponent } from '../header-sign/header-sign.component';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { ImpressComponent } from '../impress/impress.component';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    HeaderSignComponent,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    MatCheckboxModule,
    ImpressComponent
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  authService = inject(AuthService);
  fb = inject(NonNullableFormBuilder)
  router = inject(Router);
  form = {
    checked: false
  };

  userForm = this.fb.group({
    username: this.fb.control('', {validators: [Validators.required, Validators.minLength(4)]}),
    email: this.fb.control('', {validators: [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)]}),
    password: this.fb.control('', {validators: [Validators.required, Validators.minLength(6)]}),
    checkbox: this.fb.control('', {validators: [Validators.required]}),
  });


  constructor() {
  }


  test() {
   // console.log(this.form.checked);
  }

  
  onSubmit(): void {
    let user = this.userForm.getRawValue()    
    this.authService.saveRegistrationData(user.email, user.username, user.password);
    this.router.navigate(['/avatar']);
    this.authService.errorMessage = '';
  }
}
