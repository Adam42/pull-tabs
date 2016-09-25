//Change this filename to config.js and fill in the details below
var pullTabs = pullTabs || {};
pullTabs.Config = pullTabs.Config || (function () {

    var setup = {
        "credentials" : {
            //get an API key from getpocket.com and place it here
            "consumer_key": "YOUR CONSUMER KEY HERE"
        },

        "configuration" : {
            //DEVELOPMENT is the other mode
            //though it is not very fleshed out
            //and this repo doesn't include node's XMLHttpRequest
            //...you should probably just leave this as is
            "mode": "PRODUCTION"
        },

        "app": {
            "name": "Pull Tabs"
        }
    };

    return setup;

}(pullTabs));