"use strict";
//Change this filename to config.js and fill in the details below
export var config =
  config ||
  (function() {
    var setup = {
      credentials: {
        //get an API key from getpocket.com and place it here
        consumer_key: "YOUR CONSUMER KEY HERE"
      },
      
      app: {
        name: "Pull Tabs"
      }
    };

    return setup;
  })();
