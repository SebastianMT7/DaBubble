import { Component, inject } from '@angular/core';
import { ChannelChatComponent } from './channel-chat/channel-chat.component';
import { SideNavComponent } from './side-nav/side-nav.component';
import { ThreadComponent } from './thread/thread.component';
import { HeaderComponent } from '../header/header.component';
import { FirebaseService } from '../services/firebase.service';
import { AddPeopleComponent } from '../dialogs/add-people/add-people.component';
import { CommonModule } from '@angular/common';
import { InterfaceService } from '../services/interface.service';
import { AddChannelComponent } from '../dialogs/add-channel/add-channel.component';
import { EditChannelComponent } from '../dialogs/edit-channel/edit-channel.component';
import { ChannelService } from '../services/channel.service';
import { ConversationService } from '../services/conversation.service';
import { AuthService } from '../services/auth.service';
import { BreakpointObserverService } from '../services/breakpoint-observer.service';



@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    HeaderComponent, 
    ChannelChatComponent, 
    SideNavComponent, 
    ThreadComponent, 
    AddPeopleComponent, 
    CommonModule, 
    AddChannelComponent, 
    EditChannelComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  fireService = inject(FirebaseService);
  uiService = inject(InterfaceService);
  channelService = inject(ChannelService);
  convService = inject(ConversationService);

  constructor(public authService: AuthService, public breakpointObserver: BreakpointObserverService) {}


  ngOnInit() {
  }
}
