var config,

pullTabs = {

    init: function() {
        config = this.settings;
        this.getConfig(function(data){
            console.log(data);
        });
    },

    settings: {
        ENV: 'dev',
        configFile: 'config.json',
    },


    getConfig: function ( callback ) {
        var file = config.configFile;

        try{
            var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
            var xhr = new XMLHttpRequest();
//            xhr.overrideMimeType("application/json");
            xhr.open('GET', file, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == "200") {
                    callback(xhr.responseText);
                }
            }
            xhr.send(null);
        }
        catch (e) {
            console.log(e);
        }
    },


};

(function() {
    pullTabs.init();
})();

/*
 * Browser
 *
 * Generic browser object switches between Chrome & Firefox
 * Use this through pullTabs to keep it as browser-agnostic
 * as possible.
 *
 */
var Browser = {

    ENV: 'PROD',

    getEnvMode: function( config ) {
        if(!config){
            pullTabs.getConfig( Browser.getEnvMode );
            return;
        }
        if(config){
            Browser.ENV = JSON.parse(config)['configuration']['mode'];
        }
    },

    getBrowser: function () {
        if(Browser.ENV === 'DEV'){
            return DevBrowse;
        }
        if (!(typeof chrome ==='undefined')) {
            return PTChrome;
        }
        else{
            return DevBrowse;
        }
    },

    getTabs: function (info) {
        var browser = Browser.getBrowser();

        browser.getTabs(info);
    },

    downloadUrls: function (urls) {
        var browser = Browser.getBrowser();

        browser.downloadUrls(urls)
    },

    login: function ( pocket ) {
        var browser = Browser.getBrowser();

        browser.login( pocket );
    },

    save: function ( key, object ) {
         var browser = Browser.getBrowser();
         browser.save( key, object );
    },
};