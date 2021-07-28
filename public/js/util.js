// chat related DOM
let chatBox = document.getElementById('chatBox');
let messageText = document.getElementById('message-textbox');
let sendMessageBtn = document.getElementById('sendMessageBtn');

//word div
let wordDiv = document.getElementById('gameWord');

//game-Round-Display DIV
let gameRoundDisplay = document.getElementById('gameRoundDisplay');

// username div
//document.querySelector('.username').innerText = localStorage.getItem('username');

//timer
let countDown = document.getElementById('countDown');

// players-list DOM
let playersList = document.getElementById('playersList');

// overlay DOM
let overlay = document.getElementById('overlay');
let overlayHeading = document.getElementById('overlay-heading');
let overlayContentBox = document.querySelector('.overlay-main-content');

// PAINT TOOL BOX
let tools = document.getElementById('paintToolBox').style;


// messageType
let typeMessage = {
    'NEW_CONNECTION': 0,
    'DISCONNECTED': 1,
    'CHAT': 2,
    'CANVAS': {
        '_DRAW': 'CAN_0',
        '_CLEAR': 'CAN_1',
        '_ERASE': 'CAN_2',
        '_HISTORY': 'CAN_H'
    },
    'WORD': 4,
    'SCORE': 5,
    'CORRECT_WORD': 6,
    'CHOOSE_WORD': 7,
    'RESULT': 8,
    'START': 9,
    'WAIT': 10,
    'JOIN_LATER': 11,
    'GAME_OVER': 12,
    'DRAWING': 13,
    'GUESS_RESULT': 14,
    'GAME_COUNT_DOWN': 15,
    'GUSSED': 16,
    'ROUND_OVER': 17,
    'NEW_ROUND': 18,
    'WAIT_FOR_ENOUGH_PLAYERS': 19
};

// message handler
messageHandler = {};

messageHandler.newChat = (data) => {
    let chat = document.createElement('div');
    chat.innerText = '' + data.message;
    if (data.type == typeMessage.CHAT) {
        let Chat_Msg = data.username + ': ' + chat.innerText;
        chat.style.color = 'white';
        chat.style.fontSize = '16px';
        chat.style.paddingBottom = '2px';
        chat.style.paddingTop = '2px';
        chat.innerText = Chat_Msg;
    }
    if (data.type == typeMessage.GUSSED) {
        guessAudio.play();
        chat.innerText = data.message;
        chat.style.color = 'lightgreen';
    }
    chatBox.insertAdjacentElement('beforeend', chat);
    chatBox.scrollTo = chatBox.scrollHeight;
};

messageHandler.notEnoughPlayers = (data) => {
    if (!overlay.classList.contains('active')) {
        overlay.classList.add('active');
    }
    overlayContentBox.innerHTML = '';
    overlayHeading.innerText = '' + data;
    setTimeout(() => {
        window.location.pathname = '/';
    }, 3000);
};

messageHandler.genMessage = (mtype, user, msg) => {
    return {
        type: mtype,
        roomId: user.id,
        username: user.username,
        message: msg
    };
};

messageHandler.newRound = (round) => {
    if (!overlay.classList.contains('active')) {
        overlay.classList.add('active');
    }
    gameRoundDisplay.innerText = 'ROUND ' + round;
    overlayContentBox.innerHTML = '';
    overlayHeading.innerText = 'ROUND ' + round;
};

messageHandler.showPlayerList = (data) => {
    let list = typeof(data.message.list) !== 'undefined' && data.message.list instanceof Array ? data.message.list : false;
    let drawing_player_port = data.message.drawing_player_port !== null ? data.message.drawing_player_port : false;
    if (list) {
        playersList.innerHTML = '';

        // SORT PLAYER LIST BY SCORE
        let sortedList = list.sort((a, b) => {
            return b.score - a.score;
        });

        sortedList.forEach(player => {
            let playerDiv = `<div>${player.username}: ${player.score}</div>`;
            if(drawing_player_port){
                if(drawinplayerDrawing.port == player.port){
                    playerDiv.style.color = 'yellow';
                }
            }
            playersList.insertAdjacentHTML('beforeend', playerDiv);
        });
    }
};


messageHandler.showPlayerJoinedGame = (data, callback) => {
    if (!overlay.classList.contains('active')) {
        overlay.classList.add('active');
    }
    if (!overlayContentBox.classList.contains('active')) {
        overlayContentBox.classList.add('active');
    }

    // copy div
    overlayHeading.innerHTML = `<div id='game-link'>${data.link}</div><div class='copy-link-btn-container'><i class="far fa-clone" id="copyLinkBtn"></i></div>`;
    overlayContentBox.innerHTML = '';
    data.players.forEach((player, index) => {
        let Div = `<div class="overlayContentDiv">${index+1}. ${player.username}</div>`;
        overlayContentBox.insertAdjacentHTML('beforeend', Div);
    });

    document.getElementById('copyLinkBtn').addEventListener('click', () => {
        navigator.clipboard.writeText('' + data.link).then(() => {
            console.log('copied');
        });
    });

    if (localStorage.getItem('username') == data.host && data.players.length > 1) {
        let startBtn = document.getElementById('startGameBtn');
        if (!startBtn.classList.contains('active')) {
            startBtn.classList.add('active');
        }
        startBtn.addEventListener('click', () => {
            let user = {
                id: localStorage.getItem('roomId'),
                username: localStorage.getItem('username')
            };
            let startGameMsg = messageHandler.genMessage(typeMessage.START, user, 'START');
            startBtn.classList.remove('active');
            callback(startGameMsg);
            startAudio.play();
        });
    } else {
        try {
            if (startBtn.classList.contains('active')) {
                startBtn.classList.remove('active');
            }
        } catch {
            // CAUGHT EXCEPTION
            console.log('You cant start match');
        }
        callback(false);
    }
};

messageHandler.startGame = (data) => {
    if (overlay.classList.contains('active')) {
        overlay.classList.remove('active');
    }
    startAudio.play();
};



messageHandler.joinLater = (msg) => {
    if (!overlay.classList.contains('active')) {
        overlay.classList.add('active');
    }
    overlayHeading.innerText = msg;
    setTimeout(() => {
        window.location.pathname = '/';
    }, 3000);
};


messageHandler.chooseWord = (list, callback) => {
    let user = {
        id: localStorage.getItem('roomId'),
        username: localStorage.getItem('username')
    };
    let __CHOOSEN = false;
    let __WORD = list[Math.round(Math.random() * (list.length - 1))];
    let returnMsg = messageHandler.genMessage(typeMessage.WORD, user, __WORD);
    if (!overlay.classList.contains('active')) {
        overlay.classList.add('active');
    }
    if (!overlayContentBox.classList.contains('active')) {
        overlayContentBox.classList.add('active');
    }
    overlayContentBox.innerHTML = '';
    overlayHeading.innerText = 'CHOOSE WORD';


    tools.display = 'flex';

    list.forEach(word => {
        let wordDiv = document.createElement('div');
        wordDiv.innerText = word;
        overlayContentBox.insertAdjacentElement('beforeend', wordDiv);
    });

    let sub_send_word = (msg) => {
        wordDiv.innerText = __WORD;
        if (overlay.classList.contains('active')) {
            overlay.classList.remove('active');
        }
        callback(msg);
        CANVAS_DATA.turn = true;
        startAudio.play();
    };

    overlayContentBox.querySelectorAll('div').forEach(word => {
        word.addEventListener('click', (evt) => {
            returnMsg.message = evt.target.innerText;
            __WORD = evt.target.innerText;
            __CHOOSEN = true;
            sub_send_word(returnMsg);
        });
    });

    setTimeout(() => {
        if (!__CHOOSEN) {
            sub_send_word(returnMsg);
        }
    }, 10 * 1000);
};

messageHandler.callGameOver = (list) => {
    timerAudio.src = window.location.hostname + '/public/Timer_Audio.mp3';
    timerAudio.pause();
    console.log('GAME_OVER');
    if (!overlay.classList.contains('active')) {
        overlay.classList.add('active');
    }
    gameOverAudio.play();
    overlayContentBox.innerHTML = '';
    overlayHeading.innerText = 'Winners';
    for (let index = 0; index < list.length; index++) {
        if (index > 2) {
            break;
        }
        let player = document.createElement('div');
        player.classList.add('overlayContentDiv');
        player.style.fontSize = (140 - (index * 20)) + '%';
        player.innerText = (index + 1) + '. ' + list[index].username + ': ' + list[index].score;
        overlayContentBox.insertAdjacentElement('beforeend', player);
    }
};

messageHandler.waitForPlayerToChoose = (username) => {
    tools.display = 'none';
    wordDiv.innerText = '';
    if (!overlay.classList.contains('active')) {
        overlay.classList.add('active');
    }
    overlayHeading.innerText = username + ' is choosing word';
    overlayContentBox.innerHTML = '';
};

messageHandler.guessWord = (username, count) => {
    if (overlay.classList.contains('active')) {
        overlay.classList.remove('active');
    }
    startAudio.play();
    if (localStorage.getItem('username') !== username) {
        CANVAS_DATA.turn = false;
        let msgDiv = document.createElement('div');
        msgDiv.innerText = username + ' is drawing';
        msgDiv.style.color = 'yellow';
        chatBox.insertAdjacentElement('beforeend', msgDiv);
        tools.display = 'none';
    }
    let word = '';
    for (let i = 1; i <= count; i++) {
        word += '_ ';
    }
    wordDiv.innerText = word;
}

messageHandler.showGuessResult = (data) => {
    timerAudio.src = window.location.hostname + '/public/Timer_Audio.mp3';
    timerAudio.pause();
    clearCanvas(false);
    if (!overlay.classList.contains('active')) {
        overlay.classList.add('active');
    }

    let sorted_data = data.sort((a, b) => {
        return b.current_score - a.current_score;
    });

    overlayHeading.innerText = 'Time Out';
    overlayContentBox.innerHTML = '';

    sorted_data.forEach((player) => {
        let playerDiv = document.createElement('div');
        playerDiv.innerText = (sorted_data.indexOf(player) + 1) + '. ' + player.username + ':  +' + player.current_score;
        overlayContentBox.insertAdjacentElement('beforeend', playerDiv);
    });
};

messageHandler.displayCounter = (data) => {
    if (data.min < 1 && data.sec == 11 && timerAudio !== null) {
        timerAudio.play();
        countDown.style.animationName = 'hurryUp';
    }
    if (data.min < 1 && data.sec < 6) {
        countDown.style.animationDirection = '450ms';
    }
    if (data.min < 1 && data.sec < 4) {
        countDown.style.animationDirection = '300ms';
    }
    if (data.min == data.sec == 0) {
        countDown.style.animationName = '';
    }
    let sec = '' + data.sec;
    let min = '0' + data.min;
    if (data.sec < 10) {
        sec = '0' + data.sec;
    }

    countDown.innerText = min + ':' + sec;
};

messageHandler.drawCoords = (data) => {
    CANVAS_DATA = data;
    CANVAS_DATA.turn = false;
    CANVAS_DATA.drawing = false;
    drawStroke();
}

messageHandler.clearCoords = (data) => {
    CANVAS_DATA = data;
    CANVAS_DATA.turn = false;
    CANVAS_DATA.drawing = false;
    clearCanvas();
};

messageHandler.eraseCoords = (data) => {
    CANVAS_DATA = data;
    CANVAS_DATA.turn = false;
    CANVAS_DATA.drawing = false;
    erase();
};

messageHandler.processCanvasHistory = (coords_Array) => {
    if (coords_Array.length > 0) {
        coords_Array.forEach(coord => {
            switch (coord.type) {
                case typeMessage.CANVAS._DRAW:
                    messageHandler.drawCoords(coord.data);
                    break;
                case typeMessage.CANVAS._CLEAR:
                    messageHandler.clearCoords(coord.data);
                    break;
                case typeMessage.CANVAS._ERASE:
                    messageHandler.eraseCoords(coord.data);
                    break;
            };
        });
    }
};
