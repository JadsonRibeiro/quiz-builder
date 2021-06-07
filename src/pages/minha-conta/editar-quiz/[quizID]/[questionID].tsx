import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/client';
import { useRouter } from 'next/dist/client/router';
import Link from 'next/link';
import { ChangeEvent, FormEvent, useState } from 'react';
import { RiArrowGoBackLine } from 'react-icons/ri';
import { toast } from 'react-toastify';

import { Button } from '../../../../components/Button';
import { Input } from '../../../../components/Input';

import { Question } from '../../../../interfaces/entitiesInterfaces';
import api from '../../../../services/api';
import FirestoreQuestion from '../../../../services/database/firestore/question';

import styles from '../../question.module.scss';

interface AddQuestionProps {
    question: Question
}

export default function EditQuestion({ question }: AddQuestionProps) {
    const [ansking, setAnsking] = useState(question.question);
    const [answer, setAnswer] = useState(question.options.find(option => option.id === question.answer).value);
    const [wrongOptions, setWrongOptions] = useState(() => 
        question.options
            .filter(option => option.id !== question.answer)
            .reduce((res, option) => {
                res[option.id] = option.value
                return res;
            }, {})
    );
    const [reference, setReference] = useState(question.reference);

    const router = useRouter();
    const { quizID } = router.query;

    function handleWrongeOptionChange(value: string, key: string) {
        const options = {...wrongOptions};
        options[key] = value;
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

            options.push({
                id: key,
                value: wrongOptions[key]
            })
        }

        const questionData: Question = {
            question: ansking,
            answer: 'opt1',
            options,
            type: "simpleQuestion",
            reference
        }

        await api.put(`/quiz/${String(quizID)}/question/${question.id}`, questionData);
        
        toast.success('Questão atualizada com sucesso!');

        router.push(`/minha-conta/editar-quiz/${quizID}`);
    }

    return (
        <div className={styles.container}>
            <header>
                <h1>Editar questão | <strong>{question.question}</strong></h1>
                <Link href={`/minha-conta/editar-quiz/${quizID}`}><a>
                    <span>Voltar <RiArrowGoBackLine /></span>
                </a></Link>
            </header>
            <form onSubmit={handleFormSubit}>
                <div>
                    <Input 
                        id="question"
                        label="Pergunta"
                        value={ansking}
                        onChange={event => setAnsking(event.target.value)}
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
                            value={wrongOptions[`opt2`] || ''}
                            onChange={(e) => handleWrongeOptionChange(e.target.value, 'opt2')}
                        />
                    </div>
                    <div>
                        <Input 
                            id="fake-answer2"
                            label="Errada #2"
                            value={wrongOptions['opt3'] || ''}
                            onChange={(e) => handleWrongeOptionChange(e.target.value, 'opt3')}
                        />
                    </div>
                    <div>
                        <Input 
                            id="fake-answer3"
                            label="Errada #3"
                            value={wrongOptions['opt4'] || ''}
                            onChange={(e) => handleWrongeOptionChange(e.target.value, 'opt4')}
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
                        Atualizar
                    </Button>
                </div>
            </form>
        </div>
    )
}

export const getServerSideProps: GetServerSideProps = async ({ req, params }) => {
    const session = getSession({ req });
    const { quizID, questionID } = params;

    if(!session)
        return { redirect: { destination: '/404', permanent: false } }
    
    const questionDB = new FirestoreQuestion();

    const question = await questionDB.get(String(quizID), String(questionID));

    return {
        props: {
            question
        }
    }
}
