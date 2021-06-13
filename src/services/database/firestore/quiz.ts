import { firestore } from 'firebase-admin'

import { Quiz } from '../../../interfaces/entitiesInterfaces';
import { QuizServiceInterface } from "../../../interfaces/servicesInterfaces";
import { firebaseServer } from "../../firebase/server";

interface SearchParam {
    field: string;
    operator: FirebaseFirestore.WhereFilterOp;
    value: any
}

class FirestoreQuiz implements QuizServiceInterface {
    private db: firestore.Firestore;

    constructor() {
        this.db = firebaseServer.firestore();
    }

    async get(quizID: string): Promise<Quiz | null> {
        const doc = this.db.collection('quizes').doc(quizID);
        const snapshot = await doc.get();

        if(!snapshot.exists) return;

        const data = snapshot.data() as Quiz;
        
        const subCollections = await doc.listCollections();

        const subCollectionsData = await this.getSubCollections(subCollections);

        return {
            quizID: snapshot.id,
            ...data,
            ...subCollectionsData
        }; 
    }

    async create(quiz: Quiz) {
        const res = await this.db.collection('quizes').add(quiz);
        return res.id;
    }

    async delete(quizID: string) {
        // Delete questions too
        const quiz = await this.get(quizID);
        if(quiz.questions) {
            for (const question of quiz.questions) {
                await this.db.collection('quizes').doc(quizID).collection('questions').doc(question.id).delete();
            }
        }

        await this.db.collection('quizes').doc(quizID).delete();
    }

    async update(quizID: string, quiz: Quiz) {
        await this.db.collection('quizes').doc(quizID).set(quiz, {merge: true});
    
    }

    async search(searchData: Array<SearchParam>, getSubCollections = false): Promise<Quiz[]> {
        let collectionRef = this.db.collection('quizes') as firestore.Query<firestore.DocumentData>;

        for (const { field, operator, value } of searchData) {
            collectionRef = collectionRef.where(field, operator, value);
        }

        const querySnapshot = await collectionRef.get();

        let quizData = [];

        for (const doc of querySnapshot.docs) {
            let quiz = {
                quizID: doc.id,
                ...doc.data()
            };

            if(getSubCollections) {
                const subCollections = await doc.ref.listCollections();
                const subCollectionsData = await this.getSubCollections(subCollections);

                console.log('Subcollection', subCollectionsData);

                quiz = {
                    ...quiz,
                    ...subCollectionsData
                }
            }

            quizData.push(quiz);
        }

        return quizData;
    }

    private async getSubCollections(subCollections: firestore.CollectionReference<firestore.DocumentData>[]) {
        return subCollections.reduce(async (result, collection) => ({
            ...result,
            [collection.id]: (await collection.get()).docs.reduce((acc, doc) => ([...acc, ...[{id: doc.id, ...doc.data()}]]), [])
        }), {})
    }
}

export default FirestoreQuiz;