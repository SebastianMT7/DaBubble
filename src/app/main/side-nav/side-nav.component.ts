import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { User } from '../../models/user.model';
import { UserDataService } from '../../services/user.service';
import { InterfaceService } from '../../services/interface.service';
import { MatDialog } from '@angular/material/dialog';
import { AddChannelComponent } from '../../dialogs/add-channel/add-channel.component';
import { FormsModule } from '@angular/forms';
import { ChannelService } from '../../services/channel.service';
import { ConversationService } from '../../services/conversation.service';
import { BreakpointObserverService } from '../../services/breakpoint-observer.service';
import { SearchbarService } from '../../services/searchbar.service';
import { Channel } from '../../models/channel.model';
import { Conversation } from '../../models/conversation.model';
import { Message } from '../../models/message.model';
import { Thread } from '../../models/thread.model';



@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.scss'
})
export class SideNavComponent {
  channelNameArray: string[] = [];
  showFiller = false;
  menuVisible = false;
  isHoveredEdit = false;
  isHoveredAdd = false;
  isHoveredMenu = false;
  isHoveredUser = false;
  isHoveredChannel = false;
  hideUser = false;
  hideChannel = false;
  isOnline = false;
  channelName = "";
  currentUser?: User;
  arrowImg: string = 'img/icons/arrow_drop_down.png'
  workspaceImg: string = 'img/icons/workspaces.png'
  tagImg: string = "img/icons/tag.png"
  addImg: string = "img/icons/add_circle.png"
  accountImg: string = "img/icons/account_circle.png"
  menuImg: string = "img/icons/Hide-navigation.png"
  uiService = inject(InterfaceService);
  conService = inject(ConversationService);
  channelService = inject(ChannelService)
  channels: any[] = []

  constructor(
    public firebaseService: FirebaseService,
    public userDataService: UserDataService,
    public dialog: MatDialog,
    public breakpointObserver: BreakpointObserverService,
    public searchbarService: SearchbarService
  ) { }

  /**
   * Toggles the menu based on screen size and thread state.
   */
  toggleMenu(): void {
    if (this.uiService.showThread && this.breakpointObserver.isMedium) {
      this.uiService.closeThread();
      if (!this.uiService.showSidenav()) {
        this.uiService.toggleSidenav();
      }
    } else {
      this.menuVisible = !this.menuVisible;
      this.uiService.toggleSidenav();
    }
  }

  /**
   * Opens a new message and closes the menu on small screens.
   */
  openNewMessage(): void {
    this.uiService.changeContent('newMessage');
    if (this.breakpointObserver.isXSmallOrSmall) {
      this.toggleMenu();
    }
  }

  /**
   * Changes the arrow and workspace icons to their active versions.
   */
  changeImg(): void {
    this.arrowImg = 'img/icons/arrow_drop_down-blue.png';
    this.workspaceImg = 'img/icons/workspaces-blue.png';
  }

  /**
   * Resets the arrow and workspace icons to their default versions.
   */
  resetImg(): void {
    this.arrowImg = 'img/icons/arrow_drop_down.png';
    this.workspaceImg = 'img/icons/workspaces.png';
  }

  /**
   * Changes the channel icon to its active version.
   */
  changeImgChannel(): void {
    this.addImg = "img/icons/add_circle-blue.png";
  }

  /**
   * Resets the channel icon to its default version.
   */
  resetImgChannel(): void {
    this.addImg = "img/icons/add_circle.png";
  }

  /**
   * Changes the message arrow and profile icons to their active versions.
   */
  changeImgMessage(): void {
    this.arrowImg = 'img/icons/arrow_drop_down-blue.png';
    this.accountImg = "img/icons/account_circle-blue.png";
  }

  /**
   * Resets the message arrow and profile icons to their default versions.
   */
  resetImgMessage(): void {
    this.arrowImg = 'img/icons/arrow_drop_down.png';
    this.accountImg = "img/icons/account_circle.png";
  }

  /**
   * Changes the menu icon to its active version.
   */
  changeImgMenu(): void {
    this.menuImg = "img/icons/hide-navigation-blue.png";
  }

  /**
   * Resets the menu icon to its default version.
   */
  resetImgMenu(): void {
    this.menuImg = "img/icons/Hide-navigation.png";
  }

  /**
   * Toggles the visibility of users.
   */
  toggleUser(): void {
    this.hideUser = !this.hideUser;
  }

  /**
   * Toggles the visibility of channels.
   */
  toggleChannel(): void {
    this.hideChannel = !this.hideChannel;
  }

  /**
   * Starts a conversation with a user and scrolls to the last message.
   * 
   * @param {User} obj - The user to start a conversation with.
   * @param {Message} [msg] - The message to scroll to (optional).
   */
  startConversation(obj: User, msg?: Message): void {
    this.conService.startConversation(obj);

    if (this.breakpointObserver.isXSmallOrSmall) {
      this.toggleMenu();
    }
    if (msg) {
      this.scrollInChat(msg);
    } else {
      this.scrollToLastMessage(obj);
    }
  }

  /**
   * Opens a channel chat and scrolls to a specific message, if provided.
   * 
   * @param {any} obj - The channel to open.
   * @param {Message} [msg] - The message to scroll to (optional).
   */
  openChannel(obj: any, msg?: Message): void {
    this.channelService.showChannelChat(obj);
    if (this.breakpointObserver.isXSmallOrSmall) {
      this.toggleMenu();
    }
    if (msg) {
      this.scrollInChat(msg);
    } else {
      this.scrollToLastMessage(obj);
    }
  }

  /**
    * Opens a dialog to add a new channel.
    */
  openDialogChannel(): void {
    const dialogRef = this.dialog.open(AddChannelComponent, {
      width: '100%',
      maxWidth: '873px',
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  /**
   * Opens the search and jumps to a specific message in a conversation or channel.
   *
   * @param {Conversation | Channel} conversation - The conversation or channel.
   * @param {Message} msg - The message to scroll to.
   * @param {string} [chaId] - The channel ID (optional).
   */
  openSearchMsg(conversation: Conversation | Channel, msg: Message, chaId?: string) {
    let currentUid = this.userDataService.currentUserSig()?.uid as string;
    let foundId: string | null = null;
    let foundUser!: User | Channel | undefined;

    if ('conId' in conversation) {
      foundUser = this.searchforUserId(conversation, currentUid, foundId);
    }
    if (foundUser) {
      if ('uid' in foundUser) {
        this.startConversation(foundUser)
      }
      this.scrollInChat(msg);
    } else {
      this.openChannel(conversation, msg);
    }
  }

  /**
   * Opens a thread and scrolls to the specified message.
   *
   * @param {Thread} data - The thread data.
   * @param {Message} msg - The message to scroll to.
   */
  openThreadMsg(data: Thread, msg: Message) {
    this.uiService.currentThread = data;

    if (data.type == 'channel') {
      this.openChannelThread(data, msg);
    } else {
      this.openConvThread(data, msg)
    }
    this.scrollInChat(msg);
  }

  /**
   * Scrolls to the last message in a conversation or channel.
   *
   * @param {User | Channel} obj - The user or channel.
   */
  scrollToLastMessage(obj: User | Channel) {
    let conv: Channel | Conversation;
    let lastMsg: Message | undefined;
    if ('uid' in obj) {
      conv = this.conService.getCurrentConversation(obj)
      if (conv) {
        let messages = conv.messages
        lastMsg = messages[messages.length - 1]
      }
    }
    if ('chaId' in obj) {
      conv = obj;
      if (conv) {
        let messages = conv.messages
        lastMsg = messages[messages.length - 1]
      }
    }
    if (lastMsg) {
      this.scrollInChat(lastMsg);
    }
  }

  /**
   * Scrolls to a message in the parent chat.
   *
   * @param {Message} msg - The message to scroll to.
   */
  scrollInParentChat(msg: Message) {
    const targetParentId = `${msg.parent?.msgId}`;
    this.uiService.triggerScrollTo(targetParentId);
  }

  /**
   * Scrolls to a message in the current chat.
   *
   * @param {Message} msg - The message to scroll to.
   */
  scrollInChat(msg: Message) {
    const targetMessageId = `${msg.msgId}`;
    this.uiService.triggerScrollTo(targetMessageId);
  }

  /**
   * Opens a channel thread and scrolls to the specified message.
   *
   * @param {Thread} data - The thread to open.
   * @param {Message} msg - The message to scroll to.
   */
  openChannelThread(data: Thread, msg: Message) {
    let channel = this.findChannel(data)
    this.openChannel(channel, msg)
    this.uiService.openThread();
    if (msg.parent) {
      this.uiService.setMsg(msg.parent);
    }
  }

  /**
   * Opens a conversation thread and scrolls to the specified message.
   *
   * @param {Thread} data - The thread to open.
   * @param {Message} msg - The message to scroll to.
   */
  openConvThread(data: Thread, msg: Message) {
    let currentUid = this.userDataService.currentUserSig()?.uid as string;
    let foundId: string | null = null;
    let conv = this.findConversation(data);
    let user = this.searchforUserId(conv, currentUid, foundId)
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
   * Finds a channel based on a thread.
   *
   * @param {Thread} thread - The thread from which to determine the channel.
   * @returns {Channel} - The found channel.
   */
  findChannel(thread: Thread) {
    return this.firebaseService.allChannels.find(channel => channel.chaId === thread.convId) as Channel;
  }

  /**
   * Finds a conversation based on a thread.
   *
   * @param {Thread} thread - The thread from which to determine the conversation.
   * @returns {Conversation} - The found conversation.
   */
  findConversation(thread: Thread) {
    return this.firebaseService.allConversations.find(conv => conv.conId === thread.convId) as Conversation;
  }

  /**
   * Searches for a user ID that does not match the current user ID.
   *
   * @param {Conversation | Channel} conversation - The conversation or channel.
   * @param {string} currentUid - The current user ID.
   * @param {string | null} foundId - The found user ID (initially null).
   * @returns {User | Channel | undefined} - The found user or channel.
   */
  searchforUserId(conversation: Conversation | Channel, currentUid: string, foundId: string | null) {
    if (conversation) {
      if ('user' in conversation) {
        conversation.user.forEach(uid => {
          if (uid !== currentUid) {
            foundId = uid;
          }
        });
        return this.firebaseService.allUsers.find(user => user.uid === foundId) as User;
      } else {
        let currentChannel = this.channelService.currentChannelSubject.value
        return this.firebaseService.allChannels.find(channel => channel.chaId === foundId) as Channel;
      }
    }
    return;
  }

}
