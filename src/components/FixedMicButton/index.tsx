import React, { ButtonHTMLAttributes } from "react";
import { FiMic, FiMicOff } from "react-icons/fi";

interface FixedMicButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    isActive: boolean;
}

import styles from "./styles.module.scss";

export function FixedMicButton({ isActive, ...rest } : FixedMicButtonProps) {
    return (
        <button 
            className={styles.button}
            {...rest}
        >
            {isActive 
                ? <FiMic color="white" size={20} /> 
                : <FiMicOff color="white" size={20} />
            }
        </button>
    )
}