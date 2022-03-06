let Music = document.createElement('video');
let bot = document.querySelector('.bot');
let ROOM_ID = localStorage.getItem('roomId');
let audioCtx = new (AudioContext || window.webkitAudioContext)();
let source;
Music['_playing'] = false;
Music.autoplay = true;
let users=[];
const _socket = io(`http://localhost:9000/`);

const activateBot = () => {
    if(!bot.classList.contains('active'))
        bot.classList.add('active');
}

const deactivateBot = () => {
    if(bot.classList.contains('active'))
        bot.classList.remove('active');
}

Music.addEventListener('loadeddata', () => {
    Music['_playing'] = true;
    Music.play();
})

Music.addEventListener('waiting', deactivateBot);
Music.addEventListener('play', activateBot);
Music.addEventListener('playing', activateBot);
Music.addEventListener('pause', deactivateBot);
Music.addEventListener('resume', activateBot);
Music.addEventListener('abort', deactivateBot);
Music.addEventListener('suspend', deactivateBot);
Music.addEventListener('close', deactivateBot);


_socket.emit('join:room', ROOM_ID);
_socket.on('joined', () => {
    // testDiv.innerHTML = '<h1>JOINED</h1>';
    console.log(`JOINED`);
})
_socket.on('music:buffer', (data) => {
    console.log(data);
})
_socket.on('user:connected', (userId) => {
    users.indexOf(userId) < 0 ? users.push(userId) : console.log('exist');
})


_socket.on('cli:error', error => {
    console.log(error);
})
/*
_socket.emit('cli:req', {
    line:'$play meet me at our spot',
    roomId: '101',
})
*/
_socket.on('cli:music:url', async (data) => {
    console.log(data);
    // testDiv.innerText = `Current Song By: ${data.title}`;
    // musicImage.src=data.image;
    Music.src=data.musicUrl;
})

document.getElementById('message-textbox').addEventListener('keypress', (evt) => {
    if (evt.key == 'Enter') {
        console.log('Enter Chat');
        _socket.emit('cli:req', {
            roomId: ROOM_ID,
            line: evt.target.value,
            username: localStorage.getItem('username'),
            userId: _socket.id,
        })
    }
});

