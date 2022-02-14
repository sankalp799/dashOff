let app = {};
app.client = {};

app.config = {};
app.config.username = '';
document.getElementById('getUsername').addEventListener('keydown', (evt) => {
    let text = document.getElementById('userAvatar');
    let val = evt.target.value;
    text.setAttribute('src', `https://avatars.dicebear.com/api/identicon/${val}.svg`)
})


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

app.client.createRoomRequest = (evt, rType) => {
    let createForm = document.getElementById('createRoom');
    let method = createForm.method.toUpperCase();
    let formPath = createForm.action;
    let username = '';

    let formPayload = {};
    formPayload['rType'] = rType;
    let formElements = createForm.elements;
    for (let i = 0; i < formElements.length; i++) {
        if (formElements[i].type == 'submit')
            continue;

        if (formElements[i].name == 'username') {
            username = formElements[i].value;
        }
        formPayload[formElements[i].name] = formElements[i].value;
    }

    // make ajax request for creating room
    app.client.request(method, formPath, formPayload, (status, payload) => {
        let linkDiv = document.getElementById('roomLinkDiv');
        if (status == 200) {
            console.log(payload);
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
}

app.client.handleFormEvent = (evt) => {
    evt.preventDefault();
    let rt = evt.target.getAttribute('value');
    console.log(evt.target, rt);
    app.client.createRoomRequest(evt, rt);
}

try{
    document.getElementById('createRoom').addEventListener('submit', evt => evt.preventDefault());
    document.querySelectorAll('.create-form-submissions input').forEach(si => si.addEventListener('click', app.client.handleFormEvent));
}catch(e){
    console.log(e.message)
}

