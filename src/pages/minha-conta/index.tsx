import { GetServerSideProps } from 'next';
import { getSession, useSession } from 'next-auth/client'
import Link from 'next/link';
import { useState } from 'react';
import { RiDeleteBin6Fill, RiEdit2Line, } from 'react-icons/ri'
import { SiGoogleclassroom } from 'react-icons/si';
import { toast } from 'react-toastify';

import api from '../../services/api';

import FirestoreQuiz from '../../services/database/firestore/quiz';

import styles from './styles.module.scss'

interface Quiz {
    quizID: string;
    name: string;
    questionsQuantity: number;
}

interface MyAccountProps {
    quizList: Quiz[]
}

export default function MyAccount({ quizList }: MyAccountProps) {
    const [quizes, setQuizes] = useState(quizList);

    const [session] = useSession();

    async function handleDeleteQuiz(quiz: Quiz) {
        const res = confirm(`Tem certeza que deseja excluir o quiz ${quiz.name}?`)
        
        if(!res) return;

        try {
            // TODO: delete all questions too
            await api.delete(`/quiz/${quiz.quizID}`);

            setQuizes(oldQuizes => oldQuizes.filter(q => q.quizID !== quiz.quizID));

            toast.success('Quiz excluído com sucesso!');
        } catch(e) {
            console.error('Erro ao excluir o quiz', e);
            toast.error('Erro ao excluir o quiz');
        }
    }

    return (
        <div className={styles.container}>
            <header>
                <h1>Minha Conta | {session?.user.name}</h1>
                <Link href="/minha-conta/criar-quiz">
                    <a>
                        <button className={styles.createNewQuiz}>
                            Criar novo quiz
                        </button>
                    </a>
                </Link>
            </header>
            <div className={styles.quizList}>
                <h2>Seus quizes</h2>
                {quizes.map((quiz: Quiz) => (
                    <div key={quiz.quizID} className={styles.quizItem}>
                        <strong>{quiz.name}</strong>
                        <span>{quiz.questionsQuantity} perguntas</span>
                        <Link href={`/criar-sala?quizID=${quiz.quizID}`}><a>
                            <SiGoogleclassroom 
                                title="Criar sala"
                                size={23}
                            />
                        </a></Link>
                        <RiDeleteBin6Fill
                            title="Excluir quiz"
                            size={23} 
                            onClick={() => handleDeleteQuiz(quiz)}
                        />
                        <Link href={`/minha-conta/editar-quiz/${quiz.quizID}`}>
                            <a><RiEdit2Line size={23} title="Editar quiz" /></a>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
    const session = await getSession({req});

    if(!session) {
        return {
            redirect: {
                destination: '/',
                permanent: false
            }
        }
    }

    const firestoreQuiz = new FirestoreQuiz();

    const quizes = await firestoreQuiz.search([
        { field: 'ownerEmail', operator: '==', value: session.user.email }
    ], true);

    console.log('Quizes', quizes)

    const quizList = quizes.map(quiz => ({
        quizID: quiz.quizID,
        name: quiz.name,
        questionsQuantity: quiz.questions?.length ?? 0
    }));

    return {
        props: {
            quizList
        }
    }
}
