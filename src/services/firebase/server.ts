import * as firebaseServer from 'firebase-admin';

if(process.env.FIREBASE_CLIENT_EMAIL) {
    const app = firebaseServer.apps.length
        ? firebaseServer.app()
        : firebaseServer.initializeApp({
            credential: firebaseServer.credential.cert({
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
                projectId: process.env.FIREBASE_PROJECT_ID,
            })
        });
}

export { firebaseServer };