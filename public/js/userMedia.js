const peerConns = {};
let localStream;
let freddy = new Audio();
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

document.getElementById('userMediaToggleVideo').addEventListener('click', reNegotiateMedia);
document.getElementById('userMediaToggleMic').addEventListener('click', reNegotiateMedia);

const SOCKET = window.location.hostname.indexOf('localhost') >= 0 ? 
	io('http://localhost:3000/') : 
	io('https://dashoff-signal.herokuapp.com/');
	
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

// music route start
//
SOCKET.on('freddy:music:data', data => {
    console.log(data);
    if(!freddy.paused)
        freddy.pause();
    freddy.src = data.url;
    SOCKET.emit('freddy:music:all_set', ROOM_ID);

    // display info
    //
    freddyMusicImg.src = data.image;
    freddyMusicInfo.innerText = data.title;
})

SOCKET.on('freddy:music:play', play => {
    if(freddy.paused)
        freddy.play();
});

SOCKET.on('freddy:kind', data => {
    const botChat = `<div><img src='https://avatars.dicebear.com/api/bottts/freddy.svg'/>: ${data}</div>`;
    document.querySelector('#chatBox').insertAdjacentHTML('beforeend', botChat);
});

SOCKET.on('freddy:seek_plz', data => {
    const { to } = data;
    if(!freddy.paused){
        freddy.currentTime = to;    
    }
});

SOCKET.on('freddy:music:resume', data => {
    if(freddy.paused)
        freddy.play();
});

SOCKET.on('freddy:music:stop', data => {
    try{
        freddy.stop();
        freddy.src = undefined;
    }catch(e){
        console.log('freddy> failed to stop music', e);
    }
});

SOCKET.on('freddy:music:pause', data => {
    if(!freddy.paused)
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

    SOCKET.on('rtc:call', async(id, uname) => {
        console.log(`${id} calling...`);

        INIT_USER_RTC_CONNECTION(id, uname, CREATE_OFFER);
    })

    SOCKET.on('rtc:offer', CALL_ON_OFFER);

    SOCKET.on('rtc:answer', async(id, sdp) => {
        peerConns[id].setRemoteDescription(sdp)
            .then(remoteDesSuc, remoteDesFail);
    })

    SOCKET.on('rtc:candidate', async (data) => {
        peerConns[data.from].addIceCandidate(data.candidate)
            .then(() => console.log('successfully candidate added'), () => console.log('failed to add candidate'));
    })
    
    SOCKET.on('rtc:re-negotiate-media-offer', async (sid, sdp, uname) => {
    	try{
    	
    		// adding my stream here
    		localStream.getTracks().forEach(track => {
        		peerConns[sid].addTrack(track, localStream);
    		})
    		
    		peerConns[sid].setRemoteDescription(sdp)
            	.then(remoteDesSuc, remoteDesFail);

        	OFFER_RESPONSE_ANS(peerConns[sid], sid, 'rtc:re-negotiate-media-answer');
    	}catch(e){
    		handleError(e, 'Failed To Switch Media Please Try Again');
    	}
    })
    
    SOCKET.on('rtc:re-negotiate-req', sid => {
    	// create re-negotiation offer to socket id [sid]
    	try{
    	
    		// adding my stream here
    		localStream.getTracks().forEach(track => {
        		peerConns[sid].addTrack(track, localStream);
    		})
    		
    		CREATE_OFFER(peerConns[sid], sid, 'rtc:re-negotiate-media-offer');
    	}catch(e){
    		handleError(e, 'Failed To Switch Media Please Try Again');
    	}
    })
    
    SOCKET.on('rtc:re-negotiate-media-answer', (id, sdp) => {
    	// create re-negotiation anwser here to sid
    	peerConns[id].setRemoteDescription(sdp)
            .then(remoteDesSuc, remoteDesFail);
    })
})

function handleError(error, devMsg){
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

function CREATE_OFFER(rtcConn, id, sEvent=null) {
	sEvent = sEvent != null ? sEvent : 'rtc:offer';
    rtcConn.createOffer()
        .then((sdp) => {
            rtcConn.setLocalDescription(sdp)
                .then(localDesSuc, localDesFail);
            SOCKET.emit(sEvent, {
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

function OFFER_RESPONSE_ANS(rtcConn, id, sEvent=null) {
	sEvent = sEvent != null ? sEvent : 'rtc:answer';
    rtcConn.createAnswer()
        .then((sdp) => {
            rtcConn.setLocalDescription(sdp)
                .then(localDesSuc, localDesFail);
            SOCKET.emit(sEvent, {
                to: id,
                sdp: sdp,
            })
        }, () => {
            console.log('failed to create answer sdp');
        });
}

function reNegotiateMedia(evt){
	let type = evt.target.getAttribute("media-type");
	let constrains_t = mediaConstraints;
	constrains_t[type] = !constrains_t[type] ? true : false;
	navigator
    	.mediaDevices
    	.getUserMedia(constrains_t)
    	.then(stream => {
        	myFace.srcObject = stream;
        	localStream = stream;
        	setTimeout(() => {
            	SOCKET.emit('rtc:re-negotiate-media', ROOM_ID, USERNAME);
        	}, 1000);
    	})
    	.catch(err => {
        	console.error(err);
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


