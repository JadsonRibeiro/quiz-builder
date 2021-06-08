import { useState } from "react";
import usePeerJS from '../../hooks/usePeerJS';
import { Audio } from "../../components/Audio";

export default function Peer() {
    const [peerID, setPeerID] = useState('');
    const [mediaStreams, setMediaStreams] = useState<MediaStream[]>([]);

    const { peer } = usePeerJS({
        onPeerOpen: (myPeerID) => { console.log('Open', myPeerID) },
        onPeerConnection: (data) => { console.log('Connection', data) },
        onPeerCall: async (call) => {
            console.log('Call received', call);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            call.answer(stream);

            call.on('stream', (streamReceived: MediaStream) => {
                console.log('Stream feedback received', streamReceived);
                setMediaStreams(oldMediaStreams => [
                    ...oldMediaStreams,
                    streamReceived
                ]);
            });
        }
    });

    console.log('Peer', peer);

    async function makeCall() {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const call = peer.call(peerID, stream);

        call.on('stream', (streamReceived: MediaStream) => {
            console.log('Stream feedback received', streamReceived);
            setMediaStreams(oldMediaStreams => [
                ...oldMediaStreams,
                streamReceived
            ]);
        });

        call.on('close', () => console.log('Call closed'));

        call.on('error', (err) => console.log('Error on call', err));
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
            <button onClick={makeCall}>
                Ligar
            </button>
        </div>
    )
}
