var axios = require("axios").default;

var options = {
    method: 'GET',
    url: 'https://ronreiter-meme-generator.p.rapidapi.com/images',
    headers: {
        'x-rapidapi-host': 'ronreiter-meme-generator.p.rapidapi.com',
        'x-rapidapi-key': 'c12f16cd67mshc79ef292a098030p182cd8jsne0606bacc608'
    }
};

axios.request(options).then(function(response) {
    console.log(response.data);
}).catch(function(error) {
    console.error(error.message);
});