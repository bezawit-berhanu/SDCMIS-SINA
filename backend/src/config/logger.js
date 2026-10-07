//This file contains a centralized logger. 

const logger = {

    //Log normal information messages.
    info(message, metadata = {}) {
        console.log(`[INFO] ${message}`, metadata);
    },

    //Log warnings when something unsual but not necessairyly fatal thing happens.
    warn(message, metadata = {}) {
        console.warn(`[WARN] ${message}, metadata`);
    },

    //Log errors when something has failed.
    error(message, metadata = {}) {
        console.error(`[ERROR] ${message}`, metadata);
    },

    //Log debugging information during development.
    debug(message, metadata = {}) {
        console.debug(`[DEBUG] ${message}`, metadata);
    },
};


//Export the logger so every part of the PAI can use the same logging interface. 
module.exports = logger;