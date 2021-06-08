import PeerJS from 'peerjs'

export function initializePeerConnection(id: string, config?: PeerJS.PeerJSOption) {
    return new PeerJS(id, config ?? null);
}