import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/client';
import Link from 'next/link';
import { ChangeEvent, FormEvent, useState } from 'react';
import { RiArrowGoBackLine } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { Button } from '../../../../components/Button';
import { Input } from '../../../../components/Input';

import { Question, Quiz } from '../../../../interfaces/entitiesInterfaces';
import api from '../../../../services/api';

import FirestoreQuiz from '../../../../services/database/firestore/quiz';

import styles from '../../question.module.scss';

interface AddQuestionProps {
    quiz: Quiz
}

export default function AddQuestion({ quiz }: AddQuestionProps) {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [wrongOptions, setWrongOptions] = useState({});
    const [reference, setReference] = useState('')

    function handleWrongeOptionChange(value: string, index: number) {
        console.log(index);
        const options = {...wrongOptions};
        options[index] = value;
        setWrongOptions(options);
    }

    async function handleFormSubit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if(!question || !answer) {
            toast.error('Preencha todos os campos');
            return;
        }

        const options = [{
            id: 'opt1',
            value: answer
        }];

        for (const key in wrongOptions) {
            if(wrongOptions[key] === '') {
                toast.error('Preencha todas opções de respostas erradas');
                return;
            }

            options.push({ id: `opt${key}`, value: wrongOptions[key] });
        }

        const questionData: Question = {
            question,
            answer: 'opt1',
            options,
            type: "simpleQuestion",
            reference
        }

        const questionID = await api.post(`/quiz/${quiz.quizID}/question`, questionData);
        console.log('Question', questionID);

        toast.success('Questão adicionada com sucesso!');

        setQuestion('');
        setAnswer('');
        setWrongOptions({});
        setReference('');
    }

    return (
        <div className={styles.container}>
            <header>
                <h1>Adicionar questão | Quiz <strong>{quiz.name}</strong></h1>
                <Link href={`/minha-conta/editar-quiz/${quiz.quizID}`}><a>
                    <span>Voltar <RiArrowGoBackLine /></span>
                </a></Link>
            </header>
            <form onSubmit={handleFormSubit}>
                <div>
                    <Input 
                        id="question"
                        label="Pergunta"
                        value={question}
                        onChange={event => setQuestion(event.target.value)}
                    />
                </div>
                <fieldset>
                    <legend>Respostas</legend>
                    <div>
                        <Input 
                            id="answer"
                            label="Correta"
                            value={answer}
                            onChange={event => setAnswer(event.target.value)}
                        />
                    </div>
                    <div>
                        <Input 
                            id="fake-answer1"
                            label="Errada #1"
                            value={wrongOptions[2] || ''}
                            onChange={(e) => handleWrongeOptionChange(e.target.value, 2)}
                        />
                    </div>
                    <div>
                        <Input 
                            id="fake-answer2"
                            label="Errada #2"
                            value={wrongOptions[3] || ''}
                            onChange={(e) => handleWrongeOptionChange(e.target.value, 3)}
                        />
                    </div>
                    <div>
                        <Input 
                            id="fake-answer3"
                            label="Errada #3"
                            value={wrongOptions[4] || ''}
                            onChange={(e) => handleWrongeOptionChange(e.target.value, 4)}
                        />
                    </div>
                </fieldset>
                <div>
                    <Input 
                        id="reference"
                        label="Referência"
                        placeholder="Link de alguma página com a prova da resposta"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                    />
                </div>
                <div className={styles.submitButton}>
                    <Button type="submit">
                        Adicionar
                    </Button>
                </div>
            </form>
        </div>
    )
}

export const getServerSideProps: GetServerSideProps = async ({ req, params }) => {
    const session = getSession({ req });
    const { quizID } = params;

    if(!session)
        return { redirect: { destination: '/404', permanent: false } }
    
    const quizDatabase = new FirestoreQuiz();

    const quiz = await quizDatabase.get(String(quizID));

    return {
        props: {
            quiz
        }
    }
}
