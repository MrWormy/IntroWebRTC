let connection;
let channel;

async function createRTCConnexion() {
    const pc = new RTCPeerConnection({
        iceServers: [
            {urls: "stun:stun.l.google.com:19302"},
            {urls: "stun:stun1.l.google.com:19302"},
            {urls: "stun:stun2.l.google.com:19302"},
            {urls: "stun:stun3.l.google.com:19302"},
            {urls: "stun:stun4.l.google.com:19302"}
        ]
    });

    await navigator.mediaDevices.getUserMedia({audio: true, video:true})
    .then(stream => {
        document.getElementById("local_video").srcObject = stream;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
    })
    .catch(e => console.log(e));

    channel = pc.createDataChannel("chat", {negotiated: true, id: 0});
    channel.onopen = function(event) {
        console.log('channel openned', event);
        channel.send('Hi!');
    };
    channel.onmessage = function(event) {
        console.log(event.data);
    };

    pc.onicecandidate = (e) => {
        console.log(e.candidate);
        console.log(btoa(JSON.stringify(e.candidate)));
    };

    pc.ontrack = (e) => {
        document.getElementById("received_video").srcObject = e.streams[0];
    };

    return pc
}

async function initiateConnection() {
    if (!(connection instanceof RTCPeerConnection)) {
        connection = await createRTCConnexion();
    }

    connection.createOffer().then((offer) => {
        console.log(offer);
        return connection.setLocalDescription(offer);
    })
    .then(() => {
        console.log(btoa(JSON.stringify(connection.localDescription.toJSON())));
    })
    .catch(e => console.log(e))
}

async function acceptConnection(message) {
    if (!(connection instanceof RTCPeerConnection)) {
        connection = await createRTCConnexion();
    }

    const desc = new RTCSessionDescription(JSON.parse(atob(message)));

    connection.setRemoteDescription(desc)
    .then(() => {
        return connection.createAnswer();
    })
    .then((answer) => {
        console.log(answer);
        return connection.setLocalDescription(answer);
    })
    .then(() => {
        console.log(btoa(JSON.stringify(connection.localDescription.toJSON())));
    })
    .catch(e => console.log(e))
}

function acceptAnswer(message) {
    const desc = new RTCSessionDescription(JSON.parse(atob(message)));

    connection.setRemoteDescription(desc)
        .then(() => {
        })
        .catch(e => console.log(e))
}

function addCandidate(candidate) {
    connection.addIceCandidate(JSON.parse(atob(candidate))).catch(e => console.log(e))
}
