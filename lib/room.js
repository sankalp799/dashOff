class room {
    constructor(roomId, host, round_counter, game_rounds, __host, __port) {
        this.roomId = roomId;
        this.host = host;
        // this.link = 'localhost:4000/join?id=' + roomId;
        this.link = 'http://' + __host + '/join?id=' + roomId;
        this.players = [];
        this.turn = false;
        this.word = false;
        this.counterCurrentPos = null;
        this.turn = 0;
        this.playing = false;
        this.playerDrawing = null;
        this.history = [];
        this.roundCounter = new Number(round_counter);
        this.gameInterval = null;
        this.game_rounds = new Number(game_rounds);
        this.current_game_round = 1;
    }

    addPlayer(playerport, username) {
        try {
            this.players.push({
                username: username,
                port: playerport,
                score: 0,
                gussed: false,
                current_score: 0
            });
            return true;
        } catch {
            return false;
        }
    }

    removePlayer(port) {
        let playerLeftIndex = -1;
        this.players.forEach((player, index) => {
            if (player.port == port) {
                playerLeftIndex = index;
            }
        });
        let playerLeft = this.players[playerLeftIndex];
        this.players.splice(playerLeftIndex, 1);
        return playerLeft;
    }

    getPlayersList() {
        return JSON.stringify(this.players);
    }

    updatePlayerScore(playerPort, score) {
        this.players.forEach(player => {
            if (player.port == playerPort) {
                player.score = score;
            }
        });
    }

    setPlayerDefault() {
        this.players.forEach(player => {
            player.gussed = false;
            player.current_score = 0;
        });
    }

    reset() {
        this.turn = 0;
        this.gameInterval = null;
        this.players.forEach(player => {
            player.score = 0;
        });
        this.word = false;
        this.playing = false;
    }
}

module.exports = room;
