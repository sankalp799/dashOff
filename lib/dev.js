const _color = require('./color');
const fs = require('fs');
const path = require('path');
const typeMessage = require('./typeMessage');
const word_categories = require('./fetchWord');
require('dotenv').config();
const request = require('request');
const _config = require('../config');

let dev = {};
dev.templateDir = path.join(__dirname, '/', '../templates/')
dev.staticFileDir = path.join(__dirname, '/', '../public/');


// FUNCTION FOR URL SHORTENER
dev.url_shortener = (destination, callback) => {
    // domin set up
    /*****
    if(['http', 'https'].indexOf(destination) < 0){
        // console.log(dest_protocol);
        destination = 'http://' + destination; 
    }
    // console.log(dest_arr);
    // console.log(['http', 'https'].indexOf(dest_arr[0]));
    console.log(destination);
    */
    let linkReq = {
        destination: destination,
        domain: {
            fullName: "rebrand.ly",
        }
    };

    // request handler
    let req_handler = {
        'Content-Type': 'application/json',
        'apikey': _config.URL_SHORTENER.API_KEY || process.env.URL_SHORTENER_API_KEY,
        // :'workspace': 'My Workspace',
    };

    request({
        uri: 'https://api.rebrandly.com/v1/links',
        method: 'POST',
        body: JSON.stringify(linkReq),
        headers: req_handler
    }, (err, res, body) => {
        // console.log(JSON.parse(body).shortUrl);
        // console.log(err);
        if (!err) {
            let link = dev.parseJsonObject(body);
            console.log(`Long URL was ${link.shortUrl}`);
            callback(false, link.shortUrl);
        } else {
            console.log(err.message);
            try {
                callback(JSON.parse(body).errors[0].message || true);
            } catch (e) {
                callback(true)
            };
        }
    });
};

/****
dev.url_shortener('http://dashoff.herokuapp.com/', (err, url) => {
    console.log(err, url);
});
***/


dev.fetch_images = async(word, callback) => {
    let url = `https://api.unsplash.com/search/photos?query=${word}&client_id=${_config.UNSPLASH.CLIENT_ID || process.env.IMAGE_API_CLIENT_ID}`;

    // request handler
    let req_handler = {
        'Content-Type': 'application/json'
    };

    try {
        await request({
            uri: url,
            method: 'GET',
            headers: req_handler
        }, (err, res, body) => {
            // console.log(JSON.parse(body).shortUrl);
            // console.log(err);
            if (!err) {
                let image_data = dev.parseJsonObject(body);
                callback(false, image_data);
            } else {
                console.log(err.message);
                callback(false);
            }
        });
    } catch (e) {
        callback(false);
        console.log(e.message);
    }
};

// dev.fetch_images('index', (err, data) => {console.log(data.results)});

dev.setRoomUrls = async(word, callback) => {
    await dev.fetch_images(word, (error, data) => {
        if (data && !error) {
            let image_url = [];
            for (let loop = 0; loop < 4; loop++) {
                image_url.push(data.results[loop].urls.small);
            }
            callback(image_url);
        } else {
            callback(false);
        }

    });
};

// dev.setRoomUrls('india', (data) => { console.log(data) });



dev.getTemplate = (page, templateData, callback) => {
    templateData = typeof(templateData) == 'object' && templateData !== null ? templateData : false;
    fs.readFile(dev.templateDir + page + '.html', 'utf8', (error, data_t) => {
        if (!error && data_t) {
            callback(false, data_t);
        } else {
            callback('could not read page');
        }
    });
};


dev.applyMasterPage = (templateData, masterPageData, callback) => {
    dev.getTemplate('header', masterPageData, (error, header) => {
        if (!error && header) {
            dev.getTemplate('footer', masterPageData, (error, footer) => {
                if (!error && footer) {
                    let userPage = header + templateData + footer;
                    callback(false, userPage);
                } else {
                    callback('could not apply master page footer');
                }
            });
        } else {
            callback('could not apply master page header');
        }
    });
};


dev.getPublicFile = (file, callback) => {
    let ext = file.split('.');
    ext = ext[ext.length - 1];
    let file_path = dev.staticFileDir;
    switch (ext) {
        case 'js':
            file_path += 'js/';
            break;
        case 'css':
            file_path += 'css/';
            break;
        default:
            file_path += 'media/';
            break;
    };
    fs.readFile(file_path + file, (error, data) => {
        if (!error && data) {
            callback(false, data);
        } else {
            callback('could not static file - ' + file);
        }
    });
};

dev.parseJsonObject = (string) => {
    try {
        let object = JSON.parse(string);
        return object;
    } catch {
        return {};
    }
};


dev.genId = (prefix) => {
    let select = 'asdfghjklqertyuiopzxcvbmn1234567890';
    let id = '' + prefix;
    try {
        for (let i = 0; i <= 10; i++) {
            id += select.charAt(Math.floor(Math.random() * (select.length)));
        }
        return id;
    } catch {
        return false;
    }
}


dev.fetchQuery = (url) => {
    let urlArr = url.split('&');
    let id = urlArr[0].split('=')[1];
    let username = urlArr[1].split('=')[1];
    return {
        id: id,
        username: username
    };
}


dev.createMessage = (mtype, user, msg) => {
    return {
        type: mtype,
        roomId: user.id,
        from: user.username,
        message: msg
    };
}


dev.fetchPlayerScore = (rooms, user, callback) => {
    let playerlist = null;
    let drawer_port = null;
    rooms.forEach(room => {
        if (user.id == room.roomId) {
            drawer_port = room.playerDrawing;
            playerlist = room.getPlayersList();
        }
    });
    if (playerlist !== null) {
        playerlist = JSON.parse(playerlist);

        // SORT PLAYERS LIST BY THERE SCORE
        let sortedList = dev.sortPlayerByScore(playerlist);
        let scoreMsg = {
            list: sortedList,
            drawing_player_port: drawer_port
        };
        let playerslistmessage = dev.createMessage(typeMessage.SCORE, user, scoreMsg);
        callback(false, playerslistmessage);
    } else {
        callback('could not get players score list');
    }
};


dev.checkGameState = (element, data, callback) => {
    // check game state
    if (!element.playing) {
        let mainMessage = {
            players: element.players,
            host: element.host,
            link: element.link
        };
        let waitMsg = dev.createMessage(typeMessage.WAIT, data, mainMessage);
        callback(waitMsg);
    } else {
        callback(false);
    }
}



dev.startGame = (roomList, data, callback) => {
    let roomIndex = -1;
    roomList.forEach((room, index) => {
        if (room.roomId == data.roomId) {
            roomIndex = index;
        }
    });
    if (roomIndex > -1) {
        // CHECK REQUEST IS FROM HOST OR NOT
        if (roomList[roomIndex].host == data.username) {
            if (!roomList[roomIndex].playing) {
                roomList[roomIndex].playing = true;
                let user = { id: data.roomId, username: data.username };
                let startGameMsg = dev.createMessage(typeMessage.START, user, null);
                callback(startGameMsg);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    } else {
        callback(false);
    }
};


dev.wordList = (curr_round) => {
    let words = [];
    let list = undefined;
    let categories = ['easy', 'medium', 'hard'];

    // select word list according difficulty
    (curr_round >= 1 && curr_round <= 3) ? list = word_categories[categories[curr_round - 1]]: (curr_round % 2) == 0 ? list = word_categories.medium : list = word_categories.hard;

    let div = Math.floor(list.length / 3);
    for (let loop = 0; loop < 3; loop++) {
        words.push(list[Math.floor(Math.random() * div + (div * loop))]);
    }

    return words;
};

dev.setRoomWord = (data, rooms, callback) => {
    let room_index = -1;
    rooms.forEach(room => {
        if (room.roomId == data.roomId) {
            room.word = data.message;
            room.setPlayerDefault();
            room_index = rooms.indexOf(room);
        }
    });
    callback(room_index);
};

dev.sortPlayerByScore = (list) => {
    let sortedList = list.sort((playerA, playerB) => {
        return playerB.score - playerA.score;
    });

    return sortedList;
};


dev.checkPlayerGusses = (list, callback) => {
    let gussed = 0;
    list.forEach(player => {
        if (player.gussed) {
            gussed += 1;
        }
    });
    if (list.length - 1 == gussed) {
        callback(true);
    } else {
        callback(false);
    }
}


dev.genError = (data, callback) => {
    data = typeof(data) == 'object' && data !== null ? data : false;
    if (data) {
        let Error_template_path = path.join(__dirname, '/', '../templates/Error.html');
        fs.readFile(Error_template_path, (err, template_data) => {
            if (!err && template_data) {
                // apply Error data to template here
                let _template_data = template_data.toString();
                for (const key in data) {
                    let find = '%' + key + '%';
                    _template_data = _template_data.replace(find, data[key]);
                }
                callback(false, _template_data);
            } else {
                callback(true);
            }
        });
    } else {
        callback(true);
    }
};

module.exports = dev;