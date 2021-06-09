import { useRouter } from 'next/router';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

import { LocalDatabase } from '../../services/localDatabase';
import api from '../../services/api';

import styles from './styles.module.scss';

export default function CreateRoom() {
    const [roomName, setRoomName] = useState('');
    const [quizID, setQuizID] = useState('');
    const [timeToAnswer, setTimeToAnswer] = useState('');
    
    const router = useRouter();

    useEffect(() => {
        if(router.query.quizID) setQuizID(String(router.query.quizID));
    }, [router.query])

    async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if(!quizID || !roomName) {
            return toast.error('Preencha todos campos!');
        }

        // Verifies if quiz exists
        const response = await api.get(`/quiz/${quizID}`);

        if(!response.data.quiz)
            return toast.error('Nenhum quiz com esse ID foi encontrado.')

        // Generate unique id to room
        const roomID = Date.now().toString(36) + Math.random().toString(36).substring(2);

        LocalDatabase.saveRoom({
            roomID: roomID,
            name: roomName,
            quizID,
            timeToAnswer: timeToAnswer ? Number(timeToAnswer) : 30
        });

        router.push(`/sala/${roomID}/${quizID}?timeToAnswer=${timeToAnswer}`);
    }

    return (
        <div className={styles.container}>
            <h1>Criar sala</h1>
            <form onSubmit={handleFormSubmit}>
                <div className="formControl">
                    <Input 
                        id="name"
                        label="Nome"
                        placeholder="Nome da sala"
                        value={roomName}
                        onChange={event => setRoomName(event.target.value)}
                    />
                </div>
                <div className="formControl">
                    <Input 
                        id="quiz-id"
                        label="ID do Quiz"
                        value={quizID}
                        onChange={event => setQuizID(event.target.value)}
                    />
                </div>
                <div className="formControl">
                    <Input 
                        id="time-to-answer"
                        label="Tempo para responder"
                        placeholder="Tempo em segundos"
                        type="number"
                        value={timeToAnswer}
                        onChange={event => setTimeToAnswer(event.target.value)}
                    />
                </div>
                <div className={styles.submitButton}>
                    <Button>
                        Criar
                    </Button>
                </div>
            </form>
        </div>
    )
}
