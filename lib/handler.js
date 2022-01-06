let _dev = require('./dev');
let fs = require('fs');

let handler = {};

handler.index = (data, callback) => {
    let templateData = null;

    _dev.getTemplate('index', templateData, (error, data) => {
        if (!error && data) {
            _dev.applyMasterPage(data, null, (error, masterPage) => {
                if (!error && masterPage) {
                    callback(200, masterPage, 'html');
                } else {
                    callback(500, error, 'html');
                }
            });
        } else {
            callback(500, error, 'html');
        }
    });
};


// test handler for room 
handler.gtest = (data, callback) => {
    let templateData = null;

    _dev.getTemplate('game', templateData, (error, data) => {
        if (!error && data) {
            callback(200, data, 'html');
        } else {
            callback(500, error, 'html');
        }
    });
}



handler.game = (data, callback) => {
    let templateData = null;

    _dev.getTemplate('game', templateData, (error, data) => {
        if (!error && data) {
            callback(200, data, 'html');
        } else {
            callback(500, error, 'html');
        }
    });
};

handler.favicon = (data, callback) => {
    if (data.method == 'get') {
        _dev.getPublicFile('favicon.ico', (error, data) => {
            if (!error && data) {
                callback(200, data, 'favicon');
            } else {
                callback(500);
            }
        });
    } else {
        callback(403, { 'Error': 'User Forbidden' }, 'json');
    }
}


handler.public = (data, callback) => {
    let urlPath = data.path;
    if (data.method.toLowerCase() == 'get') {
        urlPath = urlPath.split('/');
        urlPath = urlPath[urlPath.length - 1];

        _dev.getPublicFile(urlPath, (error, data) => {
            if (!error && data) {
                let ext = urlPath.split('.');
                ext = ext[ext.length - 1];

                callback(200, data, ext);

            } else {
                callback(500, { 'Error': 'could not get public file - ' + urlPath }, 'json');
            }
        });
    } else {
        callback(403, { 'Error': 'User Forbidden' }, 'json');
    }
};

handler.error = (data, callback) => {
    _dev.genError({
        'header': data.header,
        'error': data.error
    }, (error, temp_data) => {
        if (!error && temp_data) {
            callback(200, temp_data, 'html');
        } else {
            callback(500, 'Internal Server Problem', 'plain');
        }
    });
};


handler.notFound = (data, callback) => {
    _dev.getPublicFile('404.gif', (err, publicFileData) => {
        if (!err && publicFileData) {
            callback(200, publicFileData, 'gif');
        } else {
            handler.error({ error: 'NOT FOUND', header: '404' }, callback);
        }
    });
};

module.exports = handler;