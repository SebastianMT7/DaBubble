import { inject, Injectable } from '@angular/core';
import { updateDoc, addDoc, doc, collection, Firestore, onSnapshot, query, setDoc, collectionData, } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';
import { Channel } from '../models/channel.model';
import { ConversationService } from './conversation.service';
import { InterfaceService } from './interface.service';
import { FirebaseService } from './firebase.service';
import { where } from 'firebase/firestore';
import { UserDataService } from './user.service';
import { AuthService } from './auth.service';
import { SearchbarService } from './searchbar.service';

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  currentChannel = new Channel();
  newChannel: Channel = new Channel(); 
  uiService = inject(InterfaceService);
  conService = inject(ConversationService);
  allChannels: Channel[] = [];

  public currentChannelSubject = new BehaviorSubject<Channel>(new Channel());
  currentChannel$ = this.currentChannelSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private firebaseService: FirebaseService,
    private userService: UserDataService,
    private authService: AuthService,
    private searchbarSearvice: SearchbarService
  ) {
    this.getAllChannels();
  }



  /**
 * Listens to real-time updates for a specific channel by its ID.
 * Updates the current channel subject with new data when changes occur.
 * 
 * @param {string} chaId - The ID of the channel to listen to.
 */
  listenToChannel(chaId: string) {
    const channelRef = doc(this.firestore, `channels/${chaId}`);

    const unsubscribe = onSnapshot(channelRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const updatedChannel = docSnapshot.data() as Channel;
        this.currentChannelSubject.next(updatedChannel);
      }
    });
    this.firebaseService.registerListener(unsubscribe);
  }

  /**
   * Updates the title and description of a specific channel.
   * 
   * @param {string} channelId - The ID of the channel to update.
   * @param {string} title - The new title for the channel.
   * @param {string} description - The new description for the channel.
   * @returns {Promise<void>}
   */
  async updateChannel(channelId: string, title: string, description: string): Promise<void> {
    if (!channelId) {
      console.error("Fehler: Keine gültige Channel-ID angegeben.");
      return;
    }

    const channelRef = doc(this.firestore, `channels/${channelId}`);

    try {
      await updateDoc(channelRef, { title, description });
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Channels:", error);
    }
  }

  /**
   * Update the userlist from a channel
   * 
   * @param {string} channelId - The ID of the channel to update.
   * @param {any} users - The updated list of users.
   * @returns {Promise<void>}
   */
  async updateUserList(channelId: string, users: any): Promise<void> {
    if (!channelId) {
      console.error("Fehler: Keine gültige Channel-ID angegeben.");
      return;
    }

    const channelRef = doc(this.firestore, `channels/${channelId}`);

    try {
      await updateDoc(channelRef, { users });
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Channels:", error);
    }
  }

  /**
   * Sets the current channel in the observable subject.
   * 
   * @param {Channel} channel - The channel to set as the current channel.
   */
  setCurrentChannel(channel: Channel) {
    this.currentChannelSubject.next(channel);
  }

  /**
   * Sets the channel in the observable subject.
   * 
   * @param {any} user - The channel or user to set.
   */
  setChannel(user: any) {
    this.currentChannelSubject.next(user);
  }

  /**
   * Displays the chat interface for a specific channel.
   * 
   * @param {any} channel - The channel to show in the chat.
   */
  showChannelChat(channel: any) {
    this.setChannel(channel);
    this.setCurrentChannel(channel);
    this.uiService.changeContent('channelChat');
    this.uiService.closeThread();
    this.listenToChannel(channel.chaId);
    this.searchbarSearvice.emptyInput();
  }

  /**
   * Creates a new channel with the provided parameters.
   * Adds selected or all users to the channel and assigns an ID to it.
   * 
   * @param {boolean} isSelected - Whether to add selected users or all users to the channel.
   * @param {any} currentUser - The currently logged-in user.
   */
  async createChannel(isSelected: boolean, currentUser: any) {
    const newChannel = new Channel();
    newChannel.title = this.currentChannel.title;
    newChannel.creatorId = this.authService.currentUserSig()?.username ?? "";
    newChannel.users = isSelected ? this.firebaseService.selectedUsers.map((user: any) => user.uid) : this.firebaseService.allUsersIds;
    newChannel.description = this.currentChannel.description;

    const channelData = newChannel.getJSON();
    const channelRef = await addDoc(collection(this.firestore, "channels"), channelData);
    newChannel.chaId = channelRef.id;
     

    if (isSelected) {
      this.firebaseService.selectedUsers = newChannel.users;
      this.firebaseService.selectedUsers.push(currentUser);
      await this.firebaseService.addUsersToChannel(newChannel.chaId);
      await this.assignChatId(newChannel.chaId);
    } else {
      await this.firebaseService.addAllUsersToChannel(newChannel.chaId, newChannel);
    }
    this.setCurrentChannel(newChannel);
    this.showChannelChat(newChannel);
  }

  /**
   * Retrieves all channels and listens for real-time updates.
   */
  async getAllChannels() {
    const q = query(collection(this.firestore, "channels"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      this.allChannels = [];
      querySnapshot.forEach((doc) => {
        this.convertData(doc.data(), doc.id);
        
      });
    });
    this.firebaseService.registerListener(unsubscribe);
  }

  /**
   * Converts Firestore data into a Channel object and adds it to the channel list.
   * 
   * @param {any} data - The raw Firestore data for the channel.
   * @param {string} id - The ID of the channel.
   */
  convertData(data: any, id: string) {
    const newChannel = new Channel();
    newChannel.title = data['title'];
    newChannel.description = data['description'];
    newChannel.chaId = id;
    newChannel.creatorId = data['creatorId'];
    newChannel.users = data['users'];
    newChannel.messages = data['messages'];
    newChannel.comments = data['comments'];
    newChannel.reactions = data['reactions'];

    this.allChannels.push(newChannel);
  }

  /**
   * Listens for changes to the current channel and updates its data.
   */
  listenToCurrentChannelChanges() {
    const conversationRef = doc(this.firestore, `channels/${this.currentChannelSubject.value.chaId}`);
    const unsubscribe = onSnapshot(conversationRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const updatedConversation = this.setChannelObject(docSnapshot.data() as Channel);
        this.currentChannelSubject = updatedConversation;
      }
    });
    this.firebaseService.registerListener(unsubscribe);
  }

  /**
   * Assigns a unique chat ID to a channel.
   * 
   * @param {string} chaId - The ID of the channel to update.
   */
  async assignChatId(chaId: string) {
    try {
      const channelRef = doc(this.firestore, `channels/${chaId}`);
      await updateDoc(channelRef, { chaId: `${chaId}` });
    } catch (error) {
      console.error("Fehler beim Zuweisen der Chat-ID:", error);
    }
  }

  /**
   * Converts a Channel object to a structured data format.
   * 
   * @param {Channel} channel - The channel object to convert.
   * @returns {any} A structured representation of the channel.
   */
  setChannelObject(channel: Channel): any {
    return {
      chaId: channel.chaId || '',
      creatorId: channel.creatorId || '',
      messages: channel.messages || [],
      title: channel.title || '',
      users: channel.users || [],
      description: channel.description,
      reactions: channel.reactions,
      comments: channel.comments,
    };
  }
}