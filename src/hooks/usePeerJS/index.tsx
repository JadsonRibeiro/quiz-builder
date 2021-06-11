import PeerJS from 'peerjs';
import { useEffect, useState } from 'react'

export function usePeerJS({
    onOpen = (id: string) => {},
    onConnection = (data: PeerJS.DataConnection) => {},
    onCall = (call: PeerJS.MediaConnection) => {},
    onStreamReceived = (call: PeerJS.MediaConnection, stream: MediaStream) => {},
    onCallClosed = (call: PeerJS.MediaConnection) => {},
    onCallError = (call: PeerJS.MediaConnection, error: any) => {},
}) {
    const [peer, setPeer] = useState<PeerJS>();
    const [call, setCall] = useState<PeerJS.MediaConnection>();

    useEffect(() => {
        import('peerjs').then(({ default: PeerJS }) => {
            const peer = new PeerJS();
            setPeer(peer);
        })
    }, []);

    useEffect(() => {
        if(peer) {
            peer.on('open', onOpen);
            peer.on('connection', onConnection);
            peer.on('call', async (call: PeerJS.MediaConnection) => {
                onCall(call);
                setCall(call);
                
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                call.answer(stream);
            });
        }
    }, [peer]);

    useEffect(() => {
        if(call) {
            call.on('stream', (stream: MediaStream) => { onStreamReceived(call, stream) });
            call.on('close', () => onCallClosed(call));
            call.on('error', (error: any) => onCallError(call, error));
        }
    }, [call])

    function makeCall(peerID: string, stream: MediaStream) {
        const call = peer.call(peerID, stream);

        call.on('stream', (stream: MediaStream) => { onStreamReceived(call, stream) });

        call.on('close', () => onCallClosed(call));
        call.on('error', (error: any) => onCallError(call, error));
    }

    return { peer, makeCall };
}
