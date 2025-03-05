import { forwardRef, Inject, inject, Injectable } from '@angular/core';
import { doc, setDoc, Firestore, updateDoc, collection, onSnapshot, query, arrayUnion, writeBatch, docData, DocumentData, QuerySnapshot, where } from '@angular/fire/firestore';
import { User } from '../models/user.model';
import { Unsubscribe, UserCredential } from '@angular/fire/auth';
import { Conversation } from '../models/conversation.model';
import { Channel } from '../models/channel.model';
import { signal } from '@angular/core';
import { ChannelService } from './channel.service';
import { UserDataService } from './user.service';
import { AuthService } from './auth.service';
import { ConversationService } from './conversation.service';
import { Thread } from '../models/thread.model';
import { Message } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  userObject!: DocumentData | undefined;
  allUsers: User[] = [];
  allUsersIds: any = [];
  allThreads: Thread[] = [];
  allConversations: Conversation[] = [];
  allChannels: Channel[] = [];
  selectedUsers: any = []
  public unsubscribeListeners: (() => void)[] = [];
  isUserChannelsListenerActive: boolean = false;
  isClosed = false;
  user: any;
  currentConversation: Conversation = new Conversation();
  firestore = inject(Firestore);
  isLoading = true;



  constructor() { }

/**
   * Loads all relevant user data asynchronously and displays a loading indicator while doing so.
   * The data is loaded in parallel and then processed.
   * @param currentUid The unique user ID of the currently logged in user.
   */
  async initializeData(currentUid: string) {
    this.isLoading = true;

    try {
      await Promise.all([
        this.getAllUsers(currentUid),
        this.getAllConversations(),
        this.loadUserChannels(currentUid || ''),
        this.loadAllThreads(),
      ]);
    } catch (error) {
    } finally {
      setTimeout(() => {
        this.isLoading = false;
      }, 1500);
    }
  }

/**
   * Moves the user with the specified UID to the top of the user list.
   * Used to highlight the currently logged in user.
   * @param currentUid The unique user ID of the current user.
   */
  moveUserToFront(currentUid: string): void {
    const index = this.allUsers.findIndex(user => user.uid === currentUid);

    if (index > 0) {
      const [currentUser] = this.allUsers.splice(index, 1);
      this.allUsers.unshift(currentUser);
    }
  }

/**
   * Sorts the list of all users based on their status.
   * Online users are moved to the top of the list.
   */
  sortByStatus() {
    this.allUsers.sort((a, b) => {
      if (a.status === 'online' && b.status !== 'online') {
        return -1;
      } else if (a.status !== 'online' && b.status === 'online') {
        return 1;
      } else {
        return 0;
      }
    });
  }

/**
   * Removes all active listeners and clears the list of listeners.
   * Resets the active channel listener flag.
   */
  unsubscribeAll() {
    this.unsubscribeListeners.forEach((unsub, index) => {
      try {
        unsub();
      } catch (error) {
      }
    });
    this.unsubscribeListeners = [];
    this.isUserChannelsListenerActive = false;
  }

/**
   * Loads all channels the user belongs to.
   * Prevents multiple loading if a listener is already active.
   * @param userUid The unique user ID.
   */
  loadUserChannels(userUid: string) {
    if (!userUid) {
      return;
    }

    if (this.isUserChannelsListenerActive) {
      return;
    }
    this.loadAfterChecking(userUid);
  }

/**
   * Launches a snapshot listener to update user channels in real time.
   * Loads channels containing the user and saves them locally.
   * @param userUid The unique user ID.
   */
  loadAfterChecking(userUid: string) {
    const channelsRef = collection(this.firestore, 'channels');
    const userChannelsQuery = query(channelsRef, where("users", "array-contains", userUid));
    const unsubscribe = onSnapshot(userChannelsQuery, (snapshot) => {
      this.allChannels = [];
      snapshot.forEach((doc) => {
        this.allChannels.push(doc.data() as Channel)
      })
    }, (error) => {
    });

    this.registerListener(unsubscribe);
    this.isUserChannelsListenerActive = true;
  }

/**
   * Registers a listener for later removal.
   * @param unsubscribeFn The function that removes the listener.
   */
  public registerListener(unsubscribeFn: () => void): void {
    this.unsubscribeListeners.push(unsubscribeFn);
  }

/**
   * Loads all users from the Firestore database and saves them to a local list.
   * Sorts users by status and moves the current user to the top.
   * @param currentUid The unique user ID of the current user.
   */
  async getAllUsers(currentUid: string) {
    const q = query(collection(this.firestore, "users"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      this.allUsers = [];
      this.allUsersIds = [];
      querySnapshot.forEach((doc) => {
        let user = doc.data() as User

        this.allUsers.push(user);
        this.allUsersIds.push(doc.id);
      });
      this.sortByStatus();
      this.moveUserToFront(currentUid);
    });
    this.registerListener(unsubscribe);
  }

/**
   * Loads all threads from the Firestore database and saves them locally.
   * Updates the list in real time using a snapshot listener.
   */
  async loadAllThreads() {
    const q = query(collection(this.firestore, "threads"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      this.allThreads = [];
      querySnapshot.forEach((doc) => {
        let thread = doc.data() as Thread
        thread.id = doc.id;
        this.allThreads.push(thread);
      });
    });

    this.registerListener(unsubscribe);
  }

/**
   * Listen for changes to a specific thread and update the current conversation in real time.
   * @param threadId The unique ID of the thread.
   */
  listenToCurrentThreadChanges(threadId: any) {
    const conversationRef = doc(this.firestore, `conversations/${threadId}`);
    const unsubscribe = onSnapshot(conversationRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const updatedConversation = this.setConversationObject(docSnapshot.data());
        this.currentConversation = updatedConversation;
      }
    });
    this.registerListener(unsubscribe);
  }

/**
   * Loads all conversations from the Firestore database and saves them locally.
   * Updates the list in real time using a snapshot listener.
   */
  async getAllConversations() {
    const q = query(collection(this.firestore, "conversations"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      this.allConversations = [];
      querySnapshot.forEach((doc) => {
        const conv = this.setConversationObject(doc.data());
        this.allConversations.push(conv);
      });

    });
    this.registerListener(unsubscribe);
  }

/**
   * Creates a structured conversation object from the raw data of a Firestore database query.
   * @param conversation The raw data of the conversation.
   * @returns A `Conversation` object.
   */
  setConversationObject(conversation: any): Conversation {
    return {
      conId: conversation.conId || '',
      creatorId: conversation.creatorId || '',
      partnerId: conversation.partnerId || '',
      messages: conversation.messages || [],
      user: conversation.user || []
    };
  }

/**
   * Assigns the specified channel ID to all users and stores the data in the Firestore database.
   * @param chaId The ID of the channel.
   * @param currentChannel The data of the current channel.
   */
  async assignUsersToChannel(chaId: string, currentChannel: any) {
    try {
      const channelRef = doc(this.firestore, `channels/${chaId}`);
      await updateDoc(channelRef, { users: this.allUsersIds, chaId: currentChannel.chaId });

    } catch (error) {
    }
  }

/**
   * Adds all users to a specific channel.
   * Calls the `assignUsersToChannel` function.
   * @param chaId The ID of the channel.
   * @param currentChannel The data of the current channel.
   */
  async addAllUsersToChannel(chaId: string, currentChannel: any) {
    await this.assignUsersToChannel(chaId, currentChannel)

  }

/**
   * Adds a new user to the Firestore database.
   * @param user The user data to be saved.
   */
  async addUser(user: any) {
    const userId = user.uid;
    const userData = user.getJSON();

    await setDoc(doc(this.firestore, "users", userId), userData);
    this.addToWelcomeChannel(user)
  }

  /**
   * addet the new registered user to the 'Welcome' Channel
   * @param user the new registered user
   */
  async addToWelcomeChannel(user:any){
    try {
      const channelRef = doc(this.firestore, `channels/ynn3Uv048rQzNGdlXrIp`);
      await updateDoc(channelRef, { users: arrayUnion(user.uid) , chaId: `ynn3Uv048rQzNGdlXrIp` });

    } catch (error) {
    }
  }

/**
   * Updates a user's status in the Firestore database.
   * @param currentUser The current user data.
   * @param status The new status, e.g. B. “online” or “offline”.
   */
  async setUserStatus(currentUser: UserCredential | null, status: string) {
    if (!currentUser || !currentUser.user) {
      return;
    }

    const userRef = doc(this.firestore, "users", currentUser.user.uid);
    try {
      await updateDoc(userRef, { status: status });
    } catch (error) {
    }
  }

/**
   * Adds the selected users to a channel.
   * Updates the Firestore database with the new user information.
   * @param ChannelId The ID of the channel.
   */
  async addUsersToChannel(ChannelId: string) {
    const userRef = doc(this.firestore, "channels", ChannelId);
    await updateDoc(userRef, {
      users: this.selectedUsers
    });
  }

/**
   * Retrieves a specific user's data by UID.
   * Uses a snapshot listener to retrieve the data.
   * @param uid The unique user ID.
   * @returns A promise that returns the user data or an error.
   */
  getCurrentUser(uid: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(doc(this.firestore, "users", uid), (doc) => {
        if (doc.exists()) {
          resolve(doc.data());
        } else {
          reject("Benutzer nicht gefunden");
        }
        unsubscribe();
      });
    });
  }

/**
   * Listens for user data changes in the Firestore database.
   * Updates local user data with every change.
   * @param id The user's ID.
   */
  async subscribeUserById(id: any) {
    const unsubscribe = onSnapshot(this.getUserDocRef(id), (user) => {
      this.user = this.setUserJson(user.data(), user.id);
    });    
    this.registerListener(unsubscribe);
  }

/**
   * Updates a user's information in the Firestore database.
   * @param user The new user data.
   */
  async updateUser(user: any) {
    if (user.uid) {
      let docRef = this.getUserDocRef(user.uid);
      await updateDoc(docRef, this.getUserAsCleanJson(user));
    }
    this.getAllUsers(user.uid)
  }

/**
   * Updates a user's information in the Firestore database.
   * @param user The new user data.
   */
    async updateUserData(user: any) {
      if (user.uid) {
        let docRef = this.getUserDocRef(user.uid);
        await updateDoc(docRef, this.getUserAsCleanJson(user));
      }
    }

/**
   * Toggles the state of a channel (open/closed).
   */
  toggleChannel() {
    this.isClosed = !this.isClosed;
  }

/**
   * Returns the document reference for a user based on document ID.
   * @param docId The ID of the user document.
   * @returns The document reference.
   */
  getUserDocRef(docId: any) {
    return doc(collection(this.firestore, 'users'), docId);
  }

/**
   * Creates a structured JSON object for a user.
   * @param object The user's raw data.
   * @param id The unique user ID.
   * @returns A JSON object containing the user data.
   */
  setUserJson(object: any, id: string): any {
    return {
      uid: id,
      username: object.username,
      email: object.email,
      status: object.status,
      avatar: object.avatar,
      channels: object.channels,
      role: object.role
    }
  }

/**
   * Converts a user object to a clean JSON format.
   * Removes unnecessary fields and prepares data for storage.
   * @param object The user object.
   * @returns A JSON object containing the cleaned user data.
   */
  getUserAsCleanJson(object: any): {} {
    return {
      uid: object.uid,
      username: object.username,
      email: object.email,
      status: object.status,
      avatar: object.avatar,
      channels: object.channels,
      role: object.role
    }
  }
  
}


