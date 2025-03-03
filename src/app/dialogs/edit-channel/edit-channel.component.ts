import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FirebaseService } from '../../services/firebase.service';
import { ChannelService } from '../../services/channel.service';
import { Channel } from '../../models/channel.model';
import { AuthService } from '../../services/auth.service';
import { doc, setDoc, Firestore, updateDoc, collection, onSnapshot, query } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { UserDataService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { ShowMemberInChannelComponent } from "../show-member-in-channel/show-member-in-channel.component";
import { BreakpointObserverService } from '../../services/breakpoint-observer.service';


@Component({
  selector: 'app-edit-channel',
  standalone: true,
  imports: [CommonModule, FormsModule, ShowMemberInChannelComponent],
  templateUrl: './edit-channel.component.html',
  styleUrl: './edit-channel.component.scss'
})
export class EditChannelComponent implements OnInit {
  channel: Channel | undefined;
  channels: any[] = []
  isHoveredClose = false;
  editName: boolean = false;
  editDesc: boolean = false;
  changeName: string = "Bearbeiten";
  changeDesc: string = "Bearbeiten";
  descInput: string = "";
  titleInput: string = "";
  channelId: string = "";
  currentUser: any;
  isEditing: boolean = false;
  allUserInThisChannel: any;
  existChannel = false;
  welcomeChannel: boolean = false;


  constructor(
    public dialogRef: MatDialogRef<EditChannelComponent>,
    public dialog: MatDialog,
    public channelService: ChannelService,
    private userService: UserDataService,
    private authService: AuthService,
    private firebaseService: FirebaseService,
    public breakpointObserver: BreakpointObserverService

  ) { }

  /**
 * Lifecycle hook called on component initialization.
 * Fetches the current user and subscribes to the current channel observable 
 * to load and initialize channel data.
 */
  ngOnInit(): void {
    this.currentUser = this.userService.getCurrentUser();
    this.channelService.currentChannel$.subscribe((channel) => {
      if (!this.isEditing && channel) {
        this.channel = channel;
        this.descInput = channel.description;
        this.titleInput = channel.title;
        this.channelId = channel.chaId;
        this.allUserInThisChannel = this.channel.users;
      }
    });
    this.welcomeChannel = this.channel?.title === "Welcome";
  }

  /**
   * Updates the current channel with the provided title and description.
   * Sets editing mode during the update process and handles errors if any occur.
   * 
   * @async
   */
  async updateChannel() {
    if (this.channel) {
      this.isEditing = true;
      try {
        await this.channelService.updateChannel(this.channel.chaId, this.titleInput, this.descInput);
        this.channel.title = this.titleInput;
        this.channel.description = this.descInput;
      } catch (error) {
      } finally {
        this.isEditing = false;
      }
    }
  }

  /**
   * Closes the Edit Channel dialog.
   */
  closeEditChannel(): void {
    this.dialogRef.close();
  }

  /**
   * Toggles the edit state for the channel name and updates the channel with the new name.
   */
  editChannelName() {
    this.changeName = this.editName ? 'Speichern' : 'Bearbeiten';
    this.updateChannel();
  }

  /**
   * Toggles the edit state for the channel description and updates the channel with the new description.
   */
  editChannelDesc() {
    this.changeDesc = this.editDesc ? 'Speichern' : 'Bearbeiten';
    this.updateChannel();
  }

  /**
   * Removes the current user from the channel, updates the channel's user list,
   * and reloads the page to reflect changes.
   * 
   * @async
   */
  async leaveChannel() {
    this.dialogRef.close();
    const removeUserId = this.currentUser.uid;
    const allUserWithoutLeavedUser = this.allUserInThisChannel.filter((allUser: any) => allUser !== removeUserId);
    await this.channelService.updateUserList(this.channelId, allUserWithoutLeavedUser);
    location.reload();
  }

  /**
 Checks if the entered channel name is valid and not already in use.
*
* The function trims the input title to remove leading and trailing whitespace. 
* It then checks if the title matches any existing channel title in the 
* `allChannels` array from the Firebase service.
*
 */
  checkChannelName() {
    let trimTitle = this.titleInput.trim();
    let checkName = this.firebaseService.allChannels.some(channel => channel.title === trimTitle)
    if ((!checkName && this.titleInput.length >= 1) || (this.channel?.title == this.titleInput)) {
      this.existChannel = false;
    }
    else {
      this.existChannel = true;
    }

  }
}