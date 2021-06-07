import React, { ButtonHTMLAttributes } from 'react'

import styles from './styles.module.scss'

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
    return (
        <button
            {...props}
            className={styles.container}
        >
            {props.children}
        </button>
    )
}
