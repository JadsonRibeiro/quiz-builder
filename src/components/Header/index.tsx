import { useRouter } from 'next/dist/client/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiMenu } from 'react-icons/fi'

import { SignInButton } from '../SignInButton';

import styles from './styles.module.scss';

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const changeMenuOpen = () => setIsMenuOpen(false);

        router.events.on('routeChangeStart', changeMenuOpen);

        return () => router.events.off('routeChangeStart', changeMenuOpen);
    }, []);

    return (
        <header className={styles.headerContainer}>
            <div className={styles.headerContent}>
                <Link href="/"><a>
                    <span className={styles.logo}>Q</span>
                </a></Link>
                <nav className={isMenuOpen ? styles.active : ''}>
                    <Link href="/">
                        <a>Home</a>
                    </Link>
                    <Link href="/posts">
                        <a>Quizes</a>
                    </Link>
                </nav>
                <div className={styles.signInButton}>
                    <SignInButton />
                </div>
                <div className={styles.mobileOption}>
                    <FiMenu 
                        size={20}
                        onClick={() => setIsMenuOpen(oldValue => !oldValue)} 
                    />
                </div>
            </div>
        </header>
    )
}
