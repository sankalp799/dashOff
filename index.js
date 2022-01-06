const server = require('./lib/server');
const signalServer = require('./websocket-webrtc/index');
// const cluster = require('cluster');
// const os = require('os');

/*
if(cluster.isMaster){
    for(let core=0; core < os.cpus().length - 2; core++){
        cluster.fork();
    }
}else{
    server.init();
}

*/

server.init();
signalServer();