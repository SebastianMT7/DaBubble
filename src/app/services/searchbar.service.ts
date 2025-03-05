import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { Channel } from '../models/channel.model';
import { Conversation } from '../models/conversation.model';
import { FirebaseService } from './firebase.service';
import { user } from '@angular/fire/auth';
import { AuthService } from './auth.service';
import { Thread } from '../models/thread.model';
import { BehaviorSubject } from 'rxjs';

type CurrentObject =
  | { name: "user"; data: User }
  | { name: "channel"; data: Channel }
  | { name: "conversation"; data: Conversation }
  | { name: "channel-chat"; channelId: string; data: Channel }
  | { name: "thread"; data: Thread }

@Injectable({
  providedIn: 'root'
})

export class SearchbarService {
  searchName: string = "";
  newMsgSearchName: string = "";
  searchNameSendMsg: string = "";
  searchNameSendMsgThread: string = "";
  filteredResults: any[] = [];
  filteredResultsSendMsg: any[] = [];
  filteredResultsSendMsgThread: any[] = [];
  isInputEmpty: boolean = false;
  allObjects: CurrentObject[] = [];

  constructor(private firebaseService: FirebaseService, private authService: AuthService) { }

/**
 * Combines arrays of Firebase objects into a single array of objects with types and data.
 * Each object contains a type (e.g., "user", "channel", "conversation") and its corresponding data.
 * 
 * The arrays `allUsers`, `allChannels`, `allConversations`, and `allThreads` are iterated through, 
 * and each element is transformed into a new object with a type and data property.
 */
  combineArraysWithTypes() {
    this.allObjects = [];

    this.firebaseService.allUsers.forEach(user => {
      this.allObjects.push({ name: "user", data: user });
    });

    this.firebaseService.allChannels.forEach(channel => {
      this.allObjects.push({ name: "channel", data: channel });
      this.allObjects.push({ name: "channel-chat", channelId: channel.chaId, data: channel });
    });

    this.firebaseService.allConversations.forEach(conversation => {
      if (conversation.creatorId == (this.authService.currentUserSig()?.uid) || conversation.partnerId == (this.authService.currentUserSig()?.uid)) {
        this.allObjects.push({ name: "conversation", data: conversation });
      }
    });

    this.firebaseService.allThreads.forEach(thread => {
      this.allObjects.push({ name: "thread", data: thread });
    });
  }


/**
 * Checks if the selected user input is empty and sets the visibility of the input mask to `true` if no users are selected.
 * Also resets `searchName` to an empty string.
 */
  emptyInput() {
    this.isInputEmpty = this.firebaseService.selectedUsers.length === 0;
    this.searchName = "";
  }

 /**
 * Resets the `newMsgSearchName` to an empty string and clears the `filteredResults`.
 */
  emptyMsgInput() {
    this.newMsgSearchName = "";
    this.searchNameSendMsg = "";
    this.searchNameSendMsgThread = "";
    this.filteredResults = [];
    this.filteredResultsSendMsg = [];
    this.filteredResultsSendMsgThread = [];
  }

/**
 * Filters users and channels based on `searchName`.
 * Filtering is done by username for users, title/description for channels, 
 * and message content for conversations and threads.
 * 
 * @returns {Array} - An array of filtered objects based on the search criteria.
 */
  get filteredUsers() {
    if (this.searchName.trim().length < 1) {
      return [];
    }

    const searchTerm = this.searchName.toLowerCase();
    const results = this.allObjects.filter((obj: CurrentObject) => {

      if (obj.name === "user") {
        return obj.data.username.toLowerCase().includes(searchTerm);

      }
      if (obj.name === "channel") {
        return (
          obj.data.title.toLowerCase().includes(searchTerm) ||
          obj.data.description.toLowerCase().includes(searchTerm)
        );
      }
      if (obj.name === "conversation") {
        return obj.data.messages.some((message: any) =>
          message.text.toLowerCase().includes(searchTerm)
        );
      }
      if (obj.name === "channel-chat") {
        return obj.data.messages.some((message: any) =>
          message.text.toLowerCase().includes(searchTerm)
        );
      }
      if (obj.name === "thread") {
        return obj.data.messages.some((message: any) =>
          message.text.toLowerCase().includes(searchTerm)
        );
      }
      return false;
    });
    return results;
  }

/**
 * Searches for users and channels based on the `newMsgSearchName` input.
 * Users are filtered using "@" and channels using "#".
 * If no special character is present, it filters by email.
 * 
 * The `filteredResults` array is updated based on the search term.
 */
  newMsgSearch() {
    if (this.newMsgSearchName.startsWith('@')) {
      const searchTerm = this.newMsgSearchName.slice(1).toLowerCase();
      this.filteredResults = this.firebaseService.allUsers.filter(user =>
        user.username.toLowerCase().includes(searchTerm)
      );
    } else if (this.newMsgSearchName.startsWith('#')) {
      const searchTerm = this.newMsgSearchName.slice(1).toLowerCase();
      this.filteredResults = this.firebaseService.allChannels.filter(channel =>
        channel.title.toLowerCase().includes(searchTerm)
      );
    } else if (this.newMsgSearchName) {
      this.filteredResults = this.firebaseService.allUsers.filter(user =>
        user.email.toLowerCase().includes(this.newMsgSearchName)
      );
    } else {
      this.filteredResults = [];
    }
  }


/**
 * Searches for users and channels when sending a message.
 * Users are filtered with "@" and channels with "#".
 * Updates the correct filteredResults array depending on the input type.
 * 
 * @param {string | undefined} input - Specifies the type of input (e.g., "thread", "channel").
 */
  searchSendMsg(input: string | undefined) {
    let userResults: User[] = [];
    let channelResults: Channel[] = [];
    let searchTerm = this.findRightInput(input)

    if (searchTerm.includes('@') || searchTerm.includes('#')) {
      if (searchTerm.includes('@')) {
        userResults = this.fillUserResults(searchTerm);
      }
      if (searchTerm.includes('#')) {
        channelResults = this.fillChannelResults(searchTerm);
      }
      this.fillResultsInRightArray(input, userResults, channelResults)

    } else {
      this.filteredResultsSendMsg = [];
      this.filteredResultsSendMsgThread = [];
    }
  }

/**
 * Finds the correct search term based on the input type.
 * 
 * @param {string | undefined} input - Specifies the input type ("thread", "channel", etc.).
 * @returns {string} - The processed search term.
 */
  findRightInput(input: string | undefined) {
    let searchTerm = '';
    if (input == 'thread') {
      searchTerm = this.searchNameSendMsgThread.toLowerCase();
    }
    if (input == 'channel' || input == 'chat' || input == 'newMsg') {
      searchTerm = this.searchNameSendMsg.toLowerCase();
    }
    return searchTerm
  }

  /**
 * Filters user results based on the search term after the "@" symbol.
 * 
 * @param {string} searchTerm - The search term containing "@".
 * @returns {User[]} - An array of filtered users.
 */
  fillUserResults(searchTerm: string) {
    let userResults: User[] = [];
    const userTerm = this.searchForAt(searchTerm);
    userResults = this.firebaseService.allUsers.filter(user =>
      user.username.toLowerCase().includes(userTerm)
    );
    return userResults
  }

  /**
 * Filters channel results based on the search term after the "#" symbol.
 * 
 * @param {string} searchTerm - The search term containing "#".
 * @returns {Channel[]} - An array of filtered channels.
 */
  fillChannelResults(searchTerm: string) {
    let channelResults: Channel[] = [];
    const channelTerm = this.searchForHashtag(searchTerm);
    channelResults = this.firebaseService.allChannels.filter(channel =>
      channel.title.toLowerCase().includes(channelTerm)
    );
    return channelResults
  }

/**
 * Extracts the search term after the last "@" symbol.
 * 
 * @param {string} searchTerm - The full search string.
 * @returns {string} - The extracted search term.
 */
  searchForAt(searchTerm: string) {
    const atIndex = searchTerm.lastIndexOf('@');
    return atIndex !== -1 ? searchTerm.substring(atIndex + 1) : '';
  }

  /**
 * Extracts the search term after the last "#" symbol.
 * 
 * @param {string} searchTerm - The full search string.
 * @returns {string} - The extracted search term.
 */
  searchForHashtag(searchTerm: string) {
    const hashtagIndex = searchTerm.lastIndexOf('#');
    return hashtagIndex !== -1 ? searchTerm.substring(hashtagIndex + 1) : '';
  }

  /**
 * Fills the correct result array with filtered user and channel results.
 * 
 * @param {string | undefined} input - Specifies the input type ("thread", "channel", etc.).
 * @param {User[]} userResults - Array of filtered users.
 * @param {Channel[]} channelResults - Array of filtered channels.
 */
  fillResultsInRightArray(input: string | undefined, userResults: User[], channelResults: Channel[]) {
    if (input == 'thread') {
      this.filteredResultsSendMsgThread = [...userResults, ...channelResults];
    }
    if (input == 'channel' || input == 'chat' || input == 'newMsg') {
      this.filteredResultsSendMsg = [...userResults, ...channelResults];
    }
  }

}
