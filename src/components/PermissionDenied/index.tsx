import { SignInButton } from "../SignInButton";

import styles from './styles.module.scss';

export function PermissionDenied() {
    return (
        <div className={styles.container}>
            <h2>Permissão negada!</h2>
            <p>Você não tem permissão para acessar essa página</p>
            <SignInButton />
        </div>
    )
}
