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
  }

  /**
   * This method is called when the component is initialized.
   * It checks whether `containerVisible` is already set. If not, it sets it to `true` and also sets `showAnimation` in the `authService` to `true`.
   * Otherwise, it sets both `containerVisible` and `showAnimation` to `false`.
   * After a delay of 4000 milliseconds, it ensures that both `containerVisible` and `showAnimation` are set to `false`.
   */
  ngOnInit() {
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

  /**
   * Called when an image has finished loading.
   * It sets `imageLoaded` to `true` and triggers the animation by setting `startAnimation` to `true` after a short delay.
   */
  onImageLoad() {
    this.imageLoaded = true;
    setTimeout(() => {
      this.startAnimation = true;
    }, 0); 
  }
}

