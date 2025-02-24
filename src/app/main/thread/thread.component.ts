import { Component, inject,ElementRef, ViewChild } from '@angular/core';
import { SendMessageComponent } from '../channel-chat/send-message/send-message.component';
import { MessageThreadComponent } from '../channel-chat/message-thread/message-thread.component';
import { InterfaceService } from '../../services/interface.service';
import { CommonModule } from '@angular/common';
import { SingleMessageComponent } from '../channel-chat/message-thread/single-message/single-message.component';
import { BreakpointObserverService } from '../../services/breakpoint-observer.service';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [SendMessageComponent,SingleMessageComponent, CommonModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent {
  uiService = inject(InterfaceService);
   @ViewChild('textArea') textArea!: ElementRef;

   isHoveredClose = false;

  constructor(public breakpointObserver: BreakpointObserverService, public firebaseService: FirebaseService) {
    this.uiService.showThread = false;
  }
  
  ngAfterViewInit() {
    if (this.textArea) {
      setTimeout(() => {
        this.textArea.nativeElement.focus();
      }, 1);
    }
  }
}
