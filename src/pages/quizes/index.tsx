import { GetStaticProps } from 'next';
import Link from 'next/link';
import { SiGoogleclassroom } from 'react-icons/si'

import { Quiz } from '../../interfaces/entitiesInterfaces';

import FirestoreQuiz from '../../services/database/firestore/quiz';
import styles from './styles.module.scss';

interface QuizPageProps {
    quizes: Quiz[]
}

const QuizesPage = ({ quizes }: QuizPageProps) => {
    console.log('Quizes', quizes)
    return (
        <div className={styles.container}>
            <h1>Quizes Públicos</h1>
            <div className={styles.quizList}>
                {quizes.map(quiz => (
                    <div key={quiz.quizID} className={styles.quizItem}>
                        <strong>{quiz.name}</strong>
                        <span>Categoria: {quiz.category}</span>
                        <Link href={`/criar-sala?quizID=${quiz.quizID}`}><a>
                            <SiGoogleclassroom 
                                title="Criar sala"
                                size={23}
                            />
                        </a></Link>
                    </div>
                ))}
            </div>
        </div>
    );
}

export const getStaticProps: GetStaticProps = async () => {
    const firestoreQuiz = new FirestoreQuiz();

    const quizes = await firestoreQuiz.search([
        { field: 'private', operator: '==', value: false }
    ]);

    return {
        props: {
            quizes
        },
        revalidate: 60 * 60
    }
}

export default QuizesPage;
