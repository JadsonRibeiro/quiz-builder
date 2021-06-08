import PeerJS from 'peerjs';
import { useEffect, useState } from 'react'

export default function usePeerJS({
    onPeerOpen = (id: string) => {},
    onPeerConnection = (data: PeerJS.DataConnection) => {},
    onPeerCall = (call: PeerJS.MediaConnection) => {},
}) {
    const [peer, setPeer] = useState<PeerJS>();

    useEffect(() => {
        import('peerjs').then(({ default: PeerJS }) => {
            const peer = new PeerJS();
            setPeer(peer);
        })
    }, []);

    useEffect(() => {
        if(peer) {
            peer.on('open', onPeerOpen);
            peer.on('connection', onPeerConnection);
            peer.on('call', onPeerCall);
        }
    }, [peer]);

    return { peer };
}
