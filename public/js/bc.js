const peerConns = {};
let localStream;
const ROOM_ID = sessionStorage.getItem("roomId") || '420';
const USERNAME = sessionStorage.getItem("username") || 'Anonymous';
let myFace = document.getElementById('myFace');
let grid = document.querySelector('.mediaWrapper');
let mediaOverlayDropDown = document.querySelector('.mediaOverlayDropDown');

const SOCKET = io('https://dashoff-signal.herokuapp.com/');
const config = {
    iceServer: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
    ]
};
/*
Peer.onicecandidate = evt => {
    Peer.addIceCandidate(evt.candidate);
}
*/

window.addEventListener('beforeunload', terminateConnection);

const mediaConstraints = {
    video: {
        width: {
            min: 640,
            max: 1024
        },
        height: {
            min: 480,
            max: 720
        },
    },
    audio: {
        'echoCancellation': true
    },
}

navigator
    .mediaDevices
    .getUserMedia(mediaConstraints)
    .then(stream => {
        myFace.srcObject = stream;
        localStream = stream;
        setTimeout(() => {
            SOCKET.emit('rtc:call', ROOM_ID, USERNAME);
        }, 2 * 1000);
    })
    .catch(err => {
        console.error(err);
    })

SOCKET.on('connect', () => {
    SOCKET.emit('room:join', ROOM_ID);
})

SOCKET.on('user:left', (id) => {
    try {
        peerConns[id].close();
        delete peerConns[id];
        let userMedia = document.getElementById('${id}');
        document.querySelector('.mediaWrapper').removeChild(userMedia);
    } catch (e) {
        console.log(`[RTC_SOCKET_SIGNAL] ERROR`, e.message)
    }
})

SOCKET.on('joined', () => {
    console.log('joined');

    SOCKET.on('rtc:call', async(id, uname) => {
        console.log(`${id} calling...`);

        INIT_USER_RTC_CONNECTION(id, uname, CREATE_OFFER);
    })

    SOCKET.on('rtc:offer', CALL_ON_OFFER);

    SOCKET.on('rtc:answer', async(id, sdp) => {
        peerConns[id].setRemoteDescription(sdp)
            .then(remoteDesSuc, remoteDesFail);
    })

    SOCKET.on('rtc:candidate', async(data) => {
        peerConns[data.from].addIceCandidate(data.candidate)
            .then(() => console.log('successfully candidate added'), () => console.log('failed to add candidate'));
    })
})

function handleIceCandidate(event, id) {
    SOCKET.emit('rtc:candidate', {
        to: id,
        candidate: event.candidate,
    });
}

function createVideoElement(id, uname) {
    let found = false;
    document.querySelectorAll('.mediaWrapper .mediaElement').forEach(e => {
        if (e.getAttribute('id') == id) {
            found = true;
        }
    })

    if (!found) {
        console.log('[MEDIA_ELEMENT] ADDING');
        let videoDom = document.createElement('div');
        videoDom.classList.add('mediaElement');
        videoDom.addEventListener('click', toggleMediaAudio);
        // videoDom.setAttribute('id', id);
        videoDom.innerHTML = `<div class='mediaOverlayController' id=${id}>
                <div class='mediaMice' id='mic-${id}' ><i class="fas fa-microphone-slash"></i></div>
                <div class="mediaFaceUsername">${uname}</div>
            </div>
            <video playsinline autoplay id='${'vid-' + id}' ></video>`;
        grid.insertAdjacentElement('beforeend', videoDom);
    }
}

function handleTracks(streams, id) {
    document.getElementById('vid-' + id).srcObject = streams[0];

}

function localDesSuc() {
    console.log('local sdp set.');
}

function localDesFail() {
    console.log('local sdp failure.');
}

function remoteDesSuc() {
    console.log('remote sdp set.');
}

function remoteDesFail() {
    console.log('remote sdp failure.');
}

function terminateConnection(e) {
    if (typeof(e) == 'object') {
        try {
            SOCKET.emit('leave', ROOM_ID);
            SOCKET.disconnect();
        } catch (e) {
            console.error(e);
        }
    }
}

function toggleMediaDropDown(evt) {
    !mediaOverlayDropDown.classList.contains('active') ?
        mediaOverlayDropDown.classList.add('active') :
        mediaOverlayDropDown.classList.remove('active');
}

function toggleMediaAudio(evt) {
    let id = evt.target.getAttribute('id');
    let faceMedia = document.getElementById(`vid-${id}`);
    let mice = document.getElementById(`mic-${id}`);
    mice.classList.toggle('active');
    toggleMice(faceMedia);
    /*
    document.querySelectorAll('video')
        .forEach(media => {
            if (media.getAttribute('_id') == id)
                toggleMice(media);
        })
    */
}

function toggleMice(videoElement) {
    console.log(videoElement);
    !videoElement.muted ?
        videoElement.muted = true :
        videoElement.muted = false;
}

function INIT_USER_RTC_CONNECTION(id, uname, cb) {
    const rtcConn = new RTCPeerConnection(config);

    // create new face video element
    createVideoElement(id, uname);

    peerConns[id] = rtcConn;
    localStream.getTracks().forEach(track => {
        rtcConn.addTrack(track, localStream);
    })

    rtcConn.onicecandidate = (evt) => {
        handleIceCandidate(evt, id);
    };

    rtcConn.ontrack = evt => {
        handleTracks(evt.streams, id);
    }

    cb(rtcConn, id);
}

function CREATE_OFFER(rtcConn, id) {
    rtcConn.createOffer()
        .then((sdp) => {
            rtcConn.setLocalDescription(sdp)
                .then(localDesSuc, localDesFail);
            SOCKET.emit('rtc:offer', {
                to: id,
                sdp: sdp,
                username: USERNAME
            });
        }, () => console.log('failed to create offer'));
}

function CALL_ON_OFFER(id, sdp, uname) {
    INIT_USER_RTC_CONNECTION(id, uname, (conn, id) => {
        conn.setRemoteDescription(sdp)
            .then(remoteDesSuc, remoteDesFail);

        OFFER_RESPONSE_ANS(conn, id);
    });
}

function OFFER_RESPONSE_ANS(rtcConn, id) {
    rtcConn.createAnswer()
        .then((sdp) => {
            rtcConn.setLocalDescription(sdp)
                .then(localDesSuc, localDesFail);
            SOCKET.emit('rtc:answer', {
                to: id,
                sdp: sdp,
            })
        }, () => {
            console.log('failed to create answer sdp');
        });
}