// chat related DOM
let chatBox = document.getElementById('chatBox');
let messageText = document.getElementById('message-textbox');
let sendMessageBtn = document.getElementById('sendMessageBtn');

// HELP CONTAINER DOM
let helpBox = document.getElementById('helpBox');
let definitionBox = document.getElementById('wordDefinition');
let imageRequestLink = document.getElementById('imageUrlRequestLink');

//word div
let wordDiv = document.getElementById('gameWord');

//game-Round-Display DIV
let gameRoundDisplay = document.getElementById('gameRoundDisplay');

// username div
//document.querySelector('.username').innerText = sessionStorage.getItem('username');

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

let commentBtns = document.getElementById('CommentsContainer');
document.getElementById('likeDrawing').addEventListener('click', handleComment);
document.getElementById('dislikeDrawing').addEventListener('click', handleComment);

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
    'WAIT_FOR_ENOUGH_PLAYERS': 19,
    'IMAGE_URL': 20,
    'DRAW_COMMENT': 21,
};

const CHANGE_STARFIELD_SPEED = (speed) => {
    /*
    try {
        ChangeSettings({
            speed,
        });
    } catch (e) {
        console.log('failed to change stars speed')
    }
    */
}

// message handler
let messageHandler = {};

function switchCommentStyle(evt) {}

function handleComment(evt) {
    !commentBtns.classList.contains('done') ? commentBtns.classList.add('done') : console.log('comment passed');
    if (socket.OPEN) {
        let message = {
            roomId: sessionStorage.getItem('roomId'),
            username: sessionStorage.getItem('username'),
            type: typeMessage['DRAW_COMMENT'],
            message: evt.target.getAttribute('id')
        };
        try {
            const message_string = JSON.stringify(message);
            socket.send(message_string);
        } catch (e) {
            console.log(e.message);
        }
    }
}

messageHandler.I_H = (links) => {
    if (links) {
        let ImageLoadedCounter = 0;
        overlayContentBox.innerHTML = '';
        if (!overlay.classList.contains('active')) {
            overlay.classList.add('active');
        }
        if (!overlayContentBox.classList.contains('help')) {
            overlayContentBox.classList.add('help');
        }
        overlayHeading.innerText = '5';

        for (let loop = 0; loop < 2; loop++) {
            let imgBlock = document.createElement('img');
            imgBlock.src = '' + links[loop];
            imgBlock.classList.add('overlay-help-image-block');

            // check if image is fully rendered or not
            /*********
            imgBlock.addEventListener('load', (e) => {
                ImageLoadedCounter += 1;
                console.log('image loaded');
                console.log('image_display_count_down: ' + ImageLoadedCounter);
            });
            ****/

            imgBlock.onload = (e) => {
                ImageLoadedCounter += 1;
                overlayContentBox.insertAdjacentElement('beforeend', imgBlock);
            };

            // embed image block to overlayMainContent
            // overlayContentBox.insertAdjacentElement('beforeend', imgBlock);
        }

        let intervalCounter = 5;
        let help_interval = setInterval(() => {
            if (ImageLoadedCounter >= 2) {
                intervalCounter -= 1;
                console.log(intervalCounter);
            }
            overlayHeading.innerText = '' + intervalCounter;
            if (intervalCounter <= 0) {
                console.log('image_interval_cleared');
                overlayHeading.innerText = '';
                overlayContentBox.innerHTML = '';
                overlayContentBox.classList.remove('help');
                overlay.classList.remove('active');
                clearInterval(help_interval);
                definitionBox.innerText = '';
            }
        }, 1000);

    } else {
        // not links received by server-side    
    }
};

/********************
 * <div><img src='https://avatars.dicebear.com/api/identicon/sankalp.svg' /> :- number plz</div>
    <div><img src='https://avatars.dicebear.com/api/identicon/piyush.svg' /> :- get lost</div>
 */

messageHandler.newChat = (data) => {
    let chat = document.createElement('div');

    // user chat type 
    if (data.type == typeMessage.CHAT) {
        console.log(data);
        chat.style.color = 'white';
        chat.innerHTML = `<img src='https://avatars.dicebear.com/api/identicon/${data.username}.svg' /> :- ${data.message} `;
    }

    // system chat type
    if (data.type == typeMessage.GUSSED) {
        guessAudio.play();
        chat.innerHTML = `<img src='https://avatars.dicebear.com/api/bottts/freddy.svg' /> :- ${data.message}`;
        chat.innerText = data.message;
        chat.style.color = 'yellow';
        chat.style.fontFamily = 'roboto';
    }

    if (data.type == 'server') {
        chat.innerHTML = `<img src='https://avatars.dicebear.com/api/bottts/freddy.svg' /> :- ${data.message}`;
        typeof(data['color']) == 'string' ? chat.style.color = data['color']: chat.style.color = 'yellow';
        chat.style.fontFamily = 'roboto';
    }

    // embed html element
    chatBox.insertAdjacentElement('beforeend', chat);
    chatBox.scrollTo = chatBox.scrollHeight;
};

messageHandler.setWordImages = (images) => {
    // set data to tooltips
    console.log('IMAGE URLS: ', images);
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
    document.getElementById('wordDefinition').innerText = '';
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
            let avatarUrl = `https://avatars.dicebear.com/api/identicon/${player.username}.svg`;
            let playerDiv = `<div><img src='${avatarUrl}' />  ${player.username}: ${player.score}</div>`;
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
        let Div = `<div class="overlayContentDiv"><img class='user-avatar' src='https://avatars.dicebear.com/api/identicon/${player.username}.svg' /> ${player.username}</div>`;
        overlayContentBox.insertAdjacentHTML('beforeend', Div);
    });

    document.getElementById('copyLinkBtn').addEventListener('click', () => {
        navigator.clipboard.writeText('' + data.link).then(() => {
            console.log('copied');
        });
    });
    if (sessionStorage.getItem('username') == data.host && data.players.length > 1) {
        let startBtn = document.getElementById('startGameBtn');
        if (!startBtn.classList.contains('active')) {
            startBtn.classList.add('active');
        }
        startBtn.addEventListener('click', () => {
            let user = {
                id: sessionStorage.getItem('roomId'),
                username: sessionStorage.getItem('username')
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
            // console.log('You cant start match');
        }
        callback(false);
    }
};

messageHandler.startGame = (data) => {
    if (overlay.classList.contains('active')) {
        overlay.classList.remove('active');
    }
    startAudio.play();
    CHANGE_STARFIELD_SPEED(7);
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


let definitionRequest = async(word, data) => {
    const word_meaning = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en_US/${word}`, data);
    return word_meaning.json();
};


let extract_meaning = (word, data) => {
    let choosen_word = document.getElementById('gameWord').innerText;

    let definition = definitionRequest(word, data)
        .then(data => {

            definitionBox.innerText = `${data[0].meanings[0].definitions[0].definition}`;

            console.log(data[0].meanings[0].definitions[0].definition);
        });
};




messageHandler.chooseWord = (list, callback) => {
    CHANGE_STARFIELD_SPEED(4);
    let user = {
        id: sessionStorage.getItem('roomId'),
        username: sessionStorage.getItem('username')
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
            if (!helpBox.classList.contains('active')) {
                helpBox.classList.add('active');

            }
            sub_send_word(returnMsg);
            extract_meaning(evt.target.innerText, {});
        });
    });

    setTimeout(() => {
        if (!__CHOOSEN) {
            sub_send_word(returnMsg);
            extract_meaning(returnMsg.message, {});
        }
        setTimeout(() => {
            definitionBox.innerText = '';
            if (helpBox.classList.contains('active')) {
                helpBox.classList.remove('active');
            }
        }, 15 * 1000);
    }, 10 * 1000);

};

messageHandler.callGameOver = (list) => {
    CHANGE_STARFIELD_SPEED(3);
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
        player.innerText = list[index].username + ': ' + list[index].score;
        player.innerHTML = `<img class='user-avatar' src='https://avatars.dicebear.com/api/identicon/${list[index].username}.svg' />` + player.innerHTML;
        overlayContentBox.insertAdjacentElement('beforeend', player);
    }

    setTimeout(() => {
        sessionStorage.clear();
        overlay.classList.add('celebration');
    }, 1500);
};

messageHandler.waitForPlayerToChoose = (username) => {
    CHANGE_STARFIELD_SPEED(4);
    tools.display = 'none';
    wordDiv.innerText = '';
    if (!overlay.classList.contains('active')) {
        overlay.classList.add('active');
    }
    overlayHeading.innerText = username + ' is choosing word';
    overlayHeading.innerHTML = `<img class='user-avatar' src='https://avatars.dicebear.com/api/identicon/${username}.svg' />` + overlayHeading.innerHTML;
    overlayContentBox.innerHTML = '';
};

messageHandler.guessWord = (username, count) => {
    CHANGE_STARFIELD_SPEED(4);
    if (overlay.classList.contains('active')) {
        overlay.classList.remove('active');
    }
    startAudio.play();
    if (sessionStorage.getItem('username') !== username) {
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

    overlayHeading.innerText = 'Guess Results';
    overlayContentBox.innerHTML = '';

    sorted_data.forEach((player) => {
        let playerDiv = document.createElement('div');
        playerDiv.innerHTML = `<img class='user-avatar' src='https://avatars.dicebear.com/api/identicon/${player.username}.svg' /> :- ${player.username} : ${player.current_score}`;
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
    console.log(data);
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

// gen request for images
imageRequestLink.addEventListener('click', (e) => {
    e.preventDefault();
    let t_m = messageHandler.genMessage(typeMessage.IMAGE_URL, {
        id: sessionStorage.getItem('roomId'),
        username: sessionStorage.getItem('username'),

    }, null);

    sendRawToServer(t_m);

    setTimeout(() => {
        if (helpBox.classList.contains('active')) {
            helpBox.classList.remove('active');
        }
    }, 500);
});

function catch_closer() {
	let dom = document.querySelector('.xX-catcher-Xx');
    
    console.log(dom.animate([ { transform: 'scale(1)' } ], { duration: 300}));
	
    if(dom.classList.contains('vis'))
		dom.classList.remove('vis');

}

function xx_catch_xx(err) {
	let r = document.querySelector(':root');
	let rs = getComputedStyle(r);
	
	let color = err['t'] == 'ERR' 
		? '#c45e29f4' 
		: (err['t'] == 'INFO' 
			? '#0078d4f4' : '#407855f4');
			
	let dom = document.querySelector('.xX-catcher-Xx');
	document.querySelector('.xX-catcher-Xx-a').innerHTML = `<span>${err['heading']}</span><i class="fas fa-window-close" onclick="catch_closer();"></i>`;
	document.querySelector('.xX-catcher-Xx-l').innerHTML = `<div class="xX-catcher-Xx-a"></div><div class="xX-catcher-Xx-l">${err['message']}</div>`;
	dom.style.backgroundColor=color;
	if(!dom.classList.contains('vis'))
		dom.classList.add('vis');
}



setTimeout(() => xx_catch_xx({
	t: 'INFO',
	heading: 'Welcome',
	message: '$skip: cmd not found',
}), 2000);

