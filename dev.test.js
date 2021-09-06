const dev = require('./lib/dev');
const Room = require('./lib/room');

test("provide words", () => {
    let text = dev.wordList(3);
    expect(text.length).toEqual(3);
});

test("create room", () => {
    let room = new Room('asdfsadfasdf', 'sankalp', 120, 3, 'localhost:4000', 34590, 'http');
    expect(typeof(room)).toEqual('object');
});