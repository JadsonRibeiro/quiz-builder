import { AudioHTMLAttributes, useCallback } from "react";

type AudioProps = AudioHTMLAttributes<HTMLAudioElement> & {
    srcObject: MediaStream;
  };
  
  export const Audio = ({ srcObject, ...props }: AudioProps) => {
    const refAudio = useCallback(
      (node: HTMLAudioElement) => {
        if (node) node.srcObject = srcObject;
      },
      [srcObject],
    );
  
    return <audio ref={refAudio} {...props} />;
  };