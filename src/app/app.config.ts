import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment.development';

import { routes } from './app.routes';

//IMPORTS FIREBASE
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

// IMPORT NGX-SPINNER
import { NgxSpinnerService } from 'ngx-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)), 
    provideAuth(() => getAuth()), 
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase()),
    provideHttpClient(),
    //provideHttpClient(withInterceptors([loadingInterceptor])),    
    importProvidersFrom([BrowserAnimationsModule]),
    NgxSpinnerService
  ]
 

};