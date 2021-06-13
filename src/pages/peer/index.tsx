import { useState } from "react";
import { usePeerJS } from '../../hooks/usePeerJS';
import { Audio } from "../../components/Audio";

export default function Peer() {
    const [peerID, setPeerID] = useState('');
    const [mediaStreams, setMediaStreams] = useState<MediaStream[]>([]);

    const { peer, makeCall } = usePeerJS({
        onOpen: (myPeerID) => { 
            console.log('Open', myPeerID);
        },
        onConnection: (data) => { console.log('Connection', data) },
        onCall: async (call) => {
            console.log('Call received', call);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            call.answer(stream);
        },
        onStreamReceived: (call, stream) => { 
            console.log('Stream received', call, stream);
            setMediaStreams(oldStreams => [
                ...oldStreams,
                stream
            ]);
        },
        onCallClosed: (call) => console.log('Call closed', call),
        onCallError: (call, error) => console.log('Error on call', call, error)
    });

    console.log('Peer', peer);

    async function handleMakeCall() {
        makeCall(peerID);
    }

    return (
        <div>
            <h1>Peer Teste</h1>
            <input 
                type="text" 
                placeholder="Peer ID"
                value={peerID}
                onChange={e => setPeerID(e.target.value)}
            />
            {mediaStreams.map(mediaStream => (
                <Audio key={mediaStream.id} srcObject={mediaStream} controls autoPlay />
            ))}
            <button onClick={handleMakeCall}>
                Ligar
            </button>
        </div>
    )
}
