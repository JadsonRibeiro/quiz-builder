export default class Media {
    static async getUserAudio(audio = true) {
        return navigator.mediaDevices.getUserMedia({
            audio
        })
    }

    static createMediaStreamFake() {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const destination = oscillator.connect(audioContext.createMediaStreamDestination());
        oscillator.start();
        const [track] = destination.stream.getAudioTracks();

        const mediaStreamTrack = Object.assign(track, { enabled: false });

        return new MediaStream([
            mediaStreamTrack
        ])
    }
}