import { Component } from '@angular/core';
import { HeaderSignComponent } from '../../header-sign/header-sign.component';
import { RouterLink } from '@angular/router';
import { BreakpointObserverService } from '../../../services/breakpoint-observer.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [
    HeaderSignComponent,
    RouterLink,
    CommonModule
  ],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss'
})
export class PrivacyPolicyComponent {


  constructor(public breakpointObserver: BreakpointObserverService) {

  }
}
