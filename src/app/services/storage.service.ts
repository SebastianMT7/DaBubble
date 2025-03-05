import { inject, Injectable } from '@angular/core';
import { initializeApp } from '@angular/fire/app';
import { Firestore } from '@angular/fire/firestore';
import { getDownloadURL, ref, Storage, uploadBytesResumable } from '@angular/fire/storage';
import { finalize, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private storage = inject(Storage);

  /**
   * Uploads a file to Firebase Storage and returns the download URL.
   * 
   * @param {string} filePath - The location of the file in Firebase Storage.
   * @param {File} file - The file to be uploaded.
   * @returns {Observable<string>} - An Observable that returns the download URL of the uploaded file, or an error if the upload fails.
   */
  uploadFile(filePath: string, file: File): Observable<string> {
    const storageRef = ref(this.storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Observable(observer => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        },
        (error) => observer.error(error),
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(downloadURL => {
            observer.next(downloadURL);
            observer.complete();
          }).catch(error => observer.error(error));
        }
      );
    });
  }


}
