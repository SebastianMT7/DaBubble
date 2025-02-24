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
   * Lädt eine Datei auf Firebase Storage hoch und gibt die Download-URL zurück.
   * 
   * @param {string} filePath - Der Speicherort der Datei im Firebase Storage.
   * @param {File} file - Die Datei, die hochgeladen werden soll.
   * @returns {Observable<string>} - Eine Observable, die die Download-URL der hochgeladenen Datei liefert, oder einen Fehler, wenn der Upload fehl schlägt.
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
