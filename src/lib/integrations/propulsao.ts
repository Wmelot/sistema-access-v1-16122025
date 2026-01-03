
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const propulsaoConfig = {
    apiKey: "AIzaSyBsDsJ0K74jVzAo5z6O7HqdHTHshycwD-U",
    authDomain: "site-propulsao-allpe.firebaseapp.com",
    projectId: "site-propulsao-allpe",
    storageBucket: "site-propulsao-allpe.appspot.com",
    messagingSenderId: "409435515514",
    appId: "1:409435515514:web:ef1d0ee61e16f2582b69c3",
    measurementId: "G-0N4QSFLJ6B"
};

// Use a unique name to avoid conflicts with any other Firebase apps (if existing)
const APP_NAME = 'propulsaoApp';

export function getPropulsaoApp(): FirebaseApp {
    const apps = getApps();
    const existingApp = apps.find(app => app.name === APP_NAME);

    if (existingApp) {
        return existingApp;
    }

    return initializeApp(propulsaoConfig, APP_NAME);
}

export function getPropulsaoDb(): Firestore {
    const app = getPropulsaoApp();
    return getFirestore(app);
}

export function getPropulsaoAuth(): Auth {
    const app = getPropulsaoApp();
    return getAuth(app);
}
