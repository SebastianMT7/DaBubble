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
          "projectId":"dabubble379",
          "appId":"1:778800442422:web:27e44ae4114f9279b9bc97",
          "storageBucket":"dabubble379.appspot.com",
          "apiKey":"AIzaSyCj1Qw3pyvijElMIDYirvzorPvO_fm3Tos",
          "authDomain":"dabubble379.firebaseapp.com","messagingSenderId":"778800442422"})),
           provideAuth(() => getAuth()), provideFirestore(() => getFirestore()), provideStorage(() => getStorage()), provideAnimationsAsync()]
};
