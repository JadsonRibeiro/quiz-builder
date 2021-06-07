import { FaGoogle } from 'react-icons/fa'
import { FiX } from 'react-icons/fi'
import { signIn, signOut, useSession } from 'next-auth/client'

import styles from './styles.module.scss';
import Link from 'next/link';

export function SignInButton() {
    const [session, loading] = useSession();

    return session ? (
        <button
            type="button"
            className={styles.signInButton}
        >
            <Link href="/minha-conta">
                <a>
                    <FaGoogle color="#04d361" />
                    {session.user.name}
                </a>
            </Link>
            <FiX color="#737380" 
                className={styles.closeIcon} 
                onClick={() => signOut()}
            />
        </button>
    ) : (
        <button 
            type="button"
            className={styles.signInButton}
            onClick={() => signIn('google')}
        >
            <FaGoogle color="#eba417" />
            {loading ? 'Carregando...' : 'Entrar'}
        </button>
    )
}
