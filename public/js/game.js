// connection object
let socket = null;
let roomId = localStorage.getItem('roomId');
let username = localStorage.getItem('username');

let USER = {
    id: roomId,
    username: username
};

// socket = new WebSocket('wss://' + window.location.hostname + '/join?id=' + roomId + '&username=' + username);
socket = new WebSocket('ws://localhost:4000/join?id=' + roomId + '&username=' + username);

let sendRawToServer = (msg) => {
    if (socket) {
        msg = JSON.stringify(msg);
        socket.send(msg);
    }
};

// play with socket
if (socket !== null) {
    console.log('connected');
    socket.onmessage = (evt) => {
        let parsedData = JSON.parse(evt.data);
        if (localStorage.getItem('roomId') == parsedData.roomId) {
            switch (parsedData.type) {
                case typeMessage.NEW_CONNECTION:
                    messageHandler.newChat(parsedData);
                    break;
                case typeMessage.DISCONNECTED:
                    messageHandler.newChat(parsedData);
                    break;
                case typeMessage.CANVAS._HISTORY:
                    messageHandler.processCanvasHistory(parsedData.message);
                    break;
                case typeMessage.CHAT:
                    messageHandler.newChat(parsedData);
                    break;
                case typeMessage.GUSSED:
                    messageHandler.newChat(parsedData);
                    break;
                case typeMessage.SCORE:
                    messageHandler.showPlayerList(parsedData);
                    break;
                case typeMessage.WAIT:
                    messageHandler.showPlayerJoinedGame(parsedData.message, (start) => {
                        if (start) {
                            sendRawToServer(start);
                        }
                    });
                    break;
                case typeMessage.START:
                    messageHandler.startGame(parsedData.message);
                    break;
                case typeMessage.JOIN_LATER:
                    messageHandler.joinLater(parsedData.message);
                    break;
                case typeMessage.CHOOSE_WORD:
                    (() => {
                        if (parsedData.from == localStorage.getItem('username')) {
                            messageHandler.chooseWord(parsedData.message, (wordMsg) => {
                                sendRawToServer(wordMsg);
                            });
                        } else {
                            messageHandler.waitForPlayerToChoose(parsedData.from);
                        }
                    })();
                    break;
                case typeMessage.GAME_OVER:
                    messageHandler.callGameOver(parsedData.message);
                    break;
                case typeMessage.DRAWING:
                    messageHandler.guessWord(parsedData.from, parsedData.message);
                    break;
                case typeMessage.GUESS_RESULT:
                    messageHandler.showGuessResult(parsedData.message);
                    break;
                case typeMessage.GAME_COUNT_DOWN:
                    messageHandler.displayCounter(parsedData.message);
                    break;
                case typeMessage.CANVAS._DRAW:
                    messageHandler.drawCoords(parsedData.message);
                    break;
                case typeMessage.CANVAS._CLEAR:
                    messageHandler.clearCoords(parsedData.message);
                    break;
                case typeMessage.CANVAS._ERASE:
                    messageHandler.eraseCoords(parsedData.message);
                    break;
                case typeMessage.NEW_ROUND:
                    messageHandler.newRound(parsedData.message);
                    break;
                case typeMessage.WAIT_FOR_ENOUGH_PLAYERS:
                    messageHandler.notEnoughPlayers(parsedData.message);
                    break;
            };
        }
    };
}


let chatBuddy = (evt) => {
    evt.preventDefault();
    let message = messageText.value;
    messageText.value = '';
    message = message.trim().length > 0 ? message.trim() : false;
    if (message) {
        let chat = messageHandler.genMessage(typeMessage.CHAT, USER, message);
        if (socket !== null) {
            chat = JSON.stringify(chat);
            socket.send(chat);
        }
    }
}

// chat with other users
sendMessageBtn.addEventListener('click', chatBuddy);

document.getElementById('message-textbox').addEventListener('keydown', (evt) => {
    if(evt.key == 'Enter'){
        console.log('Enter Chat');
        chatBuddy(evt);
    }
});

