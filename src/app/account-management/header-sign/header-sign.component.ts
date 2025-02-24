import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-header-sign',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './header-sign.component.html',
  styleUrl: './header-sign.component.scss'
})
export class HeaderSignComponent {
  router = inject(Router)

}
