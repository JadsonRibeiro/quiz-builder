import React, { InputHTMLAttributes } from 'react'

import styles from './styles.module.scss';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    id: string;
}

export const Input: React.FC<InputProps> = ({label, id, ...rest}) => {
    return (
        <div className={styles.container}>
            <label 
                htmlFor={id}
            >
                {label}
            </label>
            <input 
                {...rest}
                id={id} 
            />
        </div>
    )
}
