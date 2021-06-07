import Link from 'next/link'
import { useEffect } from 'react';
import io from 'socket.io-client';
import { signIn, signOut, useSession } from 'next-auth/client'

import styles from './home.module.scss';

// const socket = io();

export default function Home() {
  const [session] = useSession();

  console.log('Session', session);

  useEffect(() => {
    // socket.on('connect', () => {
    //   console.log('Connected with server')
    // });
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <section>
          <span>Eai galera 😁</span>
          <h1>
            Crie seu quiz e compartilhe <br /> 
            com os amigos</h1>
          <p>
            Teste o seus conhecimentos <br />
            e se divirta com a galera!
          </p>
        </section>
      </div>
      <span className={styles.logo}>
        Q
      </span>
    </div>
  )
}
