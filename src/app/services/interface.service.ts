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
  * Checks whether the passed object is of type `User`.
  * @param {User | Channel} obj - The object to be checked.
  * @returns {obj is User} `true` if `obj` is of type `User`, otherwise `false`.
  */
  isUser(obj: User | Channel): obj is User {
    return 'uid' in obj;
  }

  /** 
   * Checks whether the passed object is of type `Channel`.
   * @param {User | Channel} obj - The object to be checked.
   * @returns {obj is Channel} `true` if `obj` is of type `Channel`, otherwise `false`.
   */
  isChannel(obj: User | Channel): obj is Channel {
    return 'chaId' in obj;
  }

  /**
   * Toggles the visibility of the Sidemenu.
   */
  toggleSidenav() {
    this.menuVisible = !this.menuVisible
    this.showSidenav.set(!this.showSidenav());
  }

  /**
   * Changes the type of content currently displayed.
   * @param {'channelChat' | 'newMessage' | 'directMessage'} content - The type of content to display.
   */
  changeContent(content: 'channelChat' | 'newMessage' | 'directMessage') {
    this.content = content;
  }

  /**
   * Hides the currently open thread window.
   */
  closeThread() {
    this.showThread = false;
  }

  /**
   * Opens the thread window.
   */
  openThread() {
    this.showThread = true;
    this.focusThreadTextArea();
  }

  /**
   * Sets the current message and initializes the listening method for changes in the thread associated with this message.
   * @param {Message} currentMsg - The current message.
   */
  setMsg(currentMsg: Message) {
    this.currentMessage = currentMsg;
    this.firebaseService.listenToCurrentThreadChanges(currentMsg.thread);
    this.setThread(currentMsg)
    this.openThread()
  }

  /**
   * Sets the current thread to the corresponding thread of the given message.
   * If there are messages in the thread, it will scroll to the last message.
   * @param {Message} currentMsg - The current message.
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
   * Finds a message by its `msgId` and calls a scroll function to scroll to this message in the chat window.
   * @param {Message} msg - The message to scroll to.
   */
  scrollInChat(msg: Message) {
    const targetMessageId = `${msg.msgId}`;
    this.triggerScrollTo(targetMessageId);
  }

  /**
   * Searches for the parent message for the given message within the threads.
   * @param {Message} currentMsg - The current message.
   * @returns {Message | undefined} The parent message, if any.
   */
  findParentMsg(currentMsg: Message) {
    let msg = this.firebaseService.allThreads.find(u => u.id === currentMsg.thread);
  }

  /**
   * Finds the associated thread for a given message.
   * @param {any} currentMsg - The message given.
   * @returns {Thread | undefined} The thread, if any.
   */
  findThread(currentMsg?: any) {
    let thread = this.firebaseService.allThreads.find(u => u.id === currentMsg.thread);
    return thread
  }

  /**
   * Determines the last message in a thread that follows the specified message.
   * @param {Message} currentMessage - The current message.
   * @returns {Message | undefined} The latest message in the thread or `undefined` if there are no messages.
   */
  findLastAnswer(currentMessage: Message) {
    let thread = this.findThread(currentMessage);
    let messages = thread?.messages;

    if (!messages || messages.length === 0) {
      return; 
    }

    return messages.reduce((latest, message) =>
      message.timeStamp > latest.timeStamp ? message : latest
    );
  }

  /**
   * Formats a given timestamp into an hour and minute combination in the format `HH:MM`.
   * @param {number} [timestamp] - The timestamp to be formatted.
   * @returns {string} The time in the format `HH:MM`.
   */
  formatTimeFromTimestamp(timestamp?: number): string {
    let time: number;
    if (timestamp) {
      time = timestamp
    } else {
      time = 0
    }
    const date = new Date(time); 
    const hours = date.getHours().toString().padStart(2, '0'); 
    const minutes = date.getMinutes().toString().padStart(2, '0'); 
    return `${hours}:${minutes}`;
  }

  /**
   * Opens a dialog window for viewing and managing members within a channel.
   */
  openShowMembersDialog() {
    const dialogRef = this.dialog.open(ShowMemberInChannelComponent, {
      width: "100%",
      maxWidth: '873px'
    });
  }

  /**
   * Checks whether the current breakpoint is an `XSmall` or `Small` and decides which dialog window to open.
   * If the breakpoint is small, `openShowMembersDialog()` is called, otherwise `addToChoosenChannelDialog()`.
   */
  openChannelDialog() {
    if (this.breakpointObserver.isXSmallOrSmall) {
      this.openShowMembersDialog();
    } else {
      this.addToChoosenChannelDialog();
    }
  }

  /**
   * Opens a dialog for selecting users to add to a selected channel.
   */
  addToChoosenChannelDialog() {
    const dialogRef = this.dialog.open(AddToChoosenChannelComponent, {
      width: "100%",
      maxWidth: '873px'
    });
  }

  /**
   * A subject used as a communication tool for chat scrolling.
   */
  private scrollTrigger = new Subject<string>();

  /**
   * An Observable that responds to the scroll trigger's changes.
   */
  scrollTrigger$ = this.scrollTrigger.asObservable();

  /**
   * Sends a time-delayed message to the Scroll Subject to scroll to the corresponding element.
   * This feature waits 500ms before sending the message to ensure smooth scrolling.
   * @param {string} elementId - The ID of the element to scroll to.
   */
  triggerScrollTo(elementId: string) {
    setTimeout(() => {
      this.scrollTrigger.next(elementId);
    }, 500);
  }

  /**
   * focused the textarea of the current opened thread
   */
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