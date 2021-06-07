import { firestore } from 'firebase-admin'

import { Question } from '../../../interfaces/entitiesInterfaces';
import { QuestionServiceInterface } from "../../../interfaces/servicesInterfaces";
import { firebaseServer } from "../../firebase/server";

class FirestoreQuestion implements QuestionServiceInterface {
    private db: firestore.Firestore;

    constructor() {
        this.db = firebaseServer.firestore();
    }
    async get(quizID: string, questionID: string): Promise<Question | null> {
        const snapshot = await this.db.collection('quizes').doc(quizID).collection('questions').doc(questionID).get();

        if(!snapshot.exists) return;

        const data = snapshot.data() as Question;

        return {
            id: snapshot.id,
            ...data
        }; 
    }

    async create(quizID: string, question: Question) {
        const res = await this.db.collection('quizes').doc(quizID).collection('questions').add(question);
        return res.id;
    }

    async delete(quizID: string, questionID: string) {
        await this.db.collection('quizes').doc(quizID).collection('questions').doc(questionID).delete();
    }

    async update(quizID: string, questionID: string, question: Question) {
        await this.db.collection('quizes').doc(quizID).collection('questions').doc(questionID).set(question, {merge: true});
    }
}

export default FirestoreQuestion;