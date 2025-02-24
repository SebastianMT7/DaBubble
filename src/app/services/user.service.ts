import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.model';
import { arrayUnion, doc, DocumentData, Firestore, updateDoc, writeBatch } from '@angular/fire/firestore';
import { FirebaseService } from './firebase.service';
import { Channel } from '../models/channel.model';
import { AuthService } from './auth.service';
import { UserInterface } from '../interfaces/user';
import { UserCredential } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  currentUserSig = signal<UserInterface | null | undefined>(undefined);
  currentCredentials: UserCredential;

  constructor(private authService: AuthService, private firebaseService: FirebaseService) {
    this.currentUserSig = this.authService.currentUserSig;
    this.currentCredentials = this.authService.currentCredentials;
  }

  /**
   * Sets the current user in the BehaviorSubject.
   * @param {UserInterface | null | undefined} user - The user object to be set.
   */
  setCurrentUser(user: UserInterface | null | undefined) {
    this.currentUserSig.set(user);
  }

  /**
   * Returns the current user.
   * @returns {UserInterface | null | undefined} - The current user object or `undefined` if no user is set.
   */
  getCurrentUser() {
    return this.currentUserSig();
  }

  private userSource = new BehaviorSubject<User>(new User());
  selectedUser = this.userSource.asObservable();

  /**
   * Sets a new user in the BehaviorSubject.
   * @param {any} user - The user object to be set.
   */
  setUser(user: any) {
    this.userSource.next(user);
  }

}