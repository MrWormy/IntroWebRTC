const start = document.getElementById('start_session');
const info = document.getElementById('info');
const answer = document.getElementById('answer');
let infoSent = false;
let connection;
let channel;

async function createRTCConnexion(addCandCb) {
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
        if (addCandCb) {
            addCandCb(e.candidate);
        }
    };

    pc.ontrack = (e) => {
        document.getElementById("received_video").srcObject = e.streams[0];
    };

    return pc;
}

async function initiateConnection() {
    let conInfo = {
        offer: null,
        candidates: []
    };
    let addCandCb = candidate => {
        if (!infoSent) {
            if (candidate === null && conInfo.offer !== null) {
                infoSent = true;
                console.log(conInfo);
                info.value = `${location.origin}${location.pathname}#${btoa(JSON.stringify(conInfo))}`
            } else if (candidate instanceof RTCIceCandidate) {
                conInfo.candidates.push(candidate);
            }
        }
    };

    if (!(connection instanceof RTCPeerConnection)) {
        connection = await createRTCConnexion(addCandCb);
    }

    connection.createOffer().then((offer) => {
        return connection.setLocalDescription(offer);
    })
    .then(() => {
        conInfo.offer = connection.localDescription;
        setTimeout(() => addCandCb(null), 6000);
    })
    .catch(e => console.log(e));
}

async function acceptConnection(message) {
    let conInfo = {
        answer: null,
        candidates: []
    };
    let addCandCb = candidate => {
        if (!infoSent) {
            if (candidate === null && conInfo.answer !== null) {
                infoSent = true;
                console.log(conInfo);
                info.value = `${btoa(JSON.stringify(conInfo))}`
            } else if (candidate instanceof RTCIceCandidate) {
                conInfo.candidates.push(candidate);
            }
        }
    };

    if (!(connection instanceof RTCPeerConnection)) {
        connection = await createRTCConnexion(addCandCb);
    }

    const desc = new RTCSessionDescription(message);

    connection.setRemoteDescription(desc)
    .then(() => {
        return connection.createAnswer();
    })
    .then((answer) => {
        return connection.setLocalDescription(answer);
    })
    .then(() => {
        conInfo.answer = connection.localDescription;
    })
    .catch(e => console.log(e))
}

function acceptAnswer(message) {
    const infos = JSON.parse(atob(message));

    connection.setRemoteDescription(infos.answer)
        .then(() => {
            infos.candidates.forEach(addCandidate);
        })
        .catch(e => console.log(e))
}

async function initPeerClient() {
    const info = JSON.parse(atob(location.hash.slice(1)));

    await acceptConnection(info.offer);
    info.candidates.forEach(addCandidate);
}

function addCandidate(candidate) {
    connection.addIceCandidate(candidate).catch(e => console.log(e))
}

document.getElementById('copy').addEventListener('click', () => {
    info.select();
    document.execCommand('copy');
});

if (location.hash.length === 0) {
    start.style.visibility = 'visible';
    answer.style.visibility = 'visible';
    start.addEventListener('click', () => {
        infoSent = false;
        info.value = 'peer connection initialisation...';
        initiateConnection();
    }, false);
    answer.addEventListener('change', () => {
        acceptAnswer(answer.value);
    }, false)
} else {
    info.value = 'peer connection initialisation...';
    initPeerClient();
}
