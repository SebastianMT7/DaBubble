import { ChangeDetectorRef, Component, inject, Input, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserDataService } from '../../../../services/user.service';
import { InterfaceService } from '../../../../services/interface.service';
import { Message, Reaction } from '../../../../models/message.model';
import { FirebaseService } from '../../../../services/firebase.service';
import { User } from '../../../../models/user.model';
import { AuthService } from '../../../../services/auth.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { EmojiComponent } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { ReactionService } from '../../../../services/reaction.service';
import { BreakpointObserverService } from '../../../../services/breakpoint-observer.service';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-single-message',
  standalone: true,
  imports: [CommonModule, PickerComponent, EmojiComponent, FormsModule],
  templateUrl: './single-message.component.html',
  styleUrl: './single-message.component.scss'
})
export class SingleMessageComponent {
  uiService = inject(InterfaceService);
  fiBaService = inject(FirebaseService);
  authService = inject(AuthService);
  reactService = inject(ReactionService);

  showReactionPopups: boolean = false;
  showEmojiPicker = false;
  showEditPopup = false;
  editMode = false;
  editText = '';
  loggedInUser: any;
  user: any;

  @Input() currentMessage: Message = new Message();
  @Input() message: Message = new Message();
  @Input() index: number = 0;
  @Input() isThread: boolean = false;
  @ViewChild('emojiPicker', { static: false }) emojiPicker!: ElementRef;
  @ViewChild('editPopup', { static: false }) editPopup!: ElementRef;


  constructor(
    private userDataService: UserDataService,
    public breakpointObserver: BreakpointObserverService,
    private cdr: ChangeDetectorRef,
  ) {
    this.userDataService.selectedUser.subscribe((user) => {
      this.user = user;
    });
  }

    /**
   * Displays the reaction popup when the mouse hovers over the element.
   */
    onMouseOver() {
      this.showReactionPopups = true;
    }
  
    /**
     * Hides the reaction popup when the mouse leaves the element.
     */
    onMouseLeave() {
      this.showReactionPopups = false;
    }
  
    /**
     * Initializes the component by setting the current message and logged-in user.
     */
    ngOnInit(): void {
      this.currentMessage = new Message(this.currentMessage);
      this.loggedInUser = this.authService.currentUserSig();
    }
  
    /**
     * Opens a thread and forces a change detection.
     */
    openThread() {
      this.uiService.openThread();
      this.cdr.detectChanges();
    }
  
    /**
     * Formats a timestamp into a German date string in the format "Weekday, Day. Month".
     * 
     * @param {number} timestamp - The timestamp to be formatted.
     * @returns {string} - The formatted date.
     */
    getFormattedDate(timestamp: number): string {
      const date = new Date(timestamp);
  
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      };
      return date.toLocaleDateString('de-DE', options);
    }
  
    /**
     * Formats a timestamp into a German time string in the format "HH:MM Uhr".
     * 
     * @param {number} timestamp - The timestamp to be formatted.
     * @returns {string} - The formatted time.
     */
    getFormattedTime(timestamp: number): string {
      const time = new Date(timestamp);
  
      return time.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
      }) + ' Uhr';
    }
  
    /**
     * Finds a user by their ID.
     * 
     * @param {unknown} Id - The user ID to search for.
     * @returns {User | null} - The found user or `null` if no user is found.
     */
    findUserWithId(Id: unknown) {
      for (let i = 0; i < this.fiBaService.allUsers.length; i++) {
        let user: User = this.fiBaService.allUsers[i];
  
        if (Id === user.uid) {
          return user;
        }
      }
      return null;
    }
  
    /**
     * Determines if a date divider should be shown.
     * 
     * @param {number} index - The index of the current message.
     * @returns {boolean} - `true` if a divider should be shown, otherwise `false`.
     */
    shouldShowDateDivider(index: number): boolean {
      if (index === 0) {
        this.uiService.previousMessage = this.currentMessage;
        return true;
      } else {
        const currentDate = this.getFormattedDate(this.currentMessage.timeStamp);
        const previousDate = this.getFormattedDate(this.uiService.previousMessage.timeStamp);
        this.uiService.previousMessage = this.currentMessage;
        return currentDate !== previousDate;
      }
    }
  
    /**
     * Toggles the emoji picker.
     */
    toggleEmojiPicker() {
      this.showEmojiPicker = !this.showEmojiPicker;
    }
  
    /**
     * Checks whether to display the reaction in singular or plural form.
     * 
     * @param {Reaction} reaction - The reaction being checked.
     * @returns {string} - The correct text for singular or plural.
     */
    checkPlural(reaction: Reaction) {
      const hasReacted = Object.keys(reaction.reactedUser).some(
        (username) => username === this.authService.currentUserSig()?.username
      );
      if (reaction.counter > 1) {
        return 'haben reagiert';
      } else {
        return hasReacted ? 'hast reagiert' : 'hat reagiert';
      }
    }
  
    /**
     * Handles emoji selection.
     * 
     * @param {any} event - The event containing the selected emoji.
     */
    manageEmoji(event: any) {
      const emoji = event.emoji;
      this.reactService.updateMessageWithReaction(emoji, this.currentMessage);
    }
  
    /**
     * Removes an emoji from the current message.
     */
    manageDeleteEmoji() {
      this.reactService.deleteEmoji(this.currentMessage);
    }
  
    /**
     * Enables the edit mode for a message.
     */
    async showEditArea() {
      this.editMode = true;
      this.editText = this.currentMessage.text;
      //this.editTextArea.nativeElement.focus();
    }
  
    /**
     * Cancels the edit mode.
     */
    cancelEditArea() {
      this.editText = '';
      this.editMode = false;
    }
  
    /**
     * Saves the edited message if the form is valid.
     * 
     * @param {NgForm} ngForm - The form containing the edited message.
     */
    async onSubmit(ngForm: NgForm) {
      if (ngForm.valid && ngForm.submitted) {
        await this.saveEditMessage();
        this.editText = '';
        this.editMode = false;
      }
    }
  
    /**
     * Saves the edited message to Firestore.
     */
    async saveEditMessage() {
      const msgId = this.currentMessage.msgId;
      this.currentMessage.text = this.editText;
      const ref = await this.reactService.searchMsgById(msgId);
      if (!ref) {
        return;
      }
  
      const convData = await this.reactService.getDataFromRef(ref);
      if (convData) {
        const message = this.reactService.findMessageData(convData, msgId);
        message.text = this.editText;
        const messages = convData['messages'];
        const dataRef = this.reactService.getDocRef(ref);
        this.reactService.updateMessageInFirestore(dataRef, messages);
      }
    }
  
    /**
     * Toggles the visibility of the edit popup for messages.
     */
    toggleEditPopup() {
      this.showEditPopup = !this.showEditPopup;
    }
  
    /**
     * Handles clicks outside specific elements in the document.
     * 
     * @param {Event} event - The click event triggered somewhere in the document.
     */
    @HostListener('document:click', ['$event'])
    handleOutsideClick(event: Event) {
      if (this.emojiPicker && !this.emojiPicker.nativeElement.contains(event.target)) {
        this.showEmojiPicker = false;
      }
      if (this.editPopup) {
        this.showEditPopup = false;
      }
    }
  
}