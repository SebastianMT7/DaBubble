import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { ChannelService } from '../../services/channel.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../services/firebase.service';
import { MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-add-to-choosen-channel',
  standalone: true,
  imports: [MatDialogModule, FormsModule, CommonModule],
  templateUrl: './add-to-choosen-channel.component.html',
  styleUrl: './add-to-choosen-channel.component.scss',
})
export class AddToChoosenChannelComponent {
  channel: any;
  searchName: string = '';
  user: any = '';
  isInputEmpty = false;
  isHoveredClose = false;

  /**
   * Constructor for the component.
   * Subscribes to the current channel observable to get the latest channel data.
   *
   * @param {ChannelService} channelService - Service to handle channel-related operations.
   * @param {FirebaseService} firebaseService - Service to handle Firebase-related operations.
   */
  constructor(
    public dialogRef: MatDialogRef<AddToChoosenChannelComponent>,
    private channelService: ChannelService,
    public firebaseService: FirebaseService
  ) {
    this.channelService.currentChannel$.subscribe((channel) => {
      this.channel = channel;
    });
    this.firebaseService.selectedUsers = [];
  }

  /**
   * Filters the list of all users based on the entered search term.
   * Returns an empty array if the search term is less than one character long.
   *
   * @returns {Array<any>} Filtered list of users whose usernames match the search term and are not in the selected channel.
   */
  get filteredUsers() {
    if (this.searchName.length < 1) {
      return [];
    }

    return this.firebaseService.allUsers.filter(
      (user: any) =>
        user.username.toLowerCase().includes(this.searchName.toLowerCase()) &&
        !this.channel.users.includes(user?.uid)
    );
  }

  /**
   * Adds a user to the selected users list if they are not already added.
   * Clears the search term and updates the input state.
   *
   * @param {any} user - The user object to be added to the selected users list.
   */
  addUser(user: any) {
    if (
      !this.firebaseService.selectedUsers.some(
        (u: any) => u.username === user.username
      )
    ) {
      this.firebaseService.selectedUsers.push(user);
      this.emptyInput();
    }
    this.searchName = '';
    this.emptyInput();
  }

  /**
   * Removes a user from the selected users list.
   * Updates the input state after removal.
   *
   * @param {any} user - The user object to be removed from the selected users list.
   */
  removeUser(user: any) {
    this.firebaseService.selectedUsers =
      this.firebaseService.selectedUsers.filter(
        (u: any) => u.username !== user.username
      );
    this.emptyInput();
  }

  /**
   * Updates the `isInputEmpty` property based on whether the selected users list is empty.
   */
  emptyInput() {
    this.isInputEmpty = this.firebaseService.selectedUsers.length === 0;
  }

  /**
   * update the current channel in  firebase datastore
   */
  async addNewUserInChannel() {
    let allUser = this.getAllUserChannel();
    await this.channelService.updateUserList(this.channel.chaId, allUser);
    this.dialogRef.close();
  }

  /**
   * Combines the current users ids from channel and the newly selected users ids who should add to the channel in a array allUser.
   *
   * @returns {Array<string>} allUser
   */
  getAllUserChannel() {
    let currentUser = this.channel.users;
    let newUser = this.firebaseService.selectedUsers.map(
      (user: any) => user.uid
    );
    let allUser = currentUser.concat(newUser);
    return allUser;
  }

  closeAddToChannel(): void {
    this.dialogRef.close();
  }
}
