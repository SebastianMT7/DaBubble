import { Component } from '@angular/core';
import { HeaderSignComponent } from '../../header-sign/header-sign.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-imprint',
  standalone: true,
  imports: [
    HeaderSignComponent,
    RouterLink
  ],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss'
})
export class ImprintComponent {

}
