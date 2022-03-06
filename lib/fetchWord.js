const wordList = require('./words.json');
let easy = [];
let medium = [];
let hard = [];

let set_word_acc_diff = (word) => {
    let diff = wordList[word].difficulty;
    diff <= 45 ? easy.push(word) : (diff >= 70 ? hard.push(word) : medium.push(word));
};

Object.keys(wordList).forEach(word => {
    wordList[word].difficulty = Math.round(wordList[word].difficulty * 100);
    set_word_acc_diff(word);
});

module.exports = { easy, medium, hard };