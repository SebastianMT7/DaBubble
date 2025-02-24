import { Component, Input, inject, ElementRef, HostListener, ViewChild } from '@angular/core';
import { Message } from '../../../models/message.model';
import { Thread } from '../../../models/thread.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SingleMessageComponent } from '../message-thread/single-message/single-message.component';
import { FirebaseService } from '../../../services/firebase.service';
import { AuthService } from '../../../services/auth.service';
import { Conversation } from '../../../models/conversation.model';
import { arrayUnion, updateDoc, addDoc, doc, collection, Firestore, onSnapshot, query, setDoc } from '@angular/fire/firestore';
import { v4 as uuidv4 } from 'uuid';
import { user } from '@angular/fire/auth';
import { User } from '../../../models/user.model';
import { ConversationService } from '../../../services/conversation.service';
import { InterfaceService } from '../../../services/interface.service';
import { EmojiComponent } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { ChannelService } from '../../../services/channel.service';
import { Channel } from '../../../models/channel.model';
import { SearchbarService } from '../../../services/searchbar.service';
import { BreakpointObserverService } from '../../../services/breakpoint-observer.service';

@Component({
  selector: 'app-send-message',
  standalone: true,
  imports: [CommonModule, FormsModule, PickerComponent],
  templateUrl: './send-message.component.html',
  styleUrl: './send-message.component.scss'
})
export class SendMessageComponent {
  fiBaService = inject(FirebaseService);
  authService = inject(AuthService)
  firestore = inject(Firestore);
  conService = inject(ConversationService)
  uiService = inject(InterfaceService)
  channelService = inject(ChannelService)

  @Input() placeholder: string = '';
  @Input() isNewMsg: boolean = false;
  @Input() input: 'chat' | 'thread' | 'channel' | 'newMsg' | undefined;
  @ViewChild('emojiPicker', { static: false }) emojiPicker!: ElementRef;
  @ViewChild('userList', { static: false }) userList!: ElementRef;
  @ViewChild('textArea') textArea!: ElementRef;

  isHoveredReaction= false;
  isHoveredTagUser= false;
  text: string = '';
  isDisabled: boolean = true;
  showEmojiPicker = false;
  showUserList: boolean = false;
  currentMsg = new Message()
  loggedInUser = new User()


  constructor(public searchbarService: SearchbarService, public breakpointObserver: BreakpointObserverService) {

  }

  /**
   * Erstellt eine neue Nachricht basierend auf dem Eingabetyp und führt zugehörige Logik aus.
   */
  async createNewMsg() {
    if (this.text.trim()) {
      if (this.input == 'chat' || this.input == 'channel') {
        await this.createChannelAndChatMsg(this.input);
      }
      if (this.input == 'thread') {
        await this.createThreadMsg();
      }
      if (this.input == 'newMsg') {
        await this.createThreadsForAllReceivers();
        this.showConfirmBox();
      }
      this.emptyNewMsgSearch();
      this.checkemptyInput();
    }
  }

  /**
   * Erstellt eine Nachricht für einen Kanal oder Chat und speichert sie.
   * @param {('chat' | 'channel')} input - Gibt an, ob die Nachricht für einen Chat oder Kanal ist.
   */
  async createChannelAndChatMsg(input: 'chat' | 'channel') {
    let currentThreadId = await this.createThread(input);
    this.currentMsg = new Message();
    this.currentMsg.timeStamp = Date.now();
    this.currentMsg.senderId = this.authService.currentUserSig()?.uid;
    this.currentMsg.text = this.text,
      this.currentMsg.thread = currentThreadId, //wird erstmal nicht erstellt (wegen array)
      this.currentMsg.reactions = [], //wird erstmal nicht erstellt (wegen array)
      await this.addMessage(this.currentMsg);
  }

  /**
   * Erstellt eine spezifische Nachricht für einen Thread und verknüpft sie mit einer Elternnachricht.
   */
  async createThreadMsg() {
    this.currentMsg = new Message();
    this.currentMsg.timeStamp = Date.now();
    this.currentMsg.senderId = this.authService.currentUserSig()?.uid;
    this.currentMsg.text = this.text,
      this.currentMsg.reactions = [], //wird erstmal nicht erstellt (wegen array)
      this.currentMsg.parent = this.uiService.currentMessage
    await this.addThreadMessage(this.currentMsg);
  }

  /**
   * Erstellt Threads für alle ausgewählten Empfänger und fügt Nachrichten hinzu.
   */
  async createThreadsForAllReceivers() {
    let currentThreadId: string = "";

    for (const receiver of this.uiService.selectedConversations) {
      if ('uid' in receiver) {
        currentThreadId = await this.createThread('newMsg', receiver);
      } else {
        currentThreadId = await this.createThread('newMsg', receiver);
      }
      this.currentMsg = new Message();
      this.currentMsg.timeStamp = Date.now();
      this.currentMsg.senderId = this.authService.currentUserSig()?.uid;
      this.currentMsg.text = this.text;
      this.currentMsg.thread = currentThreadId;
      this.currentMsg.reactions = [];
      // Logik zum Speichern oder Senden der Nachricht, falls erforderlich
      await this.addMessage(this.currentMsg, receiver);
    }
  }

  /**
   * Erstellt einen neuen Thread in Firestore basierend auf dem Eingabetyp und einem optionalen Empfänger.
   * @param {('chat' | 'channel' | 'newMsg')} input - Der Typ des zu erstellenden Threads.
   * @param {Channel | User} [receiver] - Optionaler Empfänger des Threads.
   * @returns {Promise<string>} Die ID des erstellten Threads.
   */
  async createThread(input: 'chat' | 'channel' | 'newMsg', reciever?: Channel | User): Promise<string> {
    const currentUser = this.authService.currentUserSig();
    let objId: string = "";
    if (!currentUser) {
      console.error('Kein authentifizierter Benutzer gefunden');
      throw new Error('User not authenticated');
    }
    // `addDoc` nutzen, um den Thread hinzuzufügen
    if (input == 'chat') {
      objId = this.fiBaService.currentConversation.conId as string;
      let threadid = await this.addThread(objId, 'conversation');
      return threadid
    } else if (input == 'channel') {
      objId = this.channelService.currentChannelSubject.value.chaId
      let threadid = await this.addThread(objId, 'channel');
      return threadid
    } else {
      if (reciever) {
        let threadId = await this.checkReceiver(reciever, objId, input);
        return threadId
      } else {
        let threadid = await this.addThread(objId, input);
        return threadid
      }
    }
    return ""
  }

  /**
   * Überprüft den Typ des Empfängers (Benutzer oder Kanal) und erstellt den zugehörigen Thread.
   * @param {User | Channel} receiver - Der Empfänger des Threads.
   * @param {string} objId - Objekt-ID für die Konversation oder den Kanal.
   * @param {('newMsg')} input - Der Typ des Threads.
   */
  async checkReceiver(receiver: User | Channel, objId: string, input: 'newMsg') {
    if ('uid' in receiver) {
      objId = this.conService.searchForConversation(receiver).conId as string
    } else {
      objId = receiver.chaId
    }
    let threadId = await this.addThread(objId, input);
    return threadId;
  }

  /**
   * Fügt einen Thread in die Firestore-Sammlung mit den angegebenen Parametern hinzu.
   * @param {string} objId - Objekt-ID für die Konversation oder den Kanal.
   * @param {('conversation' | 'channel' | 'newMsg')} input - Der Typ des Threads.
   * @returns {Promise<string>} Die ID des erstellten Threads.
   */
  async addThread(objId: string, input: 'conversation' | 'channel' | 'newMsg') {
    let thread = this.getCleanThreadJSON(new Thread(), input, objId)
    const threadRef = await addDoc(collection(this.firestore, 'threads'), thread);
    // Zurückgegebene Thread-ID
    console.log(thread);

    return threadRef.id;
  }

  /**
   * Fügt eine Nachricht zu einem bestehenden Thread in Firestore hinzu.
   * @param {Message} message - Das hinzuzufügende Nachrichtenobjekt.
   */
  async addThreadMessage(message: Message) {
    const threadId = this.uiService.currentMessage.thread;
    const msgData = this.getCleanJSON(message);
    msgData.msgId = uuidv4();
    try {
      const threadRef = doc(this.firestore, "threads", threadId);
      await updateDoc(threadRef, {
        messages: arrayUnion(msgData)
      });
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Nachricht:', error);
    }
  }

  /**
   * Fügt eine Nachricht zu einer Konversation oder einem Kanal basierend auf dem Kontext hinzu.
   * @param {any} message - Das hinzuzufügende Nachrichtenobjekt.
   * @param {Channel | User} [receiver] - Optionaler Empfänger der Nachricht.
   */
  async addMessage(message: any, receiver?: Channel | User) {
    let objId;
    let coll = 'conversation';
    if (this.uiService.content == 'channelChat') {
      objId = this.channelService.currentChannelSubject.value.chaId
      coll = 'channels'
    } else if (this.uiService.content == 'directMessage') {
      objId = this.fiBaService.currentConversation.conId;
      coll = 'conversations'
    } else {
      if (receiver) {
        if ('uid' in receiver) {
          objId = this.conService.searchForConversation(receiver).conId;
          coll = 'conversations'
        } else {
          objId = receiver.chaId;
          coll = 'channels'
        }
      }
    }
    await this.updateDocument(message, coll, objId as string);
  }

  /**
   * Aktualisiert ein Firestore-Dokument mit einer neuen Nachricht.
   * @param {Message} message - Das hinzuzufügende Nachrichtenobjekt.
   * @param {string} coll - Der Name der Sammlung ('conversations' oder 'channels').
   * @param {string} objId - Die ID des zu aktualisierenden Dokuments.
   */
  async updateDocument(message: Message, coll: string, objId: string) {
    const msgData = this.getCleanJSON(message);
    msgData.msgId = uuidv4();
    const conversationRef = doc(this.firestore, `${coll}/${objId}`);
    try {
      await updateDoc(conversationRef, {
        messages: arrayUnion(msgData)

      });
      // console.log('Nachricht erfolgreich hinzugefügt');
      //this.conService.showUserChat()
    } catch (error) {
      // console.error('Fehler beim Hinzufügen der Nachricht:', error);
    }
    this.uiService.scrollInChat(msgData)
  }

  /**
   * Zeigt ein Bestätigungsfeld für das Senden einer Nachricht an.
   */
  showConfirmBox() {
    this.uiService.msgConfirmed = true;

    setTimeout(() => {
      this.uiService.msgConfirmed = false;
    }, 4500);
  }

  /**
   * Leert die Felder für die Suche nach neuen Nachrichten und setzt Eingaben zurück.
   */
  emptyNewMsgSearch() {
    this.searchbarService.newMsgSearchName = "";
    this.searchbarService.filteredResults = [];
    this.uiService.selectedConversations = [];
    this.text = ""
  }

  /**
   * Gibt ein bereinigtes JSON-Objekt für eine gegebene Nachricht zurück.
   * @param {Message} message - Die Nachricht, die bereinigt werden soll.
   * @returns {object} Das bereinigte JSON-Objekt.
   */
  getCleanJSON(message: Message) {
    return {
      msgId: message.msgId,
      timeStamp: message.timeStamp,
      senderId: message.senderId,
      text: message.text,
      thread: message.thread,
      reactions: message.reactions,
      parent: message.parent
    };
  }

  /**
   * Gibt ein bereinigtes JSON-Objekt für einen gegebenen Thread zurück.
   * @param {Thread} thread - Der Thread, der bereinigt werden soll.
   * @param {string} input - Der Typ des Threads.
   * @param {string} objId - Die Objekt-ID der Konversation oder des Kanals.
   * @returns {object} Das bereinigte JSON-Objekt.
   */
  getCleanThreadJSON(thread: Thread, input: string, objId: string) {
    return {
      id: thread.id,
      rootMessage: thread.rootMessage,
      messages: thread.messages,
      type: input,
      convId: objId
    };
  }

  /**
   * Überprüft, ob das Eingabefeld leer ist, und passt den Eingabestatus entsprechend an.
   */
  checkemptyInput() {
    this.isDisabled = this.text.trim() === '';
  }

  /**
   * Schaltet die Sichtbarkeit des Emoji-Pickers um.
   */
  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  /**
   * Handhabt Klicks außerhalb bestimmter Elemente, um sie auszublenden.
   * @param {Event} event - Das Klick-Ereignis.
   */
  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: Event) {
    // Prüfen, ob das Emoji-Picker-Element existiert und der Klick außerhalb davon war
    if (this.emojiPicker && !this.emojiPicker.nativeElement.contains(event.target)) {
      this.showEmojiPicker = false;
    }
    if (this.userList) {
      this.showUserList = false;
    }
  }

  /**
   * Fügt ein Emoji zum Eingabetext hinzu.
   * @param {any} event - Das Ereignis mit den Emoji-Daten.
   */
  addEmoji(event: any) {
    const emoji = event.emoji.native;
    this.text += emoji;
    this.textArea.nativeElement.focus();
    this.toggleEmojiPicker();
    this.checkemptyInput();
  }

  /**
   * Schaltet die Sichtbarkeit der Benutzerliste zum Markieren um.
   */
  toggleUserList() {
    this.showUserList = !this.showUserList;
  }

  /**
   * Markiert einen Benutzer, indem sein Benutzername ausgewählt wird.
   * @param {string} user - Der zu markierende Benutzername.
   */
  tagUserBtn(user: string) {
    this.text += `@${user} `;
    this.textArea.nativeElement.focus();
    this.checkemptyInput();
  }

  selectSearchedName(symbol: string, selectedName: string) {
    const lastSymbol = this.text.lastIndexOf(symbol);
    if (lastSymbol !== -1) {
      this.text = this.text.substring(0, lastSymbol) + symbol + selectedName;
    } else {
      this.text += symbol + selectedName;
    }
    this.textArea.nativeElement.focus();
    this.checkemptyInput();
  }

  ngOnChanges(): void {
    setTimeout(() => {
      this.textArea.nativeElement.focus();
    }, 0);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.textArea.nativeElement.focus();
    }, 0);
  }
}
