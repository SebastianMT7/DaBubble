import { ChangeDetectorRef, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Message } from '../models/message.model';
import { FirebaseService } from './firebase.service';
import { Thread } from '../models/thread.model';
import { MatDialog } from '@angular/material/dialog';
import { ShowMemberInChannelComponent } from '../dialogs/show-member-in-channel/show-member-in-channel.component';
import { AddToChoosenChannelComponent } from '../dialogs/add-to-choosen-channel/add-to-choosen-channel.component';
import { BreakpointObserverService } from './breakpoint-observer.service';
import { Channel } from '../models/channel.model';
import { User } from '../models/user.model';
@Injectable({
  providedIn: 'root',
})
export class InterfaceService {
  showThread = false;
  content: 'channelChat' | 'newMessage' | 'directMessage' = 'newMessage';
  showSidenav = signal(true);
  menuVisible = false;
  currentMessage: Message = new Message();
  currentThread: Thread | undefined;
  previousMessage!: Message;
  currChannel!: Channel;
  selectedConversations: (User | Channel)[] = [];
  msgConfirmed: boolean = false;




  constructor(private firebaseService: FirebaseService, public dialog: MatDialog, public breakpointObserver: BreakpointObserverService) {

  }

  /** 
  * Überprüft, ob das übergebene Objekt vom Typ `User` ist.
  * @param {User | Channel} obj - Das Objekt, das überprüft werden soll.
  * @returns {obj is User} `true` wenn `obj` vom Typ `User` ist, sonst `false`.
  */
  isUser(obj: User | Channel): obj is User {
    return 'uid' in obj;
  }

  /** 
   * Überprüft, ob das übergebene Objekt vom Typ `Channel` ist.
   * @param {User | Channel} obj - Das Objekt, das überprüft werden soll.
   * @returns {obj is Channel} `true` wenn `obj` vom Typ `Channel` ist, sonst `false`.
   */
  isChannel(obj: User | Channel): obj is Channel {
    return 'chaId' in obj;
  }

  /**
   * Umschaltet die Sichtbarkeit des Menüs.
   */
  toggleSidenav() {
    this.menuVisible = !this.menuVisible
    this.showSidenav.set(!this.showSidenav());
  }

  /**
   * Ändert den Inhaltstyp, der derzeit angezeigt wird.
   * @param {'channelChat' | 'newMessage' | 'directMessage'} content - Der Inhaltstyp, der angezeigt werden soll.
   */
  changeContent(content: 'channelChat' | 'newMessage' | 'directMessage') {
    this.content = content;
  }

  /**
   * Versteckt das aktuell geöffnete Thread-Fenster.
   */
  closeThread() {
    this.showThread = false;
  }

  /**
   * Öffnet das Thread-Fenster.
   */
  openThread() {
    this.showThread = true;
    this.focusThreadTextArea();
  }

  /**
   * Setzt die aktuelle Nachricht und initialisiert das Anhören von Änderungen im Thread, der dieser Nachricht zugeordnet ist.
   * @param {Message} currentMsg - Die aktuelle Nachricht.
   */
  setMsg(currentMsg: Message) {
    this.currentMessage = currentMsg;

    this.firebaseService.listenToCurrentThreadChanges(currentMsg.thread);
    this.setThread(currentMsg)
    this.openThread()
  }

  /**
   * Setzt den aktuellen Thread auf den zugehörigen Thread der gegebenen Nachricht.
   * Wenn Nachrichten im Thread vorhanden sind, wird auf die letzte Nachricht gescrollt.
   * @param {Message} currentMsg - Die aktuelle Nachricht.
   */
  setThread(currentMsg: Message) {
    let thread = this.findThread(currentMsg);
    let index: number;
    if (thread) {
      index = thread?.messages.length - 1;
      if (thread?.messages.length > 0) {
        this.scrollInChat(thread.messages[index])

      }
    }
  }

  /**
   * Sucht eine Nachricht anhand ihrer `msgId` und ruft eine Scroll-Funktion auf, um diese Nachricht im Chatfenster sichtbar zu machen.
   * @param {Message} msg - Die Nachricht, die gescrollt werden soll.
   */
  scrollInChat(msg: Message) {
    // Sende die ID des Ziels an den Service
    const targetMessageId = `${msg.msgId}`;
    this.triggerScrollTo(targetMessageId);
  }

  /**
   * Sucht nach der Elternnachricht für die gegebene Nachricht innerhalb der Threads.
   * @param {Message} currentMsg - Die aktuelle Nachricht.
   * @returns {Message | undefined} Die übergeordnete Nachricht, falls vorhanden.
   */
  findParentMsg(currentMsg: Message) {
    let msg = this.firebaseService.allThreads.find(u => u.id === currentMsg.thread);
  }

  /**
   * Findet den zugehörigen Thread für eine gegebene Nachricht.
   * @param {any} currentMsg - Die gegebene Nachricht.
   * @returns {Thread | undefined} Der Thread, falls vorhanden.
   */
  findThread(currentMsg?: any) {
    let thread = this.firebaseService.allThreads.find(u => u.id === currentMsg.thread);
    return thread
  }

  /**
   * Bestimmt die letzte Nachricht in einem Thread, die auf die angegebene Nachricht folgt.
   * @param {Message} currentMessage - Die aktuelle Nachricht.
   * @returns {Message | undefined} Die neueste Nachricht im Thread oder `undefined`, falls keine Nachrichten vorhanden sind.
   */
  findLastAnswer(currentMessage: Message) {
    let thread = this.findThread(currentMessage);
    let messages = thread?.messages;

    if (!messages || messages.length === 0) {
      return; // Kein Eintrag, kein Ergebnis
    }

    return messages.reduce((latest, message) =>
      message.timeStamp > latest.timeStamp ? message : latest
    );
  }

  /**
   * Formatiert einen gegebenen Zeitstempel in eine Stunden- und Minuten-Kombination im Format `HH:MM`.
   * @param {number} [timestamp] - Der Zeitstempel, der formatiert werden soll.
   * @returns {string} Die Zeit im Format `HH:MM`.
   */
  formatTimeFromTimestamp(timestamp?: number): string {
    let time: number;
    if (timestamp) {
      time = timestamp
    } else {
      time = 0
    }
    const date = new Date(time); // Erstelle ein Date-Objekt
    const hours = date.getHours().toString().padStart(2, '0'); // Stunden, 2-stellig
    const minutes = date.getMinutes().toString().padStart(2, '0'); // Minuten, 2-stellig
    return `${hours}:${minutes}`; // Kombiniere Stunden und Minuten
  }

  /**
   * Öffnet ein Dialogfenster zur Anzeige und Verwaltung von Mitgliedern innerhalb eines Kanals.
   */
  openShowMembersDialog() {
    const dialogRef = this.dialog.open(ShowMemberInChannelComponent, {
      width: "100%",
      maxWidth: '873px'
    });
  }

  /**
   * Überprüft, ob das aktuelle Breakpoint ein `XSmall` oder `Small` ist, und entscheidet, welches Dialogfenster geöffnet werden soll.
   * Bei kleinem Breakpoint wird `openShowMembersDialog()` aufgerufen, ansonsten `addToChoosenChannelDialog()`.
   */
  openChannelDialog() {
    if (this.breakpointObserver.isXSmallOrSmall) {
      this.openShowMembersDialog();
    } else {
      this.addToChoosenChannelDialog();
    }
  }

  /**
   * Öffnet ein Dialogfenster zur Auswahl von Benutzern, die einem ausgewählten Kanal hinzugefügt werden sollen.
   */
  addToChoosenChannelDialog() {
    const dialogRef = this.dialog.open(AddToChoosenChannelComponent, {
      width: "100%",
      maxWidth: '873px'
    });
  }

  /**
   * Ein Subject, das als Kommunikationsmittel für das Scrolling im Chat verwendet wird.
   */
  private scrollTrigger = new Subject<string>();

  /**
   * Ein Observable, das auf die Änderungen des Scroll-Triggers reagiert.
   */
  scrollTrigger$ = this.scrollTrigger.asObservable();

  /**
   * Gibt eine zeitverzögerte Nachricht an das Scroll-Subject, um zum entsprechenden Element zu scrollen.
   * Diese Funktion wartet 500 ms, bevor sie die Nachricht sendet, um ein flüssiges Scrollen zu gewährleisten.
   * @param {string} elementId - Die ID des Elements, zu dem gescrollt werden soll.
   */
  triggerScrollTo(elementId: string) {
    setTimeout(() => {
      this.scrollTrigger.next(elementId);
    }, 500);
  }

  focusThreadTextArea() {
    setTimeout(() => {
      const textareas = document.querySelectorAll('textarea');
      if (textareas.length > 0) {
        const lastTextarea = textareas[textareas.length - 1];
        (lastTextarea as HTMLElement).focus();
      }
    }, 0); 
  }
}