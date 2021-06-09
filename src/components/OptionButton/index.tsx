import React, { ButtonHTMLAttributes } from 'react'

import styles from './styles.module.scss'

interface OptionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    clicked: boolean
}

export const OptionButton = ({clicked, disabled, ...props}: OptionButtonProps) => {
    const style = [styles.container];

    if(clicked) style.push(styles.clicked)
    if(disabled) style.push(styles.disabled)

    return (
        <button
            {...props}
            className={style.join(' ')}
        >
            {props.children}
        </button>
    )
}
