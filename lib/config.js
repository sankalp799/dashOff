let enviornment = {};

enviornment.staging = {
    'PORT': 4000,
    'IP': '192.168.1.4',
    'name': 'default'
};

let choosenEnv = typeof(process.env.NODE_ENV) == 'string' && process.env.NODE_ENV.length > 0 ? process.env.NODE_ENV : '';

let envExport = typeof(enviornment[choosenEnv]) == 'object' && enviornment[choosenEnv] !== null ? enviornment[choosenEnv] : enviornment.staging;

module.exports = envExport;
