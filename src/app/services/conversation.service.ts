import { inject, Injectable } from '@angular/core';
import { doc, addDoc, setDoc, Firestore, collection, onSnapshot} from '@angular/fire/firestore';
import { User } from '../models/user.model';
import { Conversation } from '../models/conversation.model';
import { AuthService } from './../services/auth.service';
import { InterfaceService } from './../services/interface.service';
import { FirebaseService } from './firebase.service';
import { UserDataService } from './user.service';
import { SearchbarService } from './searchbar.service';

@Injectable({
    providedIn: 'root'
})
export class ConversationService {
    FiBaService = inject(FirebaseService);
    firestore = inject(Firestore);
    authService = inject(AuthService);
    uiService = inject(InterfaceService);

    constructor(private userDataService: UserDataService, private searchbarSearvice: SearchbarService) {
    }

    /**
     * Starts a new conversation or opens an existing conversation between the current user and another user.
     *
     * @param {any} user - The target user object containing UID data.
     * @param {string} [openChat] - Optional parameter to display an open conversation.
     * @returns {Promise<void>} A promise that resolves when the conversation has started or opened.
     */
    async startConversation(user: any, openChat?: string) {
        let partnerId = user.uid
        let creatorId = this.authService.currentUserSig()?.uid;
        let existCon = this.searchConversation(creatorId, partnerId)
        if (existCon) {
            this.FiBaService.currentConversation = new Conversation(existCon);
            if (openChat) {
            } else {
                this.showUserChat(user);
            }
            this.listenToCurrentConversationChanges(this.FiBaService.currentConversation.conId);
        } else {
            await this.createNewConversation(creatorId, partnerId)
            if (openChat) {
            } else {
                this.showUserChat(user);
            }
            this.listenToCurrentConversationChanges(this.FiBaService.currentConversation.conId);
        }
        this.searchbarSearvice.emptyInput();
    }

    /**
     * Creates a new conversation between the current user and a partner.
     *
     * @param {any} creatorId - The UID of the current user.
     * @param {any} partnerId - The UID of the partner user.
     * @returns {Promise<void>} A promise that resolves when the conversation is created.
     */
    async createNewConversation(creatorId: any, partnerId: any) {
        this.FiBaService.currentConversation = new Conversation();
        this.FiBaService.currentConversation.creatorId = creatorId;
        this.FiBaService.currentConversation.partnerId = partnerId;
        this.FiBaService.currentConversation.user = [creatorId, partnerId];
        await this.addConversation(this.FiBaService.currentConversation);
    }

    /**
     * Subscribes to changes in a specific conversation in Firebase Firestore.
     *
     * @param {any} conversationId - The ID of the conversation.
     */
    listenToCurrentConversationChanges(conversationId: any) {
        const conversationRef = doc(this.firestore, `conversations/${conversationId}`);
        const unsubscribe = onSnapshot(conversationRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const updatedConversation = this.FiBaService.setConversationObject(docSnapshot.data());
                this.FiBaService.currentConversation = updatedConversation;
            }
        });
        this.FiBaService.registerListener(unsubscribe);
    }

    /**
     * Adds a new conversation to Firebase.
     *
     * @param {any} conversation - The conversation object to be added.
     * @returns {Promise<void>} A promise that resolves when the conversation is successfully added.
     */
    async addConversation(conversation: any) {
        const conData = this.getCleanJSON(conversation);
        const conversationRef = await addDoc(collection(this.firestore, "conversations"), conData)
        conData.conId = conversationRef.id,
            this.FiBaService.currentConversation.conId = conData.conId
        await setDoc(conversationRef, conData).catch((err) => {
            console.error('Error adding Conversation to firebase', err);
        });
        this.FiBaService.getAllConversations();
    }

    /**
     * Searches for an existing conversation between the current user and a partner.
     *
     * @param {unknown} creatorId - The UID of the current user.
     * @param {string} partnerId - The UID of the partner user.
     * @returns {Conversation | any} The found conversation object or `undefined` if no conversation is found.
     */
    searchConversation(creatorId: unknown, partnerId: string): Conversation | any {
        for (let i = 0; i < this.FiBaService.allConversations.length; i++) {
            const conversation: Conversation = this.FiBaService.allConversations[i];
            const searchedCreatorId = conversation.creatorId;
            const searchedPartnerId = conversation.partnerId;
            if (creatorId === searchedCreatorId && partnerId === searchedPartnerId
                ||
                creatorId === searchedPartnerId && partnerId === searchedCreatorId) {
                return conversation;
            }
        }
    }

    /**
     * Returns the current conversation of the user.
     *
     * @param {User} user - The user object of the partner.
     * @returns {Conversation} The conversation instance.
     */
    getCurrentConversation(user: User) {
        let partnerId = user.uid as string
        let creatorId = this.authService.currentUserSig()?.uid;
        return this.searchConversation(creatorId, partnerId)
    }

    /**
     * Prepares a conversation object for storage in Firebase.
     *
     * @param {Conversation} conversation - The conversation object to be converted to JSON.
     * @returns {Object} The converted JSON object.
     */
    getCleanJSON(conversation: Conversation) {
        return {
            conId: conversation.conId,
            creatorId: conversation.creatorId,
            partnerId: conversation.partnerId,
            messages: conversation.messages,
            user: conversation.user
        };
    }

    /**
     * Displays the chat with a specific user.
     *
     * @param {any} user - The user object of the partner.
     */
    showUserChat(user: any) {
        this.userDataService.setUser(user);
        this.uiService.changeContent('directMessage');
        this.uiService.closeThread();
    }

    /**
     * Searches for a conversation involving the current user and a target user.
     *
     * @param {User} foundUser - The target user object.
     * @returns {Conversation} The found conversation object or `undefined` if no conversation exists.
     */
    searchForConversation(foundUser: User) {
        let allConv = this.FiBaService.allConversations;
        const currentUserUid = this.authService.currentUserSig()?.uid;
        const filteredConversation = allConv.find((conv: any) =>
            conv.user.includes(foundUser.uid) && conv.user.includes(currentUserUid)
        );
        return filteredConversation as Conversation;
    }
}