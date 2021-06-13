"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("../../firebase/server");
class FirestoreQuiz {
    constructor() {
        this.db = server_1.firebaseServer.firestore();
    }
    async get(quizID) {
        const doc = this.db.collection('quizes').doc(quizID);
        const snapshot = await doc.get();
        if (!snapshot.exists)
            return;
        const data = snapshot.data();
        const subCollections = await doc.listCollections();
        const subCollectionsData = await this.getSubCollections(subCollections);
        return Object.assign(Object.assign({ quizID: snapshot.id }, data), subCollectionsData);
    }
    async create(quiz) {
        const res = await this.db.collection('quizes').add(quiz);
        return res.id;
    }
    async delete(quizID) {
        await this.db.collection('quizes').doc(quizID).delete();
    }
    async update(quizID, quiz) {
        await this.db.collection('quizes').doc(quizID).set(quiz, { merge: true });
    }
    async search(searchData, getSubCollections = false) {
        let collectionRef = this.db.collection('quizes');
        for (const { field, operator, value } of searchData) {
            collectionRef = collectionRef.where(field, operator, value);
        }
        const querySnapshot = await collectionRef.get();
        let quizData = [];
        for (const doc of querySnapshot.docs) {
            let quiz = Object.assign({ quizID: doc.id }, doc.data());
            if (getSubCollections) {
                const subCollections = await doc.ref.listCollections();
                const subCollectionsData = await this.getSubCollections(subCollections);
                console.log('Subcollection', subCollectionsData);
                quiz = Object.assign(Object.assign({}, quiz), subCollectionsData);
            }
            quizData.push(quiz);
        }
        return quizData;
    }
    async getSubCollections(subCollections) {
        return subCollections.reduce(async (result, collection) => (Object.assign(Object.assign({}, result), { [collection.id]: (await collection.get()).docs.reduce((acc, doc) => ([...acc, ...[Object.assign({ id: doc.id }, doc.data())]]), []) })), {});
    }
}
exports.default = FirestoreQuiz;
