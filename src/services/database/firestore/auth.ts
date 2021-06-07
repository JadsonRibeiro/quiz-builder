import { firestore } from "firebase-admin";

import { firebaseServer } from "../../firebase/server";

class FirestoreAuth {
    private db: firestore.Firestore;

    constructor() {
        this.db = firebaseServer.firestore();
    }

    async getUser({ email, password }) {
        const snapshot = await this.db.collection('users')
            .where('email', '==', email)
            .where('password', '==', password)
            .get();

        if(snapshot.empty)
            return;

        const doc = snapshot.docs[0];

        return {
            userID: doc.id,
            ...doc.data()
        }
    }

    async createUser(user) {
        const doc = await this.db.collection('users').add(user);

        return doc.id;
    }
}

export default FirestoreAuth;