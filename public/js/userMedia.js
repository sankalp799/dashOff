// @ts-nocheck
const peerConns = {};
let localStream=null;
let freddy = document.getElementById('freddyMusicBot')

// freddy.crossOrigin = 'Anonymous';
const ROOM_ID = sessionStorage.getItem("roomId") || '420';
const USERNAME = sessionStorage.getItem("username") || 'Anonymous';
let myFace = document.getElementById('myFace');
let grid = document.querySelector('.mediaWrapper');
let mediaOverlayDropDown = document.querySelector('.mediaOverlayDropDown');

// freddyMusic
// tags
let freddyVisualPlatform = document.getElementById('freddyCanvas');
let freddyMusicImg = document.querySelector('.freddy-music img');
let freddyMusicInfo = document.querySelector('.freddy-audio-info');

window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;


const SOCKET = window.location.hostname.indexOf('localhost') >= 0 ?
    io('http://localhost:3000/') :
    io('https://dashoff-signal.herokuapp.com/');

const config = {
    iceServer: [
        { urls: 'stun:stun.l.google.com:19302' },
    ]
};


const mediaConstraints = {
    video: true,
    auido: false,
}


/*

document.getElementById('MoreMeme').addEventListener('click', () => {
    try {
        SOCKET.emit('freddy:meme:please', {
            rid: ROOM_ID,
            uname: USERNAME,
        })
    } catch (e) {
        console.error(e);
    }
})
*/

/*
Peer.onicecandidate = evt => {
    Peer.addIceCandidate(evt.candidate);
}
*/

document.querySelector('[face-toggle-btn]').addEventListener('click', (evt = null) => {
    evt.target.classList.toggle('off');
    reNegotiateMedia('video');
});
document.querySelector('[mic-toggle-btn]').addEventListener('click', (evt = null) => {
    evt.target.classList('off');
    reNegotiateMedia('audio');
});

freddy.onplay = () => {
    vslz(freddy, freddyVisualPlatform)
}

window.addEventListener('beforeunload', terminateConnection);

SOCKET.on('connect', () => {
    SOCKET.emit('room:join', ROOM_ID);
})

SOCKET.on('freddy:meme', (data) => {
    const meme_div = `<div><span style="background-image: url('${data['meme']}')"></span></div>`
    document.getElementById('chatBox').appendChild(meme_div);
})

// music route start
//
SOCKET.on('freddy:music:data', data => {
    try{
        console.log(data);
        if (!freddy.paused)
            freddy.pause();
        freddy.src = data.url;
        if(data['s_all'])
            SOCKET.emit('freddy:music:all_set', ROOM_ID);
        else
            freddy.play();
        // display info
        //
        freddyMusicImg.src = data.image;
        freddyMusicInfo.innerText = data.title;
    }catch(e){
        console.error(e);
    }
    
})

SOCKET.on('freddy:music:play', play => {
    if (freddy.paused)
        freddy.play();
});


SOCKET.on('freddy:kind', data => {
    /******************
    let botChat = `<div><img src='https://avatars.dicebear.com/api/bottts/freddy.svg'/>: ${data}</div>`;
    document.querySelector('#chatBox').insertAdjacentHTML('beforeend', botChat);
    **/
    console.log('freddy> ', data);
    data = data.toString().trim();
    data = data.replaceAll('\n', '<br />');
    if (typeof(xx_catch_xx) == 'function')
        xx_catch_xx({
            t: 'INFO',
            heading: 'Freddy To Rescue',
            message: data,
        });
    console.log(data);
});

SOCKET.on('freddy:seek_plz', data => {
    const { to } = data;
    if (!freddy.paused) {
        freddy.currentTime = to;
    }
});

SOCKET.on('freddy:music:resume', data => {
    if (freddy.paused)
        freddy.play();
});

SOCKET.on('freddy:music:stop', data => {
    try {
        freddy.stop();
        freddy.src = undefined;
    } catch (e) {
        console.log('freddy> failed to stop music', e);
    }
});

SOCKET.on('freddy:error', err => {
    if (typeof(xx_catch_xx) == 'function')
        xx_catch_xx({
            t: 'ERR',
            heading: `Fredyy Problem`,
            message: err.message
        });
})

SOCKET.on('freddy:music:pause', data => {
    if (!freddy.paused)
        freddy.pause();
});
// SOCKET.emit('freddy', { line: '$play lion in the jungle'})

// SOCKET.emit('music:req', ROOM_ID, 'hey baby');

// music route end


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


    setTimeout(() => {
        SOCKET.emit('freddy', {
            rid: ROOM_ID,
            line: '$help',
        });
    }, 500);

    SOCKET.on('rtc:call', async(id, uname) => {
        console.log(`${id} calling...`);

        INIT_USER_RTC_CONNECTION(id, uname, CREATE_OFFER);
    })

    SOCKET.on('rtc:offer', CALL_ON_OFFER);

    SOCKET.on('rtc:answer', async(id, sdp) => {
        console.log(`${id}-sdp-${sdp}`);
        peerConns[id].setRemoteDescription(sdp)
            .then(remoteDesSuc, remoteDesFail);
    })

    SOCKET.on('rtc:candidate', async(data) => {
        peerConns[data.from].addIceCandidate(data.candidate)
            .then(() => console.log('successfully candidate added'), () => console.log('failed to add candidate'));
    })

    SOCKET.on('rtc:re-negotiate-media-offer', async(sid, sdp) => {
        try {
            console.log('rtc:re-negotiating-media-offer-received');
            // adding my stream here

            peerConns[sid].ontrack = ({ streams }) => {
                handleTracks(streams, sid);
            }

            peerConns[sid].setRemoteDescription(sdp)
                .then(remoteDesSuc, remoteDesFail);

            OFFER_RESPONSE_ANS(sid, 'rtc:re-negotiate-media-answer');
        } catch (e) {
            handleError(e, 'Failed To Switch Media Please Try Again');
        }
    })

    SOCKET.on('rtc:re-negotiate-req', (sid) => {
        // create re-negotiation offer to socket id [sid]
        try {
            // adding my stream here
            localStream.getTracks().forEach(track => {
                peerConns[sid].addTrack(track, localStream);
            })

            peerConns[sid].ontrack = ({ streams }) => {
                handleTracks(streams, sid);
            }

            CREATE_OFFER(sid, 'rtc:re-negotiate-media-offer');
        } catch (e) {
            handleError(e, 'Failed To Switch Media Please Try Again');
        }
    })

    SOCKET.on('rtc:re-negotiate-media-answer', (id, sdp) => {
        // create re-negotiation anwser here to sid
        peerConns[id].setRemoteDescription(sdp)
            .then(remoteDesSuc, remoteDesFail);
    })
})

function handleError(error, devMsg) {
    console.log(devMsg);
}

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
    console.log(id + ': ', streams[0]);

    let vid_remote = document.getElementById('vid-' + id);
    vid_remote.srcObject = null;
    vid_remote.srcObject = streams[0];

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

    rtcConn.ontrack = ({ streams }) => {
        handleTracks(streams, id);
    }

    cb(id);
}

function CREATE_OFFER(id, sEvent = null) {
    sEvent = sEvent != null ? sEvent : 'rtc:offer';
    peerConns[id].createOffer()
        .then((sdp) => {
            peerConns[id].setLocalDescription(sdp)
                .then(localDesSuc, localDesFail);
            SOCKET.emit(sEvent, {
                to: id,
                sdp: sdp,
                username: USERNAME
            });
        }, () => xx_catch_xx({
            t: 'ERR',
            message: 'Failed to establish user cam connection',
            heading: 'freddy: Error'
        }));
}

function CALL_ON_OFFER(id, sdp, uname) {
    INIT_USER_RTC_CONNECTION(id, uname, (id) => {
        peerConns[id].setRemoteDescription(sdp)
            .then(remoteDesSuc, remoteDesFail);

        OFFER_RESPONSE_ANS(id);
    });
}

function OFFER_RESPONSE_ANS(id, sEvent = null) {
    sEvent = sEvent != null ? sEvent : 'rtc:answer';
    peerConns[id].createAnswer()
        .then((sdp) => {
            peerConns[id].setLocalDescription(sdp)
                .then(localDesSuc, localDesFail);
            
            SOCKET.emit(sEvent, {
                to: id,
                sdp: sdp,
            })
        }, () => {
            console.log('failed to create answer sdp');
        });
}

async function INIT_RTC_CONN (){
    try{
        if(typeof(navigator.mediaDevices.getUserMedia) == 'undefined'){
            xx_catch_xx({
                t: 'ERR',
                heading: 'Error: Require SSL', 
                message: 'Not a secure site <br /> We failed to access your devices <br /> for video/audio chat',
            })

            return;
        }
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        deviceList.forEach(d => console.log(d.kind));

        mediaConstraints['video'] = deviceList.findIndex(device => device.kind === 'videoinput') > -1 ? true : false;
        mediaConstraints['auido'] = deviceList.findIndex(device => device.kind === 'audioinput') > -1 ? true : false;

        if(!mediaConstraints['video'])
            xx_catch_xx({
                t: 'ERR',
                heading: 'Freddy', 
                message: 'camera access denied',
            })
        
        if(!mediaConstraints['audio'])
            xx_catch_xx({
                t: 'ERR',
                heading: 'Freddy', 
                message: 'microphone access denied',
            })

        console.log(mediaConstraints);
        const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
        localStream = stream;
        myFace.srcObject = stream;

        SOCKET.emit('rtc:call', ROOM_ID, USERNAME);
    }catch(e){
        console.error(e);
        xx_catch_xx({
            t: 'ERR',
            heading: 'Error', 
            message: e.message,
        })
    }
}

async function reNegotiateMedia(type = null) {
    if (type != null) {
        mediaConstraints[type] = mediaConstraints[type] ? false : true;
        console.log('re-nego-init');
        console.log('type- ', type, mediaConstraints);
    
        if(typeof(navigator.mediaDevices.getUserMedia()) == 'undefined') return;

        const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

        myFace.srcObject = null;
        localStream = null;

        myFace.srcObject = stream;
        localStream = stream;

        setTimeout(() => {
            SOCKET.emit('rtc:re-negotiate-media', ROOM_ID, USERNAME);
        }, 400);
    } else
        xx_catch_xx({
            t: 'ERR',
            heading: 'Freddy: Media Error',
            message: 'could not switch media'
        })
}

/*******
function __freddy_visual_analyser__() {
    let fctx = freddyVisualPlatform.getContext('2d');
    let f_AW = freddyVisualPlatform.width;
    let f_AH = freddyVisualPlatform.height;
    let aCtx = new (window.AudioContext || window.webkitAudioContext)();
    let aSource = aCtx.createMediaElementSource(freddy);
    let analyser = aCtx.createAnalyser();

    aSource.connect(analyser);
    analyser.connect(aCtx.destination);
    analyser.fftSize=256;

    let freddyBufferLength = analyser.frequencyBinCount;
    console.log(freddyBufferLength);
    let freddyDataArray = new Uint8Array(freddyBufferLength);

    let f_ABW = (f_AW/freddyBufferLength) * 2.5;
    let f_ABH;
    let f_ABx=0;

    freddyVisualPlatform.addEventListener('resize', (evt=null) => {
        f_AW = freddyVisualPlatform.width;
        f_AH = freddyVisualPlatform.height;
        f_ABW = (f_AW/freddyBufferLength) * 2.5;
    });
    
    function __animate__(){
        requestAnimationFrame(__animate__);

        f_ABx = 0;

        analyser.getByteFrequencyData(freddyDataArray);

        fctx.fillStyle="#00000022";
        fctx.fillRect(0, 0, f_AW, f_AH);

        for (let i = 0; i < freddyBufferLength; i++) {
            f_ABH = freddyDataArray[i];
            
            let r = f_ABH + (25 * (i/freddyBufferLength));
            let g = 250 * (i/freddyBufferLength);
            let b = 50;

            fctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
            fctx.fillRect(f_ABx, f_AH - f_ABH, f_ABW, f_ABH);

            f_ABx += f_ABW + 1;
      }
    }

    __animate__();
}
    **/
// __freddy_visual_analyser__();

function vslz(se, myCan) {
    let actx = new AudioContext();
    let analyser = actx.createAnalyser();
    let audioSrc = actx.createMediaElementSource(se);

    audioSrc.connect(analyser);
    analyser.connect(actx.destination);
    analyser.fftSize = 256;


    let canvas = myCan,
        cwidth = canvas.width,
        cheight = canvas.height - 2,
        ctx = canvas.getContext('2d'),
        caps = [],
        gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0.78, '#0437F2');
    gradient.addColorStop(0.22, '#333');

    ctx.clearRect(0, 0, canvas.width, canvas.height);


    function renderFrame() {
        let array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let bw = cwidth / (analyser.frequencyBinCount / 4);
        let bh;
        let bx = 0;
        let gap = 10;
        let jump = 4;

        console.log('ana_freq_bit_count> ', analyser.frequencyBinCount);

        for (var i = 0; i < analyser.frequencyBinCount; i += jump) {
            bh = array[i] / 1.5;
            if (caps.length < analyser.frequencyBinCount / jump) {
                caps.push(bh);
            };

            ctx.fillStyle = '#fff';
            if (bh < caps[i]) {
                ctx.fillRect((i / jump) * bw + gap, cheight - (--caps[i] / 1.6), bw, 1);
            } else {
                ctx.fillRect((i / jump) * bw + gap, cheight - bh / 1.6, bw, 1);
                caps[i] = bh;
            };

            ctx.fillStyle = "#fff";
            ctx.fillRect(bx + gap, cheight - bh / 1.6, bw, bh);

            bx += bw;
        }
        requestAnimationFrame(renderFrame);
    }
    renderFrame();

};

setTimeout(() => {
    INIT_RTC_CONN()
}, 2000)
