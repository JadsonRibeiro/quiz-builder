import { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import { getSession, useSession } from 'next-auth/client'
import { useRouter } from 'next/dist/client/router';
import Link from 'next/link';
import { RiDeleteBin6Fill, RiEdit2Line, RiArrowGoBackLine } from 'react-icons/ri'

import { Button } from '../../../../components/Button';
import { Input } from '../../../../components/Input';
import { PermissionDenied } from '../../../../components/PermissionDenied';
import { Checkbox } from '../../../../components/Checkbox';
import { Loading } from '../../../../components/Loading';

import { Question, Quiz } from '../../../../interfaces/entitiesInterfaces';
import api from '../../../../services/api';

import styles from '../../quiz.module.scss';
import { GetServerSideProps } from 'next';
import FirestoreQuiz from '../../../../services/database/firestore/quiz';

interface EditQuizProps {
    quiz: Quiz
}

export default function EditQuiz({ quiz }: EditQuizProps) {
    const [name, setName] = useState(quiz.name);
    const [category, setCategory] = useState(quiz.category);
    const [isPrivate, setIsPrivate] = useState(quiz.private);
    const [questions, setQuestions] = useState(quiz.questions);

    const [session, loading] = useSession();
    const router = useRouter();

    const { quizID } = router.query;

    async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if(!name || !category) {
            toast.error('Preencha todos campos');
            return;
        }

        try {
            await api.put(`/quiz/${quizID}`, {
                name,
                category,
                ownerEmail: quiz.ownerEmail,
                private: isPrivate
            });
            toast.success('Quiz editado com sucesso');
        } catch(e) {
            console.log('Erro na edição quiz', e);
            toast.error('Erro na edição quiz');
        }
    }

    async function handleRemoveQuestion(question: Question) {
        const res = confirm(`Tem certeza que deseja excluir a pergunta?`)
        
        if(!res) return;

        try {
            await api.delete(`/quiz/${quizID}/question/${question.id}`);

            setQuestions(oldQuestion => oldQuestion.filter(q => q.id !== question.id));

            toast.success('Pergunta excluída com sucesso!');
        } catch(e) {
            console.error('Erro ao excluir a pergunta', e);
            toast.error('Erro ao excluir a pergunta');
        }
    }

    if(loading) {
        return <Loading />
    }

    if(!session) {
        return <PermissionDenied />
    }

    return (
        <div className={styles.container}>
            <header>
                <h1>Editar quiz | {name} </h1>
                <Link href={`/minha-conta`}><a>
                    <span>Voltar <RiArrowGoBackLine /></span>
                </a></Link>
            </header>
            <form onSubmit={handleFormSubmit}>
                <div className="formControl">
                    <Input 
                        id="name"
                        label="Nome"
                        placeholder="Nome do quiz"
                        value={name}
                        onChange={event => setName(event.target.value)}
                    />
                </div>
                <div className="formControl">
                    <Input 
                        id="category"
                        label="Categoria"
                        placeholder="Filmes, futebol, história..."
                        value={category}
                        onChange={event => setCategory(event.target.value)}
                    />
                </div>
                <div>
                    <Checkbox 
                        id="private"
                        label="Privado"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                    />
                </div>
                <div className={styles.submitButton}>
                    <Button>Atualizar</Button>
                </div> 
            </form>

            <div className={styles.questionsList}>
                <h2>Perguntas</h2>
                {questions?.length && questions.map(question => (
                    <div key={question.id} className={styles.questionItem}>
                        <Link href={`/minha-conta/editar-quiz/${quiz.quizID}/${question.id}`}><a><RiEdit2Line /></a></Link>
                        <RiDeleteBin6Fill onClick={() => handleRemoveQuestion(question)} />
                        <span>{question.question}</span>
                    </div>
                ))}
            </div>

            <div className={styles.submitButton}>
                <Link href={`/minha-conta/criar-quiz/${quizID}/`}><a>
                    <Button>Adicionar pergunta</Button>
                </a></Link>
            </div> 
        </div>
    )
}

export const getServerSideProps: GetServerSideProps = async ({ req, params }) => {
    const session = await getSession({req});
    const { quizID } = params;

    if(!session) {
        return { redirect: { destination: '/404', permanent: false }
        }
    }

    const firestoreQuiz = new FirestoreQuiz();
    const quiz = await firestoreQuiz.get(String(quizID));

    return {
        props: {
            quiz
        }
    }
}
