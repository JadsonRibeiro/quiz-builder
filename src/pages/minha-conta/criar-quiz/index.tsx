import { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/client'
import { useRouter } from 'next/dist/client/router';

import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import { PermissionDenied } from '../../../components/PermissionDenied';

import api from '../../../services/api';

import styles from '../quiz.module.scss';
import { Checkbox } from '../../../components/Checkbox';
import Link from 'next/link';
import { RiArrowGoBackLine } from 'react-icons/ri';

export default function CreateQuiz() {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [isPrivate, setIsPrivate] = useState(true)

    const [session] = useSession();
    const router = useRouter();

    async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if(!name || !category) {
            toast.error('Preencha todos campos');
            return;
        }

        const response = await api.post('/quiz', {
            name,
            category,
            ownerEmail: session.user.email,
            private: isPrivate
        });

        if(response.data?.quizID)
            router.push(`/minha-conta/criar-quiz/${response.data.quizID}`)
        else
            toast.error('Erro na criação do quiz');
    }

    if(!session) {
        return <PermissionDenied />
    }

    return (
        <div className={styles.container}>
            <header>
                <h1>Criar novo quiz</h1>
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
                    <Button>Criar</Button>
                </div> 
            </form>
        </div>
    )
}
