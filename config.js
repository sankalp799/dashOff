require('dotenv').config();
let enviornment = {};

enviornment.staging = {
    'URL':{
        'ORIGIN':'localhost:4000',
        'PROTOCOL': 'http',
    },
    'PORT': 4000,
    'NAME': 'localhost Staging Env',
    'URL_SHORTENER': {
        'API_KEY': process.env.URL_SHORTENER_API_KEY,
    },
    'UNSPLASH':{
        'CLIENT_ID': process.env.IMAGE_API_CLIENT_ID,
    }
};

enviornment.production = {
    'URL': {
        'ORIGIN': 'dashoff.herokuapp.com',
        'PROTOCOL': 'https',
    },
    'NAME': 'Production Env',
    'PORT': process.env.PORT || 4000,
    'URL_SHORTENER': {
        'API_KEY': process.env.API_KEY,
    },
    'UNSPLASH': {
        'CLIENT_ID':process.env.IMAGE_API_CLIENT_ID,
    }
};

let selectEnv = typeof(process.env.DASH_OFF_ENV) == 'string' ? process.env.DASH_OFF_ENV : enviornment.staging;
selectEnv = typeof(enviornment[selectEnv]) == 'object' ? enviornment[selectEnv] : enviornment.staging;

module.exports = selectEnv;

