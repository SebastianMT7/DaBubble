import { Component, inject } from '@angular/core';
import { SingleMemberComponent } from './single-member/single-member.component';
import { MatDialogModule } from '@angular/material/dialog';
import { ChannelService } from '../../services/channel.service';
import { user } from '@angular/fire/auth';
import { elementAt } from 'rxjs';
import { FirebaseService } from '../../services/firebase.service';
import { CommonModule } from '@angular/common';
import { BreakpointObserverService } from '../../services/breakpoint-observer.service';
import { InterfaceService } from '../../services/interface.service';

@Component({
  selector: 'app-show-member-in-channel',
  standalone: true,
  imports: [SingleMemberComponent, MatDialogModule, CommonModule],
  templateUrl: './show-member-in-channel.component.html',
  styleUrl: './show-member-in-channel.component.scss',
})
export class ShowMemberInChannelComponent {
  channel: any;
  allUsersFromAChannelId: any;
  allUsersFromAChannel: any;
  user: any;
  isHoveredAddMember: boolean = false;
  channelService = inject(ChannelService);
  firebaseService = inject(FirebaseService);

  /**
 * Constructor for the component.
 * Observes breakpoint changes and initializes user and channel data by subscribing to the current channel observable.
 * 
 * @param {BreakpointObserverService} breakpointObserver - Service for observing responsive breakpoints.
 * @param {InterfaceService} uiService - Service for managing user interface interactions.
 */
  constructor(
    public breakpointObserver: BreakpointObserverService,
    public uiService: InterfaceService
  ) {
    this.channelService.currentChannel$.subscribe(async (channel) => {
      this.channel = channel;
      this.allUsersFromAChannelId = [];

      if (this.channel.users) {
        this.allUsersFromAChannelId = [...this.channel.users];
      }

      try {
        const userPromises = this.allUsersFromAChannelId.map((userId: any) =>
          this.firebaseService.getCurrentUser(userId)
        );

        const users = await Promise.all(userPromises);

        this.allUsersFromAChannelId = users;
      } catch (error) {
        console.error("Error loading users:", error);
      }
    });
  }

}
