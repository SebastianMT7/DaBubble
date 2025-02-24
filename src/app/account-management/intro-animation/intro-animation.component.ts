import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
// import { LoginService } from '../../../services/login.service';


@Component({
  selector: 'app-intro-animation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './intro-animation.component.html',
  styleUrl: './intro-animation.component.scss'
})
export class IntroAnimationComponent implements OnInit {
  containerVisible: boolean | undefined | null;
  startAnimation: boolean = false;
  imageLoaded: boolean = false;


  constructor(public authService: AuthService) {
    //console.log(this.containerVisible);
  }

  /**
   * Diese Methode wird beim Initialisieren der Komponente aufgerufen.
   * Sie überprüft, ob `containerVisible` bereits gesetzt ist. Wenn nicht, wird es auf `true` und `showAnimation` des `authService` auf `true` gesetzt. Andernfalls wird `containerVisible` auf `false` und `showAnimation` auf `false` gesetzt. Nach einer Verzögerung von 3500 Millisekunden wird `containerVisible` ebenfalls auf `false` und `showAnimation` auf `false` gesetzt.
   */
  ngOnInit() {
    //console.log(this.containerVisible);

    if (this.containerVisible === undefined) {
      this.containerVisible = true;
      this.authService.showAnimation = true;
    } else {
      this.containerVisible = false;
      this.authService.showAnimation = false;
    }
    setTimeout(() => {
      this.containerVisible = false;
      this.authService.showAnimation = false;
    }, 4000);
  }

  onImageLoad() {
    this.imageLoaded = true;
    setTimeout(() => {
      this.startAnimation = true;
    }, 0); // Animation starten, sobald das Bild geladen ist
  }
}
