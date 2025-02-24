import { Injectable, inject } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { Message, Reaction } from '../models/message.model';
import { AuthService } from './auth.service';
import { doc, getDoc, Firestore, updateDoc } from '@angular/fire/firestore';
import { ChannelService } from './channel.service';
import { InterfaceService } from './interface.service';
import { DocumentData } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class ReactionService {
  firestore = inject(Firestore);
  fiBaService = inject(FirebaseService);
  authService = inject(AuthService);
  channelService = inject(ChannelService);
  interfaceService = inject(InterfaceService);

  constructor() { }

  /**
 * Updates a message with an emoji reaction object.
 * 
 * @param {any} emoji - The emoji to be added as a reaction.
 * @param {Message} currentMessage - The message to be updated.
 * 
 * This method creates a new reaction based on the provided emoji and searches for the 
 * message in various sources (conversations, channels, threads). Once the message is found, 
 * the reaction is applied to the message, and the updated message is saved in Firestore.
 */
  async updateMessageWithReaction(emoji: any, currentMessage: Message) {
    let newReaction = this.createNewReaction(emoji)
    const username = this.authService.currentUserSig()?.username as string;
    const msgId = currentMessage.msgId;
    const ref = await this.searchMsgById(msgId);
    if (!ref) {
      console.error('Reference path not found for the given message.');
      return;
    }
    const conversationData = await this.getDataFromRef(ref)
    if (conversationData) {
      const message = this.findMessageData(conversationData, msgId);
      const messages = conversationData['messages'];
      this.handleReaction(message, newReaction, username);

      const dataRef = doc(this.firestore, ref)
      this.updateMessageInFirestore(dataRef, messages);
    } else {
      console.error("conversationData not found");
    }
  }

  /**
   * Returns the document reference path based on the given `ref`.
   * 
   * @param {string} ref - The Firestore document reference path.
   * 
   * @returns {DocumentReference} - The Firestore document reference.
   */
  getDocRef(ref: string) {
    const dataRef = doc(this.firestore, ref)
    return dataRef
  }

  /**
   * Searches for a message based on its ID in various sources (conversations, channels, threads).
   * 
   * @param {string} msgId - The ID of the message to search for.
   * 
   * @returns {Promise<string | null>} - The document path if found, otherwise `null`.
   */
  async searchMsgById(msgId: string) {
    const allSources = [
      { data: this.fiBaService.allConversations, key: 'conId', basePath: 'conversations' },
      { data: this.fiBaService.allChannels, key: 'chaId', basePath: 'channels' },
      { data: this.fiBaService.allThreads, key: 'id', basePath: 'threads' },
    ];

    for (const source of allSources) {
      const message = source.data
        .flatMap((conv) => conv.messages)
        .find((message) => message.msgId === msgId);

      if (message) {
        const refId = (source.data.find((conv) =>
          conv.messages.some((msg) => msg.msgId === msgId)
        ) as any)?.[source.key];

        if (refId) {
          const refPath = `${source.basePath}/${refId}`;
          if (refPath) {
            return refPath;
          }
        }
      }
    } return null;
  }

  /**
   * Searches for a message within the provided data.
   * 
   * @param {DocumentData} conversationData - The conversation data containing messages.
   * @param {string} msgId - The ID of the message.
   * 
   * @returns {any} - The found message or `undefined` if not found.
   */
  findMessageData(conversationData: DocumentData, msgId: string) {
    const messages = conversationData['messages'];
    const messageIndex = this.findMessageIndex(messages, msgId);
    if (messageIndex === -1) {
      console.error("Message not found");
      return;
    }
    const message = messages[messageIndex];
    if (message) {
      return message
    }
  }

  /**
   * Processes the reaction to a message.
   * 
   * @param {any} message - The message receiving the reaction.
   * @param {Reaction} newReaction - The new emoji reaction object.
   * @param {string} username - The username of the current user adding the reaction.
   */
  handleReaction(message: any, newReaction: Reaction, username: string) {
    this.removeReactionAndUserFromMessage(message, username);
    const newReactionIndex = this.findReactionIndex(message.reactions, newReaction.id);
    if (newReactionIndex !== -1) {
      this.addUserToReaction(message.reactions[newReactionIndex], username);
    } else {
      this.addNewReactionToMessage(message, newReaction, username);
    }
  }

  /**
   * Removes a reaction and the user from a message.
   * 
   * @param {any} message - The message from which the reaction should be removed.
   * @param {string} username - The username of the current user whose reaction should be removed.
   */
  removeReactionAndUserFromMessage(message: any, username: string) {
    const oldReactionIndex = this.findUserReactionIndex(message.reactions, username);
    if (oldReactionIndex !== -1) {
      this.removeUserFromReaction(message.reactions[oldReactionIndex], username);
      if (message.reactions[oldReactionIndex].counter === 0) {
        this.removeReactionFromMessage(message, oldReactionIndex);
      }
    }
  }

  /**
   * Deletes an emoji reaction object from a message.
   * 
   * @param {Message} currentMessage - The message from which the emoji should be deleted.
   */
  async deleteEmoji(currentMessage: Message) {
    const username = this.authService.currentUserSig()?.username as string;
    const msgId = currentMessage.msgId
    const ref = await this.searchMsgById(msgId);

    if (!ref) {
      console.error('Reference path not found for the given message.');
      return;
    }
    const conversationData = await this.getDataFromRef(ref)
    if (conversationData) {
      const message = this.findMessageData(conversationData, msgId);
      const messages = conversationData['messages'];
      this.removeReactionAndUserFromMessage(message, username);
      const dataRef = doc(this.firestore, ref)
      this.updateMessageInFirestore(dataRef, messages);
    }
  }

  /**
   * Retrieves the data from the Firestore document reference.
   * 
   * @param {string} ref - The Firestore document path.
   * 
   * @returns {Promise<DocumentData | undefined>} - The document data, or `undefined` if the document is not found.
   */
  async getDataFromRef(ref: string) {
    const dataRef = doc(this.firestore, ref);
    const dataSnapshot = await getDoc(dataRef)
    const data = dataSnapshot.data();
    return data
  }

/**
   * Updates a message in Firestore.
   * 
   * @param {any} ref - The Firestore document reference.
   * @param {any[]} messages - The updated messages.
   */
  async updateMessageInFirestore(ref: any, messages: any[]) {
    try {
      await updateDoc(ref, { messages });
    } catch (error) {
      console.error('Fehler beim aktualisieren der Nachricht:', error);
    }
  }

  /**
   * Creates a new emoji reaction object.
   * 
   * @param {any} emoji - The emoji for the reaction.
   * 
   * @returns {Reaction} - The created emoji reaction object.
   */
  createNewReaction(emoji: any) {
    const username = this.authService.currentUserSig()?.username as string;
    return new Reaction({
      counter: 1,
      id: emoji.id,
      reactedUser: {
        [`${username}`]: true
      },
    });
  }

  /**
   * Adds a new reaction to a message.
   * 
   * @param {Message} message - The message to which the reaction should be added.
   * @param {Reaction} newReaction - The new emoji reaction object.
   * @param {string} username - The username of the current user.
   */
  addNewReactionToMessage(message: Message, newReaction: Reaction, username: string) {
    const reactionToAdd = {
      id: newReaction.id,
      reactedUser: { [username]: true },
      counter: 1
    };
    message.reactions.push(reactionToAdd);
  }

  /**
   * Searches for the index position of a message in an array of messages.
   * 
   * @param {any[]} messages - The array of messages.
   * @param {string} msgId - The ID of the message.
   * 
   * @returns {number} - The index position of the message, or `-1` if not found.
   */
  findMessageIndex(messages: any[], msgId: string): number {
    return messages.findIndex((msg: any) => msg.msgId === msgId);
  }

  /**
   * Searches for the index position of a user's reaction in an array of reactions.
   * 
   * @param {Reaction[]} reactions - The array of reactions.
   * @param {string} username - The username of the current user.
   * 
   * @returns {number} - The index position of the reaction, or `-1` if not found.
   */
  findUserReactionIndex(reactions: Reaction[], username: string): number {
    return reactions.findIndex((reaction: Reaction) => reaction.reactedUser[username]);
  }

 /**
   * Searches for the index position of a specific reaction in the array of reactions of a message.
   * 
   * @param {Reaction[]} reactions - The array of reactions.
   * @param {string} reactionId - The ID of the reaction.
   * 
   * @returns {number} - The index position of the reaction, or `-1` if not found.
   */
  findReactionIndex(reactions: Reaction[], reactionId: string): number {
    return reactions.findIndex((reaction: Reaction) => reaction.id === reactionId);
  }

  /**
   * Removes a user from a reaction.
   * 
   * @param {Reaction} reaction - The reaction from which the user should be removed.
   * @param {string} username - The username of the current user.
   */
  removeUserFromReaction(reaction: Reaction, username: string) {
    delete reaction.reactedUser[username];
    reaction.counter = Object.keys(reaction.reactedUser).length;
  }

  /**
   * Removes a reaction from a message.
   * 
   * @param {any} message - The message from which the reaction should be removed.
   * @param {number} reactionIndex - The index of the reaction to be removed.
   */
  removeReactionFromMessage(message: any, reactionIndex: number) {
    message.reactions.splice(reactionIndex, 1);
  }

  /**
   * Adds a user to a reaction.
   * 
   * @param {Reaction} reaction - The reaction to which the user should be added.
   * @param {string} username - The username of the current user.
   */
  addUserToReaction(reaction: Reaction, username: string) {
    reaction.reactedUser[username] = true;
    reaction.counter = Object.keys(reaction.reactedUser).length;
  }


}
