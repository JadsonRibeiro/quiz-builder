import styles from './styles.module.scss';

export function Loading() {
    return (
        <div className={styles.container}>
            <span>Carregando...</span>            
        </div>
    )
}
