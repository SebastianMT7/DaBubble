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
  ) {
    
   }

  /**
   * Schaltet das Menü ein/aus, je nach Bildschirmgröße und Thread-Zustand.
   */
  toggleMenu() {
    if (this.uiService.showThread && this.breakpointObserver.isMedium) {
      this.uiService.closeThread()
      if (!this.uiService.showSidenav()) {
        this.uiService.toggleSidenav();
      }
    } else {
      this.menuVisible = !this.menuVisible;
      this.uiService.toggleSidenav();
    }

  }

  /**
   * Öffnet eine neue Nachricht und schließt ggf. das Menü bei kleinen Bildschirmen.
   */
  openNewMessage() {
    this.uiService.changeContent('newMessage');
    if (this.breakpointObserver.isXSmallOrSmall) {
      this.toggleMenu();
    }
  }

  /**
   * Ändert das Bild des Pfeils und des Arbeitsbereichs in die aktive Version.
   */
  changeImg() {
    this.arrowImg = 'img/icons/arrow_drop_down-blue.png';
    this.workspaceImg = 'img/icons/workspaces-blue.png';

  }

  /**
   * Setzt die Bilder des Pfeils und des Arbeitsbereichs auf die Standardversion zurück.
   */
  resetImg() {
    this.arrowImg = 'img/icons/arrow_drop_down.png';
    this.workspaceImg = 'img/icons/workspaces.png';
  }

  /**
   * Ändert das Bild des Kanalsymbols in die aktive Version.
   */
  changeImgChannel() {
    this.addImg = "img/icons/add_circle-blue.png";

  }

  /**
   * Setzt das Bild des Kanalsymbols auf die Standardversion zurück.
   */
  resetImgChannel() {
    this.addImg = "img/icons/add_circle.png";
  }

  /**
   * Ändert das Bild des Nachrichten-Pfeils und des Profilsymbols in die aktive Version.
   */
  changeImgMessage() {
    this.arrowImg = 'img/icons/arrow_drop_down-blue.png';
    this.accountImg = "img/icons/account_circle-blue.png";

  }

  /**
   * Setzt das Bild des Nachrichten-Pfeils und des Profilsymbols auf die Standardversion zurück.
   */
  resetImgMessage() {
    this.arrowImg = 'img/icons/arrow_drop_down.png';
    this.accountImg = "img/icons/account_circle.png";
  }

  /**
   * Ändert das Bild des Menüsymbols in die aktive Version.
   */
  changeImgMenu() {
    this.menuImg = "img/icons/hide-navigation-blue.png";
  }

  /**
   * Setzt das Bild des Menüsymbols auf die Standardversion zurück.
   */
  resetImgMenu() {
    this.menuImg = "img/icons/Hide-navigation.png";

  }

  /**
   * Schaltet die Anzeige von Benutzern ein/aus.
   */
  toggleUser() {
    this.hideUser = !this.hideUser;
  }

  /**
   * Schaltet die Anzeige von Kanälen ein/aus.
   */
  toggleChannel() {
    this.hideChannel = !this.hideChannel;
  }

  /**
   * Startet eine Unterhaltung mit einem Benutzer und scrollt zur letzten Nachricht.
   * 
   * @param {User} obj - Der Benutzer, mit dem die Unterhaltung gestartet werden soll.
   * @param {Message} [msg] - Die Nachricht, zu der gescrollt werden soll (optional).
   */
  startConversation(obj: User, msg?: Message) {
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
   * Öffnet einen Kanal-Chat und scrollt ggf. zu einer bestimmten Nachricht.
   * 
   * @param {any} obj - Der Kanal, der geöffnet werden soll.
   * @param {Message} [msg] - Die Nachricht, zu der gescrollt werden soll (optional).
   */
  openChannel(obj: any, msg?: Message) {
    this.channelService.showChannelChat(obj)
    if (this.breakpointObserver.isXSmallOrSmall) {
      this.toggleMenu();
    }
    if (msg) {
      this.scrollInChat(msg);
    } else {
      this.scrollToLastMessage(obj);
    }
  }


  // showUserChat(user: any) {
  //   this.userDataService.setUser(user);
  //   this.uiService.changeContent('directMessage');
  // }

  openDialogChannel(): void {
    const dialogRef = this.dialog.open(AddChannelComponent, {
      width: '100%',
      maxWidth: '873px',
    });
    dialogRef.afterClosed().subscribe(result => {
    });
  }

  /**
   * Öffnet die Suche und springt zu einer bestimmten Nachricht in einer Konversation oder einem Kanal.
   * 
   * @param {Conversation | Channel} conversation - Die Konversation oder der Kanal.
   * @param {Message} msg - Die Nachricht, zu der gescrollt werden soll.
   * @param {string} [chaId] - Die Kanal-ID (optional).
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
   * Öffnet einen Thread und scrollt zur angegebenen Nachricht.
   * 
   * @param {Thread} data - Die Thread-Daten.
   * @param {Message} msg - Die Nachricht, zu der gescrollt werden soll.
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
   * Scrollt zur letzten Nachricht in einer Unterhaltung oder einem Kanal.
   * 
   * @param {User | Channel} obj - Der Benutzer oder der Kanal.
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
   * Scrollt zu einer Nachricht im übergeordneten Chat.
   * 
   * @param {Message} msg - Die Nachricht, zu der gescrollt werden soll.
   */
  scrollInParentChat(msg: Message) {
    const targetParentId = `${msg.parent?.msgId}`;
    this.uiService.triggerScrollTo(targetParentId);
  }

  /**
   * Scrollt zu einer Nachricht im aktuellen Chat.
   * 
   * @param {Message} msg - Die Nachricht, zu der gescrollt werden soll.
   */
  scrollInChat(msg: Message) {
    const targetMessageId = `${msg.msgId}`;
    this.uiService.triggerScrollTo(targetMessageId);
  }

/**
 * Öffnet einen Kanal-Thread und scrollt zur angegebenen Nachricht.
 * 
 * @param {Thread} data - Der Thread, der geöffnet werden soll.
 * @param {Message} msg - Die Nachricht, zu der gescrollt werden soll.
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
 * Öffnet eine Konversations-Thread und scrollt zur angegebenen Nachricht.
 * 
 * @param {Thread} data - Der Thread, der geöffnet werden soll.
 * @param {Message} msg - Die Nachricht, zu der gescrollt werden soll.
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
 * Findet einen Kanal basierend auf einem Thread.
 * 
 * @param {Thread} thread - Der Thread, aus dem der Kanal ermittelt werden soll.
 * @returns {Channel} - Der gefundene Kanal.
 */
  findChannel(thread: Thread) {
    return this.firebaseService.allChannels.find(channel => channel.chaId === thread.convId) as Channel;
  }

/**
 * Findet eine Konversation basierend auf einem Thread.
 * 
 * @param {Thread} thread - Der Thread, aus dem die Konversation ermittelt werden soll.
 * @returns {Conversation} - Die gefundene Konversation.
 */
  findConversation(thread: Thread) {
    return this.firebaseService.allConversations.find(conv => conv.conId === thread.convId) as Conversation;
  }

/**
 * Sucht nach der Benutzer-ID, die nicht mit der aktuellen Benutzer-ID übereinstimmt.
 * 
 * @param {Conversation | Channel} conversation - Die Konversation oder der Kanal.
 * @param {string} currentUid - Die aktuelle Benutzer-ID.
 * @param {string | null} foundId - Die gefundene Benutzer-ID (initial null).
 * @returns {User | Channel | undefined} - Der gefundene Benutzer oder Kanal.
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
