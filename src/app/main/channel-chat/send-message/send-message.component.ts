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
   * Creates a new message based on the input type and executes the corresponding logic.
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
   * Creates a message for a channel or chat and saves it.
   * 
   * @param {('chat' | 'channel')} input - Specifies whether the message is for a chat or channel.
   */
  async createChannelAndChatMsg(input: 'chat' | 'channel') {
    let currentThreadId = await this.createThread(input);
    this.currentMsg = new Message();
    this.currentMsg.timeStamp = Date.now();
    this.currentMsg.senderId = this.authService.currentUserSig()?.uid;
    this.currentMsg.text = this.text;
    this.currentMsg.thread = currentThreadId; // wird ertsmal nicht erstellt (wegen array)
    this.currentMsg.reactions = []; // wird ertsmal nicht erstellt (wegen array)
    await this.addMessage(this.currentMsg);
  }

  /**
   * Creates a specific message for a thread and links it to a parent message.
   */
  async createThreadMsg() {
    this.currentMsg = new Message();
    this.currentMsg.timeStamp = Date.now();
    this.currentMsg.senderId = this.authService.currentUserSig()?.uid;
    this.currentMsg.text = this.text;
    this.currentMsg.reactions = []; // wird ertsmal nicht erstellt (wegen array)
    this.currentMsg.parent = this.uiService.currentMessage;
    await this.addThreadMessage(this.currentMsg);
  }

/**
 * Creates threads for all selected recipients and adds messages.
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
    await this.addMessage(this.currentMsg, receiver);
  }
}

/**
 * Creates a new thread in Firestore based on the input type and an optional recipient.
 * @param {('chat' | 'channel' | 'newMsg')} input - The type of thread to create.
 * @param {Channel | User} [receiver] - Optional recipient of the thread.
 * @returns {Promise<string>} The ID of the created thread.
 */
async createThread(input: 'chat' | 'channel' | 'newMsg', receiver?: Channel | User): Promise<string> {
  const currentUser = this.authService.currentUserSig();
  let objId: string = "";
  if (!currentUser) {
    console.error('No authenticated user found');
    throw new Error('User not authenticated');
  }
  if (input == 'chat') {
    objId = this.fiBaService.currentConversation.conId as string;
    let threadId = await this.addThread(objId, 'conversation');
    return threadId;
  } else if (input == 'channel') {
    objId = this.channelService.currentChannelSubject.value.chaId;
    let threadId = await this.addThread(objId, 'channel');
    return threadId;
  } else {
    if (receiver) {
      let threadId = await this.checkReceiver(receiver, objId, input);
      return threadId;
    } else {
      let threadId = await this.addThread(objId, input);
      return threadId;
    }
  }
  return "";
}

/**
 * Checks the type of recipient (user or channel) and creates the corresponding thread.
 * @param {User | Channel} receiver - The recipient of the thread.
 * @param {string} objId - Object ID for the conversation or channel.
 * @param {('newMsg')} input - The type of thread.
 */
async checkReceiver(receiver: User | Channel, objId: string, input: 'newMsg') {
  if ('uid' in receiver) {
    objId = this.conService.searchForConversation(receiver).conId as string;
  } else {
    objId = receiver.chaId;
  }
  let threadId = await this.addThread(objId, input);
  return threadId;
}

/**
 * Adds a thread to the Firestore collection with the given parameters.
 * @param {string} objId - Object ID for the conversation or channel.
 * @param {('conversation' | 'channel' | 'newMsg')} input - The type of thread.
 * @returns {Promise<string>} The ID of the created thread.
 */
async addThread(objId: string, input: 'conversation' | 'channel' | 'newMsg') {
  let thread = this.getCleanThreadJSON(new Thread(), input, objId);
  const threadRef = await addDoc(collection(this.firestore, 'threads'), thread);
  return threadRef.id;
}

/**
 * Adds a message to an existing thread in Firestore.
 * @param {Message} message - The message object to be added.
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
    console.error('Error adding message:', error);
  }
}

/**
 * Adds a message to a conversation or channel based on the context.
 * @param {any} message - The message object to be added.
 * @param {Channel | User} [receiver] - Optional recipient of the message.
 */
async addMessage(message: any, receiver?: Channel | User) {
  let objId;
  let coll = 'conversation';
  if (this.uiService.content == 'channelChat') {
    objId = this.channelService.currentChannelSubject.value.chaId;
    coll = 'channels';
  } else if (this.uiService.content == 'directMessage') {
    objId = this.fiBaService.currentConversation.conId;
    coll = 'conversations';
  } else {
    if (receiver) {
      if ('uid' in receiver) {
        objId = this.conService.searchForConversation(receiver).conId;
        coll = 'conversations';
      } else {
        objId = receiver.chaId;
        coll = 'channels';
      }
    }
  }
  await this.updateDocument(message, coll, objId as string);
}

/**
 * Updates a Firestore document with a new message.
 * @param {Message} message - The message object to be added.
 * @param {string} coll - The name of the collection ('conversations' or 'channels').
 * @param {string} objId - The ID of the document to be updated.
 */
async updateDocument(message: Message, coll: string, objId: string) {
  const msgData = this.getCleanJSON(message);
  msgData.msgId = uuidv4();
  const conversationRef = doc(this.firestore, `${coll}/${objId}`);
  try {
    await updateDoc(conversationRef, {
      messages: arrayUnion(msgData)
    });
  } catch (error) {
    console.error('Error adding message:', error);
  }
  this.uiService.scrollInChat(msgData);
}

/**
 * Displays a confirmation box for sending a message.
 */
showConfirmBox() {
  this.uiService.msgConfirmed = true;
  setTimeout(() => {
    this.uiService.msgConfirmed = false;
  }, 4500);
}

/**
 * Clears the fields for searching new messages and resets inputs.
 */
emptyNewMsgSearch() {
  this.searchbarService.newMsgSearchName = "";
  this.searchbarService.filteredResults = [];
  this.uiService.selectedConversations = [];
  this.text = "";
}

  /**
   * Returns a cleaned JSON object for a given message.
   * @param {Message} message - The message to be cleaned up.
   * @returns {object} The cleaned JSON object.
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
   * Returns a cleaned JSON object for a given thread.
   * @param {Thread} thread - The thread to be cleaned up.
   * @param {string} input - typ of the thread
   * @param {string} objId - The object ID of the conversation or channel.
   * @returns {object} The cleaned JSON object.
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
   * Checks whether the input field is empty and adjusts the input status accordingly.
   */
  checkemptyInput() {
    this.isDisabled = this.text.trim() === '';
  }

  /**
   * Toggles the visibility of the emoji picker.
   */
  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  /**
   * Handles clicks outside specific elements to hide them.
   * @param {Event} event - The click Event.
   */
  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: Event) {
    if (this.emojiPicker && !this.emojiPicker.nativeElement.contains(event.target)) {
      this.showEmojiPicker = false;
    }
    if (this.userList) {
      this.showUserList = false;
    }
  }

  /**
   * Adds an emoji to the input text.
   * @param {any} event - The event with the emoji data.
   */
  addEmoji(event: any) {
    const emoji = event.emoji.native;
    this.text += emoji;
    this.textArea.nativeElement.focus();
    this.toggleEmojiPicker();
    this.checkemptyInput();
  }

  /**
   * Toggles the visibility of the user list for marking.
   */
  toggleUserList() {
    this.showUserList = !this.showUserList;
  }

  /**
   * Tags a user by selecting their username.
   * @param {string} user - The username to tag.
   */
  tagUserBtn(user: string) {
    this.text += `@${user} `;
    this.textArea.nativeElement.focus();
    this.checkemptyInput();
  }

  /**
   * added the selected name of the user or channel to the textarea 
   * @param symbol the entered symbol '@' or '#'
   * @param selectedName 
   */
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

  /**
   * focused the current textarea
   */
  ngOnChanges(): void {
    setTimeout(() => {
      this.textArea.nativeElement.focus();
    }, 0);
  }

  /**
   * focused the current textarea
   */
  ngAfterViewInit() {
    setTimeout(() => {
      this.textArea.nativeElement.focus();
    }, 0);
  }
}
