import io from "socket.io-client";

export default function getSocketClient(namespace: string) {
    const SOCKET_ENDPOINT = `/${namespace}`;
    const socket = io(SOCKET_ENDPOINT);

    return socket;
}