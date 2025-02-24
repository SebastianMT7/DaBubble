
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { AuthService } from './../services/auth.service';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ProfilLogoutButtonsComponent } from '../dialogs/profil-logout-buttons/profil-logout-buttons.component';
import { MyProfilComponent } from '../dialogs/my-profil/my-profil.component';
import { EditProfileComponent } from '../dialogs/edit-profile/edit-profile.component';
import { SearchbarService } from '../services/searchbar.service';
import { ConversationService } from '../services/conversation.service';
import { ChannelService } from '../services/channel.service';
import { BreakpointObserverService } from '../services/breakpoint-observer.service';
import { InterfaceService } from '../services/interface.service';
import { Conversation } from '../models/conversation.model';
import { FirebaseService } from '../services/firebase.service';
import { User } from '../models/user.model';
import { Message } from '../models/message.model';
import { Thread } from '../models/thread.model';
import { Channel } from '../models/channel.model';
import { ProfilButtonMobileComponent } from '../dialogs/profil-button-mobile/profil-button-mobile.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatInputModule, MatIconModule, MatFormFieldModule, FormsModule, MatDialogModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  authService = inject(AuthService);
  readonly dialog = inject(MatDialog);
  isHoveredEdit = false;
  uiService = inject(InterfaceService)
  private _bottomSheet = inject(MatBottomSheet);


  /**
 * Constructor for the component.
 * Initializes the searchbar and combines arrays with types after a delay.
 */
  constructor(
    public searchbarService: SearchbarService,
    public conService: ConversationService,
    public channelService: ChannelService,
    public breakpointObserver: BreakpointObserverService,
    private firebaseService: FirebaseService    
  ) {
    setTimeout(() => {
      this.searchbarService.combineArraysWithTypes();
    }, 3000);
  }

  /**
   * Opens a dialog or a bottom sheet based on the current screen size.
   * Displays profile and logout options in the dialog.
   */
  openDialog() {
    const rightPosition = window.innerWidth > 1920 ? (window.innerWidth - 1920) / 2 : 0;
    let topPosition;
    let dialogRef: MatDialogRef<ProfilLogoutButtonsComponent, any>;

    if (this.breakpointObserver.isXSmallOrSmall) {
      this.openBottomSheet();
    } else {
      topPosition = '110px';
      dialogRef = this.dialog.open(ProfilLogoutButtonsComponent, {
        width: '70px',
        position: { top: topPosition, right: `${rightPosition}px` },
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === 'profil') {
          this.openOwnProfilDialog();
        } else if (result === 'logout') {
          this.authService.signOut();
        }
      });
    }
  }

  /**
   * Opens a bottom sheet to display profile and logout options.
   */
  openBottomSheet(): void {
    this._bottomSheet.open(ProfilButtonMobileComponent);
  }

  /**
   * Opens a dialog for viewing the user's own profile.
   * If the dialog result is 'edit', opens the Edit Profile dialog.
   */
  openOwnProfilDialog() {
    const rightPosition = window.innerWidth > 1920 ? (window.innerWidth - 1920) / 2 : 0;
    const dialogRef = this.dialog.open(MyProfilComponent, {
      position: { top: '110px', right: `${rightPosition}px` },
    });
  }

  /**
   * Opens a specific conversation or channel message and scrolls to the targeted message.
   * 
   * @param {Conversation | Channel} conversation - The conversation or channel to open.
   * @param {Message} msg - The message to scroll to.
   * @param {string} [chaId] - Optional channel ID.
   */
  openSearchMsg(conversation: Conversation | Channel, msg: Message, chaId?: string) {
    const currentUid = this.authService.currentUserSig()?.uid as string;
    let foundId: string | null = null;
    let foundUser!: User | Channel | undefined;

    if ('conId' in conversation) {
      foundUser = this.searchforUserId(conversation, currentUid, foundId);
    }

    if (foundUser) {
      if ('uid' in foundUser) {
        this.startConversation(foundUser);
      }
      this.scrollInChat(msg);
    } else {
      this.openChannel(conversation);
      this.scrollInChat(msg);
    }
  }

  /**
   * Opens a thread message for a channel or conversation and scrolls to the targeted messages.
   * 
   * @param {Thread} data - The thread data to open.
   * @param {Message} msg - The message to scroll to.
   */
  openThreadMsg(data: Thread, msg: Message) {
    this.uiService.currentThread = data;

    if (data.type === 'channel') {
      this.openChannelThread(data, msg);
    } else {
      this.openConvThread(data, msg);
    }

    this.scrollInParentChat(msg);
    this.scrollInChat(msg);
  }

  /**
   * Scrolls to the parent message of a thread in the chat.
   * 
   * @param {Message} msg - The parent message to scroll to.
   */
  scrollInParentChat(msg: Message) {
    const targetParentId = `${msg.parent?.msgId}`;
    this.uiService.triggerScrollTo(targetParentId);
  }

  /**
   * Scrolls to a specific message in the chat.
   * 
   * @param {Message} msg - The message to scroll to.
   */
  scrollInChat(msg: Message) {
    const targetMessageId = `${msg.msgId}`;
    this.uiService.triggerScrollTo(targetMessageId);
  }

  /**
   * Opens a thread in a channel and sets the parent message, if available.
   * 
   * @param {Thread} data - The thread data to open.
   * @param {Message} msg - The message to associate with the thread.
   */
  openChannelThread(data: Thread, msg: Message) {
    const channel = this.findChannel(data);
    this.openChannel(channel);
    this.uiService.openThread();
    if (msg.parent) {
      this.uiService.setMsg(msg.parent);
    }
  }

  /**
   * Opens a thread in a conversation and sets the parent message, if available.
   * 
   * @param {Thread} data - The thread data to open.
   * @param {Message} msg - The message to associate with the thread.
   */
  openConvThread(data: Thread, msg: Message) {
    const currentUid = this.authService.currentUserSig()?.uid as string;
    let foundId: string | null = null;
    const conv = this.findConversation(data);
    const user = this.searchforUserId(conv, currentUid, foundId);

    if (user) {
      if ('uid' in user) {
        this.startConversation(user);
        this.uiService.openThread();
        if (msg.parent) {
          this.uiService.setMsg(msg.parent);
        }
      }
    }
  }

  /**
   * Finds a channel associated with a given thread.
   * 
   * @param {Thread} thread - The thread to search for.
   * @returns {Channel} The found channel.
   */
  findChannel(thread: Thread): Channel {
    return this.firebaseService.allChannels.find(channel => channel.chaId === thread.convId) as Channel;
  }

  /**
   * Finds a conversation associated with a given thread.
   * 
   * @param {Thread} thread - The thread to search for.
   * @returns {Conversation} The found conversation.
   */
  findConversation(thread: Thread): Conversation {
    return this.firebaseService.allConversations.find(conv => conv.conId === thread.convId) as Conversation;
  }

  /**
   * Starts a conversation with a specific user.
   * 
   * @param {User} obj - The user to start a conversation with.
   */
  startConversation(obj: User) {
    this.conService.startConversation(obj);
  }

  /**
   * Opens a specific channel.
   * 
   * @param {any} obj - The channel to open.
   */
  openChannel(obj: any) {
    this.channelService.showChannelChat(obj);
  }

  /**
   * Searches for a user ID in a conversation or channel and retrieves the associated user or channel details.
   * 
   * @param {Conversation | Channel} conversation - The conversation or channel to search in.
   * @param {string} currentUid - The current user's ID.
   * @param {string | null} foundId - A reference to the found user ID.
   * @returns {User | Channel | undefined} The found user or channel details.
   */
  searchforUserId(conversation: Conversation | Channel, currentUid: string, foundId: string | null): User | Channel | undefined {
    if (conversation) {
      if ('user' in conversation) {
        conversation.user.forEach(uid => {
          if (uid !== currentUid) {
            foundId = uid;
          }
        });
        return this.firebaseService.allUsers.find(user => user.uid === foundId) as User;
      } else {
        return this.firebaseService.allChannels.find(channel => channel.chaId === foundId) as Channel;
      }
    }
    return undefined;
  }
}