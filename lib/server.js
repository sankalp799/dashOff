const http = require('http');
const ws = require('ws');
const path = require('path');
const url = require('url');
const { StringDecoder } = require('string_decoder');
const _config = require('../config');

console.log(_config);


// import developer library
// const _config = require('./config');
const _room = require('./room');
const _color = require('./color');
const _dev = require('./dev');
const _handler = require('./handler');
const _message = require('./typeMessage');
const dev = require('./dev');
const { parse } = require('path');

let PORT = _config.PORT;
let HOST = _config.URL.ORIGIN;
let Server = {};
let rooms = [];

//http server mainFunction
let mainServer = (req, res) => {

    // get requested url
    let parsedUrl = url.parse(req.url, true);

    //get path requested
    let urlPath = parsedUrl.pathname;
    urlPath = urlPath.replace(/^\/+|\/+$/g, '');

    //query
    let queryString = parsedUrl.query;

    //get req method
    let method = req.method;

    //decode payload
    let decoder = new StringDecoder('UTF-8');
    let dataBuffer = '';

    req.on('data', (data) => {
        dataBuffer += decoder.write(data);
    });

    req.on('end', () => {
        dataBuffer += decoder.end();

        let data = {
            method: method,
            path: urlPath,
            query: queryString,
            payload: _dev.parseJsonObject(dataBuffer)
        };

        // picking up handler
        let handler = typeof(Server.router[urlPath]) !== 'undefined' ? Server.router[urlPath] : _handler.notFound;

        // for public files
        handler = urlPath.indexOf('public/') > -1 ? _handler.public : handler;

        handler(data, (status, payload, ctype) => {
            status = typeof(status) == 'number' ? status : 200;
            ctype = typeof(ctype) !== 'undefined' ? ctype : 'json';
            let resPayload = '';

            switch (ctype) {
                case 'json':
                    (
                        () => {
                            resPayload = typeof(payload) == 'object' && payload !== null ? payload : {};
                            resPayload = JSON.stringify(resPayload);
                            res.setHeader('Content-Type', 'application/json');
                        }
                    )();
                    break;
                case 'html':
                    (
                        () => {
                            resPayload = typeof(payload) == 'string' ? payload : '';
                            res.setHeader('Content-Type', 'text/html');
                        }
                    )();
                    break;
                case 'css':
                    (
                        () => {
                            resPayload = typeof(payload) !== 'undefined' ? payload : '';
                            res.setHeader('Content-Type', 'text/css');
                        }
                    )();
                    break;
                case 'js':
                    (
                        () => {
                            resPayload = typeof(payload) !== 'undefined' ? payload : '';
                            res.setHeader('Content-Type', 'text/javascript');
                        }
                    )();
                    break;
                case 'jpg':
                    (
                        () => {
                            resPayload = typeof(payload) !== 'undefined' ? payload : '';
                            res.setHeader('Content-Type', 'image/jpeg');
                        }
                    )();
                    break;
                case 'gif':
                    (
                        () => {
                            resPayload = typeof(payload) !== 'undefined' ? payload : '';
                            res.setHeader('Content-Type', 'image/gif');
                        }
                    )();
                    break;
                case 'png':
                    (
                        () => {
                            resPayload = typeof(payload) !== 'undefined' ? payload : '';
                            res.setHeader('Content-Type', 'image/png');
                        }
                    )();
                    break;
                case 'cur':
                    (
                        () => {
                            resPayload = typeof(payload) !== 'undefined' ? payload : '';
                            res.setHeader('Content-Type', 'image/cur');
                        }
                    )();
                    break;
                case 'favicon':
                    (
                        () => {
                            resPayload = typeof(payload) !== 'undefined' ? payload : '';
                            res.setHeader('Content-Type', 'image/x-icon');
                        }
                    )();
                    break;
                case 'mp3':
                    (
                        () => {
                            resPayload = typeof(payload) !== 'undefined' ? payload : '';
                            res.setHeader('Content-Type', 'audio/mpeg');
                        }
                    )();
                    break;
                default:
                    (
                        () => {
                            resPayload = typeof(payload) !== 'undefined' ? payload : '';
                            res.setHeader('Content-Type', 'text/plain');
                        }
                    )();
            };
            res.writeHead(status);
            res.end(resPayload);
        });
    });
};

//creating http server
Server.httpServer = http.createServer((req, res) => {
    mainServer(req, res);
});


// creating full-duplex connection
let server = Server.httpServer;
let WebSocketServer = new ws.Server({ server });
WebSocketServer.on('connection', (socket, request) => {
    let joined = false;

    // holds username and roomid
    let data = _dev.fetchQuery(request.url);
    let joined_room_index = -1;
    // add player to specific room
    rooms.forEach((element) => {
        if (element.roomId == data.id) {
            joined_room_index = rooms.indexOf(element);
            if (!element.playing) {
                joined = element.addPlayer(request.socket.remotePort, data.username);
                if (joined) {

                    _dev.checkGameState(element, data, msg => {
                        if (msg) {
                            Server.broadcastMessage(msg, socket, true);
                        }
                    });

                }
            } else {
                // let joinLaterMsg = _dev.createMessage(_message.JOIN_LATER, data, "GAME IS ALREADY BEEN STARTED");
                // Server.broadcastMessage(joinLaterMsg, socket, null);
                joined = element.addPlayer(request.socket.remotePort, data.username);
                if (joined_room_index > -1) {
                    // CANVAS HISTORY
                    let canvas_history_message = _dev.createMessage(_message.CANVAS._HISTORY, { id: rooms[joined_room_index].roomId, username: null }, rooms[joined_room_index].history);
                    Server.broadcastMessage(canvas_history_message, socket, null);

                    // GUESS WORD WITH LENGTH
                    let start_guessing_message = _dev.createMessage(_message.DRAWING, { id: rooms[joined_room_index].roomId, username: rooms[joined_room_index].playerDrawing.username }, rooms[joined_room_index].word.length);
                    Server.broadcastMessage(start_guessing_message, socket, null);
                }
            }
        }
    });

    // broadcast connected player connection msg
    if (joined) {
        let playerlist = null;
        console.log(_color.fg.Green, `[CONNECTION] NEW PLAYER CONNECTED ON PORT: ${request.socket.remotePort} TO ROOM - ${data.id}`);

        // creating message for new connection and send to users
        let connectionMessage = _dev.createMessage(_message.NEW_CONNECTION, data, data.username + ' JOINED');
        Server.broadcastMessage(connectionMessage, socket, false);

        // broadcasting players list
        _dev.fetchPlayerScore(rooms, data, (error, data) => {
            if (!error && data) {
                playerlist = data.message;
                Server.broadcastMessage(data, socket, true);
            } else {
                console.log(_color.fg.Red, error);
            }
        });
    }

    //message handler
    socket.addEventListener('message', evt => {

        let parsedData = _dev.parseJsonObject(evt.data);
        switch (parsedData.type) {
            // IN CASE USER WANT TO CHAT 
            case _message.CHAT:
                (() => {
                    let room_index = -1;
                    rooms.forEach(room => {
                        if (room.roomId == parsedData.roomId) {
                            room_index = rooms.indexOf(room);
                            console.log(`[room_started] ${rooms[room_index].playing}`);
                            if (!rooms[room_index].playing) {
                                // pass message
                                Server.broadcastMessage(parsedData, socket, true);
                            } else {
                                Server.processMessage(parsedData, socket, room_index, (state, message) => {
                                    if (state && message) {
                                        Server.broadcastMessage(message, socket, true);
                                    }
                                });
                            }
                        }
                    });
                })();

                break;
            case _message.CANVAS._DRAW:
                (() => {
                    // console.log(parsedData.message);
                    Server.broadcastMessage(parsedData, socket, false);
                    Server.saveToHistory(parsedData);
                })();
                break;
            case _message.CANVAS._CLEAR:
                (() => {
                    console.log('clear_canvas_request_generated');
                    Server.broadcastMessage(parsedData, socket, false);
                    Server.saveToHistory(parsedData);
                })();
                break;
            case _message.CANVAS._ERASE:
                (() => {
                    Server.broadcastMessage(parsedData, socket, false);
                    Server.saveToHistory(parsedData);
                })();
                break;

            case _message.IMAGE_URL:
                (() => {
                    let id = parsedData.roomId;
                    let U_M = dev.createMessage(_message.IMAGE_URL, data, false);
                    rooms.forEach(room => {
                        if (room.roomId == id) {
                            if (room.urls.length > 0 && !room.help) {
                                room.help = true;
                                U_M.message = room.urls;
                            }
                        }
                    });

                    Server.broadcastMessage(U_M, socket, null);
                })();
                break;

                // IN CASE WORD CHOOSEN BY PLAYER
            case _message.WORD:
                (() => {
                    // save choosen word from player
                    let roomIndex = -1;
                    _dev.setRoomWord(parsedData, rooms, (room_index) => {
                        if (room_index > -1) {
                            roomIndex = room_index;
                        }
                    });

                    // SET URLS TO ROOM
                    _dev.setRoomUrls(rooms[roomIndex].word, (__data) => {
                        if (__data) {
                            // console.log(__data);
                            rooms[roomIndex].urls = __data;

                            // BROADCAST URL LIST
                            // let image_url_message = _dev.createMessage(_message.IMAGE_URL, data, __data);
                            // Server.broadcastMessage(image_url_message, socket, null);
                        }
                    });


                    // send resume msg to other players
                    let resumeMsg = _dev.createMessage(_message.DRAWING, data, parsedData.message.toString().length);
                    Server.broadcastMessage(resumeMsg, socket, false);

                    // get room index
                    Server.PlayGame(socket, parsedData.roomId, roomIndex);
                })();
                break;

                // IN CASE TO START THE GAME
            case _message.START:
                _dev.startGame(rooms, parsedData, (start) => {
                    if (start) {
                        Server.broadcastMessage(start, socket, true);
                        Server.sendWordsList(socket, parsedData.roomId, true);
                    }
                });
                break;
            case _message.DRAW_COMMENT:
                (async() => {
                    rooms.forEach(r => {
                        if (r.roomId == parsedData.roomId) {
                            console.log(parsedData);
                            let comment_id = parsedData['message'];
                            if (comment_id && r.playing) {
                                if (r.playerDrawing !== null) {
                                    if (r.playerDrawing['username'] != parsedData['username']) {
                                        let sender = parsedData['username'];
                                        Server.broadcastMessage({
                                            roomId: parsedData['roomId'],
                                            type: 'server',
                                            color: parsedData['message'] == 'likeDrawing' ? 'green' : 'red',
                                            message: parsedData['message'] == 'likeDrawing' ? `${sender} liked drawing` : `${sender} disliked drawing`
                                        }, socket, false);
                                    }
                                }
                            }
                        }
                    })
                })();
        };
    });

    // client disconnect event listener
    socket.on('close', () => {
        let data = _dev.fetchQuery(request.url);
        let playerleft = null;
        let room_index = -1;
        rooms.forEach(element => {
            if (element.roomId == data.id) {
                room_index = rooms.indexOf(element);
                // CHECK PLAYER WAS DRAWING OR NOT
                /*
                if (element.players[element.turn].port == request.socket.remotePort) {
                    Server.setNextTurn(socket, data.id);
                    clearInterval(element.gameInterval);
                }
                */

                // remove specific player by port number
                playerleft = element.removePlayer(request.socket.remotePort);
                _dev.checkGameState(element, data, msg => {
                    if (msg) {
                        Server.broadcastMessage(msg, socket, true);
                    }
                });
            }
        });

        // check if player data is been removed or not
        if (playerleft !== null) {

            // gen message that player left
            let leftMessage = _dev.createMessage(_message.DISCONNECTED, data, playerleft.username + ' LEFT');
            // broadcast data of left player
            Server.broadcastMessage(leftMessage, socket, false);

            // CHECK DRAWING_PLAYER DATA
            if (room_index > -1) {
                if (rooms[room_index].players.length == 1) {
                    // CALL GAME OVER   
                    if (rooms[room_index].gameInterval !== null) clearInterval(rooms[room_index].gameInterval);
                    let WAIT_FOR_PALYERS_MSG = dev.createMessage(_message.WAIT_FOR_ENOUGH_PLAYERS, { id: rooms[room_index].roomId, username: null },
                        'NOT ENOUGH PLAYERS TO PLAY THE GAME');
                    Server.broadcastMessage(WAIT_FOR_PALYERS_MSG, socket, true);
                    // rooms.splice(room_index, 1);
                } else if (rooms[room_index].playing && rooms[room_index].players.length > 1) {
                    // drawing player left the game
                    if (rooms[room_index].playerDrawing.port == playerleft.port) {
                        // call next turn and clear gameinterval
                        clearInterval(rooms[room_index].gameInterval);
                        Server.setNextTurn(socket, data.id);
                    }
                } else if (rooms[room_index].players.length < 1) {
                    clearInterval(rooms[room_index].gameInterval);
                    let p_sl = dev.sortPlayerByScore(rooms[room_index].players);
                    let g_om = dev.createMessage(_message.GAME_OVER, data, p_sl);
                    Server.broadcastMessage(g_om, socket, true);
                    rooms.splice(room_index, 1);
                }
            }


            // update score after player leaving room
            // and broadcast score data to player left in room
            dev.fetchPlayerScore(rooms, data, (error, data) => {
                if (!error) {
                    Server.broadcastMessage(data);
                } else {
                    console.log(_color.fg.Red, error);
                }
            });
        }
        console.log(_color.fg.Red, '[DISCONNECTED] PLAYER DISCONNECTED FROM PORT:' + request.socket.remotePort + '--' + data.id);
    });
});


Server.goTo_public_toilet = (data, callback) => {
    // join public room here
    console.log('may i go to washroom');
    console.log('go to public toilet ' + data.payload['username']);
};


//Server create room handler

Server.createRoom = (data, callback) => {
    console.log(data.payload);
    if (data.method.toLowerCase() == 'post') {
        if (data.payload['rType'].toString().toLowerCase() == 'join') {
            Server.goTo_public_toilet(data, callback);
        } else {
            let game_rounds = parseInt(data.payload.rounds);
            let round_counter = parseInt(data.payload.counter);
            let rt = 'private';
            let hostUserName = typeof(data.payload.username) == 'string' && data.payload.username.trim().length > 0 ? data.payload.username.trim() : 'host';
            game_rounds = typeof(game_rounds) == 'number' && (game_rounds >= 2 && game_rounds <= 6) ? data.payload.rounds : 3;
            round_counter = typeof(round_counter) == 'number' && (round_counter >= 30 && round_counter <= 120) ? data.payload.counter : 90;
            rt = typeof(data.payload['rType']) == 'string' && data.payload['rType'].length > 4 ? data.payload['rType'] : 'public';
            rt = rt.toLowerCase() == 'public' ? rt : 'private';
            if (hostUserName && round_counter) {
                let roomId = _dev.genId('$');
                if (roomId) {
                    let newRoom = new _room(roomId, hostUserName, round_counter, game_rounds, HOST, PORT, _config.URL.PROTOCOL || 'http', rt);
                    console.log(newRoom.link);
                    // URL SHORTENER CALL
                    /**********/
                    dev.url_shortener(newRoom.link, (error, url) => {
                        if (!error && url) {
                            newRoom.link = url;
                        } else {
                            console.log('[ERROR] url shortener failed');
                            // callback(200, {'link': newRoom.link});
                        }
                    });
                    /***/
                    console.log('[NEW_ROOM] ', newRoom);
                    rooms.push(newRoom);
                    // console.log(newRoom);
                    callback(200, { 'link': newRoom.link });
                } else {
                    _handler.error({ header: '', error: 'could not create room please try again' }, callback);
                }
            } else {
                callback(400, { 'Error': 'Please try with different username' }, 'json');
            }
        }
    } else {
        _handler.error({ header: 'Access Denied', error: 'User Forbidden' }, callback);
    }
};


// Server join room handler
Server.join = (data, callback) => {
    if (data.method.toLowerCase() == 'get') {
        let id = typeof(data.query.id) == 'string' && data.query.id.length > 0 && data.query.id[0] == '$' ? data.query.id : false;
        // let username = typeof(data.)
        if (id) {
            let roomIndex = -1;
            rooms.forEach((element, index) => {
                if (element.roomId == id) {
                    roomIndex = index;
                }
            });
            if (roomIndex > -1) {
                let templateData = null;

                _dev.getTemplate('join', templateData, (error, data) => {
                    if (!error && data) {
                        _dev.applyMasterPage(data, null, (error, masterPage) => {
                            if (!error && masterPage) {
                                callback(200, masterPage, 'html');
                            } else {
                                _handler.error({ header: '500', error: 'Try Again' }, callback);
                            }
                        });
                    } else {
                        _handler.error({ header: '500', error: 'Try Again' }, callback);
                    }
                });
            } else {
                _handler.error({ header: '404', error: 'Room do not exist' }, callback);
            }
        } else {
            _handler.error({ header: 'Access Denied', error: 'User Forbidden' }, callback);
        }
    } else {
        _handler.error({ header: 'Access Denied', error: 'User Forbidden' }, callback);
    }
}

Server.broadcastMessage = (messageObj, socket, all) => {
    let message_string = JSON.stringify(messageObj);

    WebSocketServer.clients.forEach(client => {
        if (all == null) {
            if (client == socket) {
                client.send(message_string);
            }
        } else {
            if (client == socket) {

                if (all) {
                    client.send(message_string);
                }
            } else {

                client.send(message_string);
            }
        }

    });
    /*
    for (key in _message) {
        if (_message[key] == messageObj.type) {
            console.log(_color.fg.Yellow, '[BROADCAST] BROADCASTING - ' + key);
            break;
        }
    }
    */

};


// game logic
// START GAME FROM HERE
Server.PlayGame = (connection, id, roomIndex) => {

    if (rooms[roomIndex].roomId == id) {
        let roundOver = false;

        // SET GAME TURN COUNTER - NUMBER
        let countDown = rooms[roomIndex].roundCounter;
        rooms[roomIndex].gameInterval = setInterval(() => {
                rooms[roomIndex].counterCurrentPos = countDown;

                // MIN-SEC COUNT DOWN OBJECT 
                let timerObj = {
                    min: Math.floor(countDown / 60),
                    sec: Math.floor(countDown % 60)
                };

                // SEND COUNT DOWN TIME LEFT TO PLAYERS
                let counterMsg = _dev.createMessage(_message.GAME_COUNT_DOWN, { id: id, username: null }, timerObj);
                Server.broadcastMessage(counterMsg, connection, true);

                _dev.checkPlayerGusses(rooms[roomIndex].players, (state) => {
                    if (state) {
                        roundOver = true;
                    }
                });

                if (countDown <= 0 || roundOver) {
                    // TIME OUT 
                    Server.setNextTurn(connection, id);
                    // clear game current interval
                    clearInterval(rooms[roomIndex].gameInterval);
                }
                countDown = countDown - 1;
            },
            1000);

    } else {
        console.log(_color.fg.Red, '[EXCEPTION] ROOM ID AND INDEX MISMATCH');
    }
};



Server.sendWordsList = (connection, id, new_round) => {
    let roomIndex = -1;
    rooms.forEach(room => {
        if (room.roomId == id) {
            roomIndex = rooms.indexOf(room);
            room.history = [];
        }
    });

    if (roomIndex > -1) {
        //console.log(_color.fg.Blue, roomIndex + ' - room Index with turn ' + rooms[roomIndex].turn);
        //console.log(rooms[roomIndex].players);
        // send words list

        rooms[roomIndex].playerDrawing = rooms[roomIndex].players[rooms[roomIndex].turn];

        let userToDraw = {
            id: id,
            username: rooms[roomIndex].players[rooms[roomIndex].turn].username
        };

        if (new_round) {
            let NEW_ROUND_MESSAGE = _dev.createMessage(_message.NEW_ROUND, { id: id, username: null }, rooms[roomIndex].current_game_round);
            Server.broadcastMessage(NEW_ROUND_MESSAGE, connection, true);

            setTimeout(() => {
                // PROVIDE LIST OF WORDS TO NEXT PLAYER_LIST[ROOM.TURN]
                Server.sendWordsList(connection, id);
            }, 4000);
        } else {
            let chooseWord = dev.createMessage(_message.CHOOSE_WORD, userToDraw, _dev.wordList(rooms[roomIndex].current_game_round));
            Server.broadcastMessage(chooseWord, connection, true);
        }


    }
};


Server.setNextTurn = (connection, id) => {
    let gameOver = false;
    let roomIndex = -1;
    rooms.forEach(room => {
        if (id == room.roomId) {
            roomIndex = rooms.indexOf(room);

            // CHANGE PLAYER TURN 
            // room.turn = room.turn + 1;
            if (room.turn >= room.players.length - 1 && room.current_game_round >= room.game_rounds) {
                gameOver = true;
            }
            console.log(_color.fg.Green, 'ROUND - ' + rooms[roomIndex].game_rounds);
            //console.log(roomIndex);
            //console.log(rooms[roomIndex].turn, rooms[roomIndex].game_rounds, rooms[roomIndex].playing, rooms[roomIndex].players, rooms[roomIndex].playerDrawing);
        }
    });
    if (!gameOver) {
        let next_round = false;
        if (rooms[roomIndex].turn >= rooms[roomIndex].players.length - 1) {
            rooms[roomIndex].current_game_round = rooms[roomIndex].current_game_round + 1;
            rooms[roomIndex].turn = 0;
            next_round = true;
        } else {
            rooms[roomIndex].turn = rooms[roomIndex].turn + 1;
        }
        Server.guessResult(connection, id, next_round);

    } else {
        // CALL FOR GAME OVER RESULTS
        let playersData = rooms[roomIndex].players;
        playersData = _dev.sortPlayerByScore(playersData);

        // WINNERS ANN
        let _results_data = _dev.createMessage(_message.GAME_OVER, { id: id, username: null }, playersData);
        Server.broadcastMessage(_results_data, connection, true);
    }
};

Server.guessResult = (connection, id, new_round) => {
    let playersData = null;
    let room_index = -1;


    rooms.forEach(room => {
        if (room.roomId == id) {
            playersData = JSON.stringify(room.players);
            room_index = rooms.indexOf(room);
        }
    });

    playersData = JSON.parse(playersData);


    // REMOVE DRAWING PLAYER 
    let guess_result = playersData;
    /***************
    let guess_result = playersData.filter(value => {
        return rooms[room_index].playerDrawing.username !== value.username;
    });
    */


    let guess_result_msg = _dev.createMessage(_message.GUESS_RESULT, { id: id, username: null }, guess_result);
    Server.broadcastMessage(guess_result_msg, connection, true);

    // send word list to next player to choose and draw word
    setTimeout(() => {

        // SET PLAYER GUESSED DEFAULT - FALSE
        rooms[room_index].setPlayerDefault();


        // PROVIDE LIST OF WORDS TO NEXT PLAYER_LIST[ROOM.TURN]
        Server.sendWordsList(connection, id, new_round);


    }, 4000);

};

Server.processMessage = (data, connection, room_index, callback) => {

    // check player is in turn or not
    if (rooms[room_index].playerDrawing.username !== data.username) {
        let message = data.message;
        let gussing_player_index = -1;


        if (message.trim().toLowerCase() == rooms[room_index].word.toLowerCase()) {
            // CAL SCORE HERE
            rooms[room_index].players.forEach(player => {
                if (player.username !== rooms[room_index].playerDrawing.username) {
                    if (player.username == data.username) {
                        gussing_player_index = rooms[room_index].players.indexOf(player);
                    }
                }
            });

            if (!rooms[room_index].players[gussing_player_index].gussed) {
                // console.log('gussed');
                // console.log(rooms[room_index].players);
                let score_share = 0.3;
                rooms[room_index].players[gussing_player_index].current_score = rooms[room_index].counterCurrentPos * 5;
                rooms[room_index].players[gussing_player_index].score += rooms[room_index].players[gussing_player_index].current_score;
                if (rooms[room_index].help) {
                    score_share = 0.1;
                }
                rooms[room_index].players[rooms[room_index].turn].score += Math.floor(rooms[room_index].players[gussing_player_index].current_score * score_share);

                rooms[room_index].players[gussing_player_index].gussed = true;
                data.message = data.username + ' GUSSED.';
                data.type = _message.GUSSED;

                // BROADCAST PLAYERS SCORE LIST HERE
                // DO
                let updated_score = JSON.stringify(rooms[room_index].players);
                updated_score = JSON.parse(updated_score);

                _dev.fetchPlayerScore(rooms, {
                    id: rooms[room_index].roomId,
                    username: null
                }, (error, scoreList) => {
                    if (!error && scoreList) {
                        Server.broadcastMessage(scoreList, connection, true);
                    }
                });
                callback(true, data);
            } else {
                callback(false, false);
            }
        } else {
            if (data.message.trim().toLowerCase().indexOf(rooms[room_index].word.toLowerCase()) > -1) {
                callback(false, false);
            } else {
                callback(true, data);
            }

        }

    } else {
        callback(false, false);
    }

};


Server.check = (data, callback) => {
    console.log(data.payload.username);
    let name = typeof(data.payload.username) == 'string' && data.payload.username.trim().length > 0 ? data.payload.username : false;
    let id = typeof(data.payload.id) == 'string' && data.payload.id.length > 0 && data.payload.id[0] == '$' ? data.payload.id : false;
    //console.log(name, '--', id);
    if (name && id) {
        let err = false;
        rooms.forEach(room => {
            if (id == room.roomId) {
                room.players.forEach(player => {
                    if (player.username == name) {
                        err = true;
                    }
                });
            }
        });
        if (!err) {
            callback(200, { 'Error': 'Valid Username' }, 'json');
        } else {
            callback(400, { 'Error': 'Try with Another Username' }, 'json');
        }
    } else {
        callback(400, { 'Error': 'Provide Username' }, 'json');
    }
};


Server.saveToHistory = (data) => {
    rooms.forEach(room => {
        if (room.roomId == data.roomId) {
            let canvas_coords = {
                data: data.message,
                type: data.type
            };
            room.history.push(canvas_coords);
        }
    });
};



//routers
Server.router = {
    '': _handler.index,
    'create': Server.createRoom,
    'join': Server.join,
    'game': _handler.game,
    'api/check': Server.check,
    'favicon': _handler.favicon,
    // test router
    'gtest': _handler.gtest,
};



// listening to http server
Server.init = () => {
    Server.httpServer.listen(PORT, (error) => {
        if (!error) {
            console.log(_color.fg.Green, `http server running on port: ${PORT}`);
            console.log(_color.fg.Yellow, `http://localhost:${PORT}`);
        }
    });
};

module.exports = Server;