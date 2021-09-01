let app = {};

app.client = {};

app.config = {};
app.config.username = '';


if (window.location.pathname.indexOf('join') > -1) {
    console.log('join');
    let joinBtn = document.getElementById('joinGameWithUsername');
    joinBtn.addEventListener('click', () => {
        app.config.username = document.getElementById('getUsername').value;
        let roomId = window.location.href;
        roomId = roomId.split('=')[1];
        app.client.request('POST', 'api/check', { username: app.config.username, id: roomId }, (s, p) => {
            console.log(s, p);
            if (s == 200) {
                sessionStorage.setItem('username', app.config.username);
                sessionStorage.setItem('roomId', roomId);
                window.location.pathname = 'game';
            } else {

                let errorDiv = document.getElementById('joinErrorDiv');
                if (!errorDiv.classList.contains('active')) {
                    errorDiv.classList.add('active');
                }
                errorDiv.innerText = p.Error;
                errorDiv.style.display = 'block';
            }
        });
    });
}

app.client.request = (method, path, payload, callback) => {
    method = typeof(method) == 'string' && method.trim().toLowerCase() == 'post' ? method : false;
    path = typeof(path) == 'string' && path.trim().length > 0 ? path : '/';
    payload = typeof(payload) == 'object' && payload !== null ? payload : {};
    callback = typeof(callback) == 'function' ? callback : null;

    let xhr = new XMLHttpRequest();
    xhr.open(method, path, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    //xhr event
    xhr.onreadystatechange = () => {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            let statusCode = xhr.status;
            let response = xhr.responseText;

            if (callback !== null) {
                try {
                    response = JSON.parse(response);
                    callback(statusCode, response);
                } catch {
                    callback(statusCode, false);
                }
            }
        }
    };

    let payloadString = JSON.stringify(payload);
    xhr.send(payloadString);
};


app.client.createRoomRequest = () => {
    document.querySelector('form').addEventListener('submit', evt => {
        evt.preventDefault();
        let createForm = document.getElementById('createRoom');
        let method = createForm.method.toUpperCase();
        let formPath = createForm.action;
        let username = '';

        let formPayload = {};
        let formElements = createForm.elements;
        for (let i = 0; i < formElements.length; i++) {
            if (formElements[i].type !== 'submit') {
                if (formElements[i].name == 'username') {
                    username = formElements[i].value;
                }
                formPayload[formElements[i].name] = formElements[i].value;
            }
        }

        // make ajax request for creating room
        app.client.request(method, formPath, formPayload, (status, payload) => {
            let linkDiv = document.getElementById('roomLinkDiv');
            if (status == 200) {
                if (username.length > 0) {
                    sessionStorage.setItem('username', username);
                }


                // sessionStorage.setItem('link', payload.link);
                //sessionStorage.setItem('link', payload.link.split('/')[1]);
                let pathName = payload.link.split('/');
                pathName = pathName[pathName.length - 1];
                pathName = pathName.split('=')[1];

                sessionStorage.setItem('roomId', pathName);
                window.location.pathname = '/game';
                /*
                        linkDiv.style.visibility = 'visible';
                        linkDiv.innerText = payload.link;
                
                        linkDiv.addEventListener('click', () => {
                            navigator.clipboard.writeText(payload.link).then(() => {
                                console.log('link coppied');
                            });
                        });
                        */
            } else {
                linkDiv.innerHTML = '<p style="color:red;">' + payload.Error + '</p>';
                linkDiv.style.visibility = 'visible';
                console.log(payload.Error);
            }
        });
    });
}

app.init = () => {
    if (window.location.pathname.indexOf('join') < 0) {
        app.client.createRoomRequest();
    }
}

app.init();
