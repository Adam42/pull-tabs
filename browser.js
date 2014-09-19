/*
 * Browser
 *
 * Generic browser object switches between Chrome & Firefox
 * Use this through pullTabs to keep it as browser-agnostic
 * as possible.
 *
 */
var Browser = {

    ENV: '',

    browser: function(){},

    init: function () {
        this.getEnvMode();
        this.browser = this.getBrowser();
        this.getTabs();
        return;
    },

    getEnvMode: function( config ) {
        if(!config){
            if(typeof(pullTabs) === 'undefined'){
                this.getEnvMode(JSON.stringify(
                    [
                        {
                            "consumer_key": "KEY"
                        },
                        {
                            "mode": "DEVELOPMENT"
                        }
                    ]
                ));
                return;
            }
            else if (typeof(this.config) === 'undefined'){
                pullTabs.getConfig( Browser.getEnvMode );
                return;
            }
        }
        if(config){
            this.config = config;
            this.ENV = JSON.parse(config).configuration.mode;
        }
        return;
    },

    getBrowser: function () {
        if(this.ENV === 'DEVELOPMENT'){
            return DevBrowse;
        }
        else if (typeof chrome !=='undefined') {
            return PTChrome;
        }
        else{
            return DevBrowse;
        }
    },

    getTabs: function (tabs) {
        if(!tabs){
            var result = this.browser.getTabs();
            if(result !== 'undefined'){
                return result;
            }
            else{
                return;
            }
        }
        if(tabs){
            return tabs;
        }
    },

    downloadUrls: function (urls) {
        this.browser.downloadUrls(urls);
    },

    login: function ( pocket ) {
        this.browser.login( pocket );
    },

    save: function ( key, object ) {
        this.browser.save( key, object );
    },
};

/*
 * Development Browser
 *
 * Stub in sample API results when in
 * development.
 *
 */
var DevBrowse = {

    downloadUrls: function (urls) {
        urls.forEach(function(url){
            var file = {
                "url": url,
                "method": "GET"
            };
            console.log('Dev downloaded ' + file);
        });
    },

    getTabs: function ( ) {
        return '[{"active":false,"height":779,"highlighted":false,"id":71,"incognito":false,"index":0,"pinned":false,"selected":false,"status":"complete","title":"Dot Boston: Apple, Bicycles, Boston, Dot and Web Media","url":"http://adamp.com/","width":1440,"windowId":68},{"active":false,"height":779,"highlighted":false,"id":83,"incognito":false,"index":1,"pinned":false,"selected":false,"status":"complete","title":"Is It Boston? Find out if your area is part of Boston.","url":"http://isitboston.com/","width":1440,"windowId":68},{"active":false,"height":779,"highlighted":false,"id":85,"incognito":false,"index":2,"pinned":false,"selected":false,"status":"complete","title":"amiacylon.com","url":"http://amiacylon.com/","width":1440,"windowId":68},{"active":true,"height":779,"highlighted":true,"id":91,"incognito":false,"index":3,"pinned":false,"selected":true,"status":"complete","title":"3571814663_5c742efc65_b.jpg (1024×768)","url":"https://c4.staticflickr.com/4/3322/3571814663_5c742efc65_b.jpg","width":1440,"windowId":68}]';
    },
};

/*
 * PullTabs Chrome
 *
 * Wrapper around Google Chrome API.
 * Should only be automatically called via Browser.
 *
 */
var PTChrome = {
    downloadUrls: function (urls) {
        urls.forEach(function(url){
            var file = {
                "url": url,
                "method": "GET"
            };
            var downloads = chrome.downloads.download(file, function(e){
                console.log(e);
            });
        });
    },

    getTabs: function ( callback ) {
        var info = {currentWindow: true};
        chrome.tabs.query(info,function(e){
                if(typeof callback !== 'undefined'){
                    callback(e);
                }
                else{
                   pullTabs.setTabs(e);
                }
        });
    },

    login: function ( pocket ) {

        pocket.auth = pocket.auth + encodeURIComponent(chrome.identity.getRedirectURL());

        pocket.interactive = true;

        var auth = {
            'url': pocket.auth,
            'interactive': pocket.interactive
        };

        chrome.identity.launchWebAuthFlow(auth, function (responseUrl){
            Pocket.getAccessToken(pocket);
        });
    },

    save: function ( key, object ) {
        console.log(key + ' save ' + object);
        if(typeof(chrome.storage) == 'undefined'){
            console.log('ERROR');
        }
        try{
            chrome.storage.local.set( object , function () {
                var status = document.getElementsById('status');
                status.textContent = key + ' saved.';
                setTimeout( function () {
                    status.textContent = '';
                }, 750);
            });
        }
        catch(e){
            console.log(e);
        }
    },

};

//Browser.init('DEV');
if(typeof(Browser.ENV !== 'undefined') && Browser.ENV === 'DEVELOPMENT'){

    console.log("DEFAULT TABS: " + Browser.getTabs());
}
