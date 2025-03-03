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
   * Lädt alle relevanten Benutzerdaten asynchron und zeigt währenddessen eine Ladeanzeige an.
   * Die Daten werden parallel geladen und anschließend verarbeitet.
   * @param currentUid Die eindeutige Benutzer-ID des aktuell angemeldeten Benutzers.
   */
  async initializeData(currentUid: string) {
    this.isLoading = true;

    try {
      // Daten parallel laden
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
   * Verschiebt den Benutzer mit der angegebenen UID an den Anfang der Benutzerliste.
   * Wird verwendet, um den aktuell angemeldeten Benutzer hervorzuheben.
   * @param currentUid Die eindeutige Benutzer-ID des aktuellen Benutzers.
   */
  moveUserToFront(currentUid: string): void {
    const index = this.allUsers.findIndex(user => user.uid === currentUid);

    if (index > 0) {
      const [currentUser] = this.allUsers.splice(index, 1);
      this.allUsers.unshift(currentUser);
    }
  }

  /**
   * Sortiert die Liste aller Benutzer basierend auf ihrem Status.
   * Online-Benutzer werden an den Anfang der Liste verschoben.
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
   * Entfernt alle aktiven Listener und leert die Liste der Listener.
   * Setzt das Flag für aktive Channel-Listener zurück.
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
   * Lädt alle Channels, denen der Benutzer angehört.
   * Verhindert mehrfaches Laden, wenn bereits ein Listener aktiv ist.
   * @param userUid Die eindeutige Benutzer-ID.
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
   * Startet einen Snapshot-Listener, um Benutzerkanäle in Echtzeit zu aktualisieren.
   * Lädt Channels, die den Benutzer enthalten, und speichert sie lokal.
   * @param userUid Die eindeutige Benutzer-ID.
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
   * Registriert einen Listener, um ihn später entfernen zu können.
   * @param unsubscribeFn Die Funktion, die den Listener entfernt.
   */
  public registerListener(unsubscribeFn: () => void): void {
    this.unsubscribeListeners.push(unsubscribeFn);
  }

  /**
   * Lädt alle Benutzer aus der Firestore-Datenbank und speichert sie in einer lokalen Liste.
   * Sortiert die Benutzer nach Status und verschiebt den aktuellen Benutzer an den Anfang.
   * @param currentUid Die eindeutige Benutzer-ID des aktuellen Benutzers.
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
   * Lädt alle Threads aus der Firestore-Datenbank und speichert sie lokal.
   * Aktualisiert die Liste in Echtzeit mithilfe eines Snapshot-Listeners.
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
   * Hört auf Änderungen an einem bestimmten Thread und aktualisiert die aktuelle Unterhaltung in Echtzeit.
   * @param threadId Die eindeutige ID des Threads.
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
   * Lädt alle Unterhaltungen aus der Firestore-Datenbank und speichert sie lokal.
   * Aktualisiert die Liste in Echtzeit mithilfe eines Snapshot-Listeners.
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
   * Erstellt ein strukturiertes Conversation-Objekt aus den Rohdaten einer Firestore-Datenbankabfrage.
   * @param conversation Die Rohdaten der Unterhaltung.
   * @returns Ein `Conversation`-Objekt.
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
   * Weist allen Benutzern die angegebene Channel-ID zu und speichert die Daten in der Firestore-Datenbank.
   * @param chaId Die ID des Channels.
   * @param currentChannel Die Daten des aktuellen Channels.
   */
  async assignUsersToChannel(chaId: string, currentChannel: any) {
    try {
      const channelRef = doc(this.firestore, `channels/${chaId}`);
      await updateDoc(channelRef, { users: this.allUsersIds, chaId: currentChannel.chaId });

    } catch (error) {
    }
  }

  /**
   * Fügt alle Benutzer zu einem bestimmten Channel hinzu.
   * Ruft die Funktion `assignUsersToChannel` auf.
   * @param chaId Die ID des Channels.
   * @param currentChannel Die Daten des aktuellen Channels.
   */
  async addAllUsersToChannel(chaId: string, currentChannel: any) {
    await this.assignUsersToChannel(chaId, currentChannel)

  }

  /**
   * Fügt einen neuen Benutzer in die Firestore-Datenbank ein.
   * @param user Die Benutzerdaten, die gespeichert werden sollen.
   */
  async addUser(user: any) {
    const userId = user.uid;
    const userData = user.getJSON();

    await setDoc(doc(this.firestore, "users", userId), userData);
    this.addToWelcomeChannel(user)
  }

  /**
   * 
   * @param user 
   */
  async addToWelcomeChannel(user:any){
    try {
      const channelRef = doc(this.firestore, `channels/ynn3Uv048rQzNGdlXrIp`);
      await updateDoc(channelRef, { users: arrayUnion(user.uid) , chaId: `ynn3Uv048rQzNGdlXrIp` });

    } catch (error) {
    }
  }

  /**
   * Aktualisiert den Status eines Benutzers in der Firestore-Datenbank.
   * @param currentUser Die aktuellen Benutzerdaten.
   * @param status Der neue Status, z. B. "online" oder "offline".
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
   * Fügt die ausgewählten Benutzer zu einem Channel hinzu.
   * Aktualisiert die Firestore-Datenbank mit den neuen Benutzerinformationen.
   * @param ChannelId Die ID des Channels.
   */
  async addUsersToChannel(ChannelId: string) {
    const userRef = doc(this.firestore, "channels", ChannelId);
    await updateDoc(userRef, {
      users: this.selectedUsers
    });
  }

  /**
   * Ruft die Daten eines bestimmten Benutzers anhand der UID ab.
   * Verwendet einen Snapshot-Listener, um die Daten abzurufen.
   * @param uid Die eindeutige Benutzer-ID.
   * @returns Eine Promise, die die Benutzerdaten oder einen Fehler zurückgibt.
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
   * Hört auf Änderungen der Benutzerdaten in der Firestore-Datenbank.
   * Aktualisiert die lokalen Benutzerdaten bei jeder Änderung.
   * @param id Die ID des Benutzers.
   */
  async subscribeUserById(id: any) {
    const unsubscribe = onSnapshot(this.getUserDocRef(id), (user) => {
      this.user = this.setUserJson(user.data(), user.id);
    });    
    this.registerListener(unsubscribe);
  }

  /**
   * Aktualisiert die Daten eines Benutzers in der Firestore-Datenbank.
   * @param user Die neuen Benutzerdaten.
   */
  async updateUser(user: any) {
    if (user.uid) {
      let docRef = this.getUserDocRef(user.uid);
      await updateDoc(docRef, this.getUserAsCleanJson(user));
    }
    this.getAllUsers(user.uid)
  }

    /**
   * Aktualisiert die Daten eines Benutzers in der Firestore-Datenbank.
   * @param user Die neuen Benutzerdaten.
   */
    async updateUserData(user: any) {
      if (user.uid) {
        let docRef = this.getUserDocRef(user.uid);
        await updateDoc(docRef, this.getUserAsCleanJson(user));
      }
    }

  /**
   * Schaltet den Zustand eines Channels um (offen/geschlossen).
   */
  toggleChannel() {
    this.isClosed = !this.isClosed;
  }

  /**
   * Gibt die Dokumentreferenz für einen Benutzer basierend auf der Dokument-ID zurück.
   * @param docId Die ID des Benutzerdokuments.
   * @returns Die Dokumentreferenz.
   */
  getUserDocRef(docId: any) {
    return doc(collection(this.firestore, 'users'), docId);
  }

  /**
   * Erstellt ein strukturiertes JSON-Objekt für einen Benutzer.
   * @param object Die Rohdaten des Benutzers.
   * @param id Die eindeutige Benutzer-ID.
   * @returns Ein JSON-Objekt mit den Benutzerdaten.
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
   * Konvertiert ein Benutzerobjekt in ein sauberes JSON-Format.
   * Entfernt unnötige Felder und bereitet die Daten für die Speicherung vor.
   * @param object Das Benutzerobjekt.
   * @returns Ein JSON-Objekt mit den bereinigten Benutzerdaten.
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


