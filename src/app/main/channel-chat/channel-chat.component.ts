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
    // this.uiService.toggleTextarea(); vv
  }

  /**
   * Initialisiert das Abonnement für den ausgewählten Benutzer.
   */
  private initializeUserSubscription() {
    this.userDataService.selectedUser.subscribe((user) => {
      this.handleSelectedUser(user);
    });
  }

  /**
   * Verarbeitet das ausgewählte Benutzerereignis.
   * @param user - Der aktuell ausgewählte Benutzer.
   */
  private handleSelectedUser(user: any) {
    this.user = user;
    this.uiService.changeContent('newMessage');
  }

  /**
   * Initialisiert das Abonnement für den aktuellen Kanal.
   */
  private initializeChannelSubscription() {
    this.channelService.currentChannel$.subscribe(async (channel) => {
      await this.handleChannelChange(channel);
    });
  }

  /**
   * Verarbeitet das Ereignis, wenn sich der aktuelle Kanal ändert.
   * @param channel - Der aktuelle Kanal.
   */
  private async handleChannelChange(channel: any) {
    this.channel = channel;
    this.uiService.currChannel = channel;

    if (this.channel.users) {
      this.allUsersFromAChannel = [...this.channel.users]; // Nutzer-IDs kopieren
    }
    await this.loadUsersFromChannel();
  }

  /**
   * Lädt die Benutzerdaten für alle Benutzer eines Kanals.
   */
  private async loadUsersFromChannel() {
    try {
      const userPromises = this.allUsersFromAChannel.map((userId: any) =>
        this.firebaseService.getCurrentUser(userId)
      );
      // Warten, bis alle Benutzerdaten geladen sind
      const users = await Promise.all(userPromises);
      this.allUsersFromAChannel = users; // Speichere Benutzer
    } catch (error) {
      // console.error("Fehler beim Laden der Benutzer aus dem Kanal:", error);
    }
  }

  /**
   * Öffnet den Dialog zum Bearbeiten eines Kanals.
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
   * Öffnet den Dialog zum Anzeigen der Mitglieder in einem Kanal.
   */
  openShowMembersDialog() {
    const dialogRef = this.dialog.open(ShowMemberInChannelComponent, {
      width: "100%",
      maxWidth: '873px'
    });
  }

  /**
   * Öffnet einen Dialog basierend auf der Bildschirmgröße:
   * - Kleiner Bildschirm: Zeigt Mitglieder im Kanal an.
   * - Größerer Bildschirm: Öffnet den Dialog zum Hinzufügen zu einem Kanal.
   */
  openChannelDialog() {
    if (this.breakpointObserver.isXSmallOrSmall) {
      this.openShowMembersDialog();
    } else {
      this.addToChoosenChannelDialog();
    }
  }

  /**
   * Öffnet den Dialog, um Benutzer zu einem ausgewählten Kanal hinzuzufügen.
   */
  addToChoosenChannelDialog() {
    const dialogRef = this.dialog.open(AddToChoosenChannelComponent, {
      width: "100%",
      maxWidth: '873px'
    });
  }

  /**
   * Öffnet den Dialog, um das Profil eines Benutzers anzuzeigen.
   */
  openUserProfilDialog() {
    const dialogRef = this.dialog.open(ProfilComponent, {
      data: this.user
    });
  }

  /**
   * Gibt die ersten `n` Elemente eines Arrays zurück.
   * 
   * @param {number} n - Die Anzahl der Elemente, die zurückgegeben werden sollen.
   * @param {any[]} array - Das Array, aus dem die Elemente entnommen werden.
   * @returns {any[]} Ein Array mit den ersten `n` Elementen.
   */
  getFirstNElements(n: number, array: any): any[] {
    return array.slice(0, Math.min(array.length, n));
  }

  /**
   * Setzt die aktive Unterhaltung für einen Benutzer.
   * - Wenn keine Unterhaltung existiert, wird eine neue gestartet.
   * - Der Benutzer wird zu den ausgewählten Unterhaltungen hinzugefügt, falls er nicht bereits existiert.
   * 
   * @param {User} obj - Der Benutzer, für den die Unterhaltung gesetzt werden soll.
   */
  async setConv(obj: User) {
    let conv = this.convService.searchForConversation(obj);

    if (!conv) {
      await this.convService.startConversation(obj, 'close');
      conv = this.convService.searchForConversation(obj);
    }
    if (conv) {
      const exists = this.uiService.selectedConversations.some(
        (item) => this.uiService.isUser(item) && item.uid === obj.uid // Prüfung, ob `item` ein User ist
      );
      if (!exists) {
        this.uiService.selectedConversations.unshift(obj); // Füge nur hinzu, wenn es nicht existiert
      }
    }
    this.searchbarService.emptyMsgInput();
  }

  /**
   * Setzt den aktiven Kanal und fügt ihn zu den ausgewählten Konversationen hinzu, falls er noch nicht vorhanden ist.
   * 
   * @param {Channel} obj - Der Kanal, der gesetzt werden soll.
   */
  setChannel(obj: Channel) {
    const exists = this.uiService.selectedConversations.some(
      (item) => this.uiService.isChannel(item) && item.chaId === obj.chaId // Prüfung, ob `item` ein Channel ist
    );

    if (!exists) {
      this.uiService.selectedConversations.unshift(obj); // Füge nur hinzu, wenn es nicht existiert
    }
    this.searchbarService.emptyMsgInput();
  }

  /**
   * Entfernt einen Empfänger aus der Liste der ausgewählten Konversationen.
   * 
   * @param {number} i - Der Index des zu entfernenden Empfängers in der Liste.
   */
  removeReceiver(i: number) {
    this.uiService.selectedConversations.splice(i, 1);
  }


}
