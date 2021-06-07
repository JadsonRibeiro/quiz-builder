import styles from './styles.module.scss';

interface TimeBarProps {
    totalTime: number;
    timeLeft: number;
}

export function TimeBar({ timeLeft, totalTime }: TimeBarProps) {
    const percentage = (timeLeft * 100)/totalTime;

    let additionStyle = null;

    if(percentage < 66) additionStyle = styles.alert;
    if(percentage < 33) additionStyle = styles.danger;

    return (
        <div 
            className={`${styles.wrapper} ${additionStyle}`}
            style={{
                width: `${percentage}%`
            }}
        >
        </div>
    )
}
