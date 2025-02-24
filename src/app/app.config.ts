import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
     provideRouter(routes),
     provideHttpClient(),
      provideFirebaseApp(() =>
         initializeApp({
          "projectId":"dabubble-bf3a5",
          "appId":"1:996651423166:web:93df4d92850ab6a8cfd5ef",
          "storageBucket":"dabubble-bf3a5.firebasestorage.app",
          "apiKey":"AIzaSyAYIsQ-18r31PlMXih4iF29wqG0Awu7QEs",
          "authDomain":"dabubble-bf3a5.firebaseapp.com","messagingSenderId":"996651423166"})),
           provideAuth(() => getAuth()), provideFirestore(() => getFirestore()), provideStorage(() => getStorage()), provideAnimationsAsync()]
};
