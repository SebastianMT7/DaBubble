import { Component, inject } from '@angular/core';
import { SendMessageComponent } from './send-message/send-message.component';
import { MessageThreadComponent } from './message-thread/message-thread.component';
import { UserDataService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { InterfaceService } from '../../services/interface.service';
import { EditChannelComponent } from '../../dialogs/edit-channel/edit-channel.component';
import { MatDialog } from '@angular/material/dialog';
import { SingleMessageComponent } from './message-thread/single-message/single-message.component';
import { ChannelService } from '../../services/channel.service';
import { ShowMemberInChannelComponent } from '../../dialogs/show-member-in-channel/show-member-in-channel.component';
import { Firestore, doc, onSnapshot } from '@angular/fire/firestore';
import { AddToChoosenChannelComponent } from '../../dialogs/add-to-choosen-channel/add-to-choosen-channel.component';
import { ProfilComponent } from '../../dialogs/profil/profil.component';
import { BreakpointObserverService } from '../../services/breakpoint-observer.service';
import { FirebaseService } from '../../services/firebase.service';
import { SearchbarService } from '../../services/searchbar.service';
import { FormsModule } from '@angular/forms';
import { ConversationService } from '../../services/conversation.service';
import { User } from '../../models/user.model';
import { Channel } from '../../models/channel.model';
import { Conversation } from '../../models/conversation.model';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-channel-chat',
  standalone: true,
  imports: [
    SendMessageComponent,
    MessageThreadComponent,
    CommonModule,
    FormsModule,
    MatIconModule],
  templateUrl: './channel-chat.component.html',
  styleUrl: './channel-chat.component.scss'
})
export class ChannelChatComponent {
  user: any;
  threadIsEmpty = true;
  channel: any;
  uiService = inject(InterfaceService);
  channelService = inject(ChannelService)
  allUsersFromAChannel: any;
  firebaseService = inject(FirebaseService);

  constructor(
    public userDataService: UserDataService,
    public dialog: MatDialog,
    public breakpointObserver: BreakpointObserverService,
    public searchbarService: SearchbarService,
    public convService: ConversationService
  ) {
    this.initializeUserSubscription();
    this.initializeChannelSubscription();
  }

  /**
   * Initializes the subscription for the selected user.
   */
  private initializeUserSubscription() {
    this.userDataService.selectedUser.subscribe((user) => {
      this.handleSelectedUser(user);
    });
  }

  /**
   * Handles the selected user event.
   *
   * @param user - The currently selected user.
   */
  private handleSelectedUser(user: any) {
    this.user = user;
    this.uiService.changeContent('newMessage');
  }

  /**
   * Initializes the subscription for the current channel.
   */
  private initializeChannelSubscription() {
    this.channelService.currentChannel$.subscribe(async (channel) => {
      await this.handleChannelChange(channel);
    });
  }

  /**
   * Handles the event when the current channel changes.
   *
   * @param channel - The current channel.
   */
  private async handleChannelChange(channel: any) {
    this.channel = channel;
    this.uiService.currChannel = channel;

    if (this.channel.users) {
      this.allUsersFromAChannel = [...this.channel.users]; 
    }
    await this.loadUsersFromChannel();
  }

  /**
   * Loads user data for all users in a channel.
   */
  private async loadUsersFromChannel() {
    try {
      const userPromises = this.allUsersFromAChannel.map((userId: any) =>
        this.firebaseService.getCurrentUser(userId)
      );
      const users = await Promise.all(userPromises);
      this.allUsersFromAChannel = users;
    } catch (error) {
    }
  }

  /**
   * Opens the dialog to edit a channel.
   */
  openEditChannel(): void {
    const dialogRef = this.dialog.open(EditChannelComponent, {
      width: "100%",
      maxWidth: '873px'
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  /**
   * Opens the dialog to show members in a channel.
   */
  openShowMembersDialog() {
    const dialogRef = this.dialog.open(ShowMemberInChannelComponent, {
      width: "100%",
      maxWidth: '873px'
    });
  }

  /**
   * Opens a dialog based on screen size:
   * - Small screens: Shows channel members.
   * - Larger screens: Opens the dialog to add users to a channel.
   */
  openChannelDialog() {
    if (this.breakpointObserver.isXSmallOrSmall) {
      this.openShowMembersDialog();
    } else {
      this.addToChoosenChannelDialog();
    }
  }

  /**
   * Opens the dialog to add users to the selected channel.
   */
  addToChoosenChannelDialog() {
    const dialogRef = this.dialog.open(AddToChoosenChannelComponent, {
      width: "100%",
      maxWidth: '873px'
    });
  }

  /**
   * Opens the dialog to display a user's profile.
   */
  openUserProfilDialog() {
    const dialogRef = this.dialog.open(ProfilComponent, {
      data: this.user
    });
  }

  /**
   * Returns the first `n` elements of an array.
   *
   * @param {number} n - The number of elements to return.
   * @param {any[]} array - The array from which elements are taken.
   * @returns {any[]} An array containing the first `n` elements.
   */
  getFirstNElements(n: number, array: any): any[] {
    return array.slice(0, Math.min(array.length, n));
  }

  /**
   * Sets the active conversation for a user.
   * - If no conversation exists, a new one is started.
   * - Adds the user to the selected conversations if not already present.
   *
   * @param {User} obj - The user for whom the conversation should be set.
   */
  async setConv(obj: User) {
    let conv = this.convService.searchForConversation(obj);

    if (!conv) {
      await this.convService.startConversation(obj, 'close');
      conv = this.convService.searchForConversation(obj);
    }
    if (conv) {
      const exists = this.uiService.selectedConversations.some(
        (item) => this.uiService.isUser(item) && item.uid === obj.uid 
      );
      if (!exists) {
        this.uiService.selectedConversations.unshift(obj); 
      }
    }
    this.searchbarService.emptyMsgInput();
  }

  /**
   * Sets the active channel and adds it to the selected conversations if not already present.
   *
   * @param {Channel} obj - The channel to set.
   */
  setChannel(obj: Channel) {
    const exists = this.uiService.selectedConversations.some(
      (item) => this.uiService.isChannel(item) && item.chaId === obj.chaId
    );

    if (!exists) {
      this.uiService.selectedConversations.unshift(obj);
    }
    this.searchbarService.emptyMsgInput();
  }

  /**
   * Removes a recipient from the list of selected conversations.
   *
   * @param {number} i - The index of the recipient to remove from the list.
   */
  removeReceiver(i: number) {
    this.uiService.selectedConversations.splice(i, 1);
  }

}
