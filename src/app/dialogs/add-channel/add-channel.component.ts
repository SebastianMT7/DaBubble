import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { AddPeopleComponent } from '../add-people/add-people.component';
import { FormsModule } from '@angular/forms';
import { ChannelService } from '../../services/channel.service';
import { ConversationService } from '../../services/conversation.service';

@Component({
  selector: 'app-add-channel',
  standalone: true,
  imports: [CommonModule, MatDialogModule, FormsModule],
  templateUrl: './add-channel.component.html',
  styleUrl: './add-channel.component.scss',
})
export class AddChannelComponent {
  isHoveredClose = false;
  channelName = '';
  checkChannel = true;
  checkName: boolean = false
  inputTitle: string = '';
  inputDesc: string = '';
  isInputEmpty: boolean = false;

  constructor(
    public firebaseService: FirebaseService,
    public dialogRef: MatDialogRef<AddChannelComponent>,
    public dialog: MatDialog,
    public channelService: ChannelService
  ) {
    this.firebaseService.selectedUsers = [];

  }

  closeDialogChannel(): void {
    this.dialogRef.close();
  }



  /**
  * open dialog for add a new channel
  */
  openDialogAddPeople(): void {
    this.checkChannelName();
    this.channelService.currentChannel.title = this.inputTitle;
    this.channelService.currentChannel.description = this.inputDesc;
    const dialogRef = this.dialog.open(AddPeopleComponent, {
      width: '100%',
      maxWidth: '720px',
    });
    this.closeDialogChannel();
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
    let trimTitle = this.inputTitle.trim();
    this.checkName = this.firebaseService.allChannels.some(channel => channel.title === trimTitle)
    if (!this.checkName && this.inputTitle.length >= 1) {
      this.checkChannel = false
    }
    else {
      this.checkChannel = true;
    }
  }

}
