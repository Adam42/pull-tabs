/*
 * Browser
 *
 * Generic browser object switches between Chrome & Firefox
 * Use this through pullTabs to keep it as browser-agnostic
 * as possible.
 *
 */
var pullTabs = pullTabs || {};
pullTabs.Browser = pullTabs.Browser || {

    ENV: '',

    browser: function(){},

    init: function () {
        this.ENV = pullTabs.Config.configuration.mode;
        this.isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        this.setBrowser();
        if(typeof(localStorage['pullTabsFolderId']) === 'undefined'){
            this.getBookmarks();
        }
        return;
    },

    setBrowser: function () {
        if(this.ENV === 'DEVELOPMENT'){
            this.browser = DevBrowse;
        }
        else if (typeof chrome !=='undefined') {
            this.browser = PTChrome;
        }
        else{
            this.browser = DevBrowse;
        }
    },

    isFile: function(pathname) {
        return pathname
            .split('/').pop()
            .split('.').length > 1;
    },

    getTabs: function (callback) {
        var result = this.browser.getTabs(callback);
        if(result !== 'undefined'){
            return result;
        }
        else{
            return;
        }
    },

    getBookmarks: function ( callback ){
        this.browser.getBookmarks(callback);
    },

    closeTabs: function (tabs){
        this.browser.closeTabs(tabs);
    },

    closeTab: function () {
        this.browser.closeTab(tab);
    },

    bookmarkTabs: function (tabs){
        this.browser.bookmarkTabs(tabs);
    },

    bookmarkTab: function () {
        this.browser.bookmarkTab(tab);
    },

    downloadUrls: function (tabs) {
        this.browser.downloadUrls(tabs);
    },

    login: function ( pocket ) {
        this.browser.login( pocket );
    },

    save: function ( key, object ) {
        this.browser.save( key, object );
    },

    retrieve: function( key, callback ) {
        this.browser.retrieve( key, callback );
    },

    createTab: function ( tabKey ) {
        this.browser.createTab( tabKey );
    },

    store: function ( key, callback ) {
        this.browser.store( key, callback );
    },

    getStorageType: function (){
        this.browser.getStorageType();
    }
};

/*
 * Development Browser
 *
 * Stub in sample API results when in
 * development.
 *
 */
var DevBrowse = {

    downloadUrls: function (tabs) {
        tabs.forEach(function(tab){
            var file = {
                "url": tab.url,
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
    downloadUrls: function (tabs) {
        tabs.forEach(function(tab){

            //advanced mode
            if(tab.labelTabId !== undefined && tab.labelTabId !== null){
                var label = document.getElementById('label-tab-' + tab.labelTabId);
                var status = document.getElementById('status');
            }

            var file = {
                "url": tab.url
            };

            if(!pullTabs.Browser.isFirefox){
                file.method = 'GET';
            }

            //Chrome handles downloads well but Firefox saves URLs without extension endings
            //with a generic download(x) filename
            if(pullTabs.Browser.isFirefox){
                if(!pullTabs.Browser.isFile(tab.url)){
                    file.filename = tab.title + '.html';
                }
            }

            try{
                chrome.downloads.download(file, function(e){
                    if(e === undefined){
                        if(label){
                            label.setAttribute('class', label.className + ' failed');
                        }
                        Form.updateStatus(tab,'Failed downloading ');
                        return;
                    }
                    if(label){
                        label.setAttribute('class', label.className + ' successful');
                    }
                        Form.updateStatus(tab,'Downloading ');

                        //@to-do check preferences to see if user chose to auto-close tabs upon successful action
                        if(tab.active !== true){
                            chrome.tabs.remove(tab.id);
                        }

                });
            }
            catch(e){
                Form.updateStatus(tab, 'Error downloading ');
                console.log(e);
            }

        });
    },

    getTabs: function ( callback ) {
        var info = {currentWindow: true};
        chrome.tabs.query(info,function(e){
            pullTabs.App.setTabs(e);
        });
    },

    getBookmarks: function ( callback ) {
        var otherBookmarks;

        callback = function(tree){
            //other bookmarks folder
            otherBookmarks = tree[0].children[1];

            var count = otherBookmarks.children.length;
            var i;
            var logIt = function(newFolder){
                console.log(newFolder.title);
            };

            for(i=0; i < count; i++){
                if(otherBookmarks.children[i].title === 'Pulltabs'){
                    break;
                }
                if(i == (count - 1)){
                    var folder = {
                        parentId: otherBookmarks.id,
                        title: "Pulltabs"
                    };
                    chrome.bookmarks.create(folder, logIt);
                }
            }

            localStorage['pullTabsFolderId'] = otherBookmarks.children[i].id;

        };

        if(typeof(localStorage['pullTabsFolderId']) === 'undefined'){
            chrome.bookmarks.getTree(callback);
        }
    },

    closeTabs: function (tabs){
        var numTabs = tabs.length;
        var i;
        for (i=0; i < numTabs; i++){
            this.closeTab(tabs[i]);
        }
    },

    closeTab: function (tab) {
        chrome.tabs.remove(tab.id);
    },

    bookmarkTabs: function (tabs){

        var numTabs = tabs.length;
        var i;
        for (i=0; i < numTabs; i++){
            this.bookmarkTab(tabs[i]);
        }
    },

    bookmarkTab: function (tab, callback) {

        var bookmark = {
            'parentId': localStorage['pullTabsFolderId'],
            'title': tab.title,
            'url': tab.url
        };

        chrome.bookmarks.create(bookmark, function(savedMark) {

            Form.updateStatus(tab, 'Successfuly bookmarked ');

            Form.setLabelStatus(tab, "successful");
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

    /*
     * Figure out if Firefox, Chrome or other, if Chrome use sync
     * otherwise use local
     */
    getStorageType: function () {
        if(!pullTabs.Browser.isFirefox){
            if ( ( typeof(chrome.storage.sync) !== 'undefined' && typeof(chrome.storage.sync.get) !== 'undefined' ) ){
                pullTabs.Browser.storageType = chrome.storage.sync;
                return pullTabs.Browser.storageType;
            }
        }
        else if(typeof(chrome.storage.local) !== 'undefined' && typeof(chrome.storage.local.get) !== 'undefined' ){
                pullTabs.Browser.storageType = chrome.storage.local;
                return pullTabs.Browser.storageType;
        }

        //@to-do revert to localStorage
        console.log("chrome.storage is unavailable.");
        return;
    },

    /*
     * Only chrome has sync, if sync is available use it
     * otherwise reverts to using local storage
     * @to-do add a localStorage fallback for browsers that
     * don't recognize chrome.storage
     */
    store: function ( key, callback ) {
        pullTabs.Browser.getStorageType();

        if(typeof(pullTabs.Browser.storageType) === 'undefined'){
            console.log("No storage available");
            callback();
            return;
        }

        try{
            pullTabs.Browser.storageType.set( key , callback );
        }
        catch(e){
            console.log(e);
            return;
        }
    },

    save: function ( key, object ) {
        console.log(key + ' save ' + object);
        if(typeof(chrome.storage) === 'undefined'){
            console.log('ERROR');
        }
        try{
            chrome.storage.local.set( object , function () {
                var status = document.getElementById('status');
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

    retrieve: function ( key, callback ) {
        var storageType;

        if(pullTabs.Browser.isFirefox){
            if(typeof(chrome.storage.local) !== 'undefined' && typeof(chrome.storage.local.get) !== 'undefined' ){
                storageType = chrome.storage.local;
            }
            else{
                console.log("Browser is Firefox but chrome.storage.local is unavailable, returning default key value");
                callback(key);
                return;
            }
        }
        else if ( ( typeof(chrome.storage.sync) !== 'undefined' && typeof(chrome.storage.sync.get) !== 'undefined' ) ){
            storageType = chrome.storage.sync;
        }
        else{
            console.log("Storage unavailable, returning default key value");
            callback(key);
            return;
        }

        storageType.get(key, function ( value ) {
            callback ( value );
        });
    },

    createTab: function ( tabKey ) {
        if( typeof(chrome.tabs.create) !== 'undefined' ) {
           chrome.tabs.create( tabKey );
           return;
       }

       console.log('Unable to create this tab: ');
       console.dir(tabKey);
       return;
    },

    extensionGetURL: function ( url ) {
        if( typeof( chrome.extension.getURL ) !== 'undefined' ) {
            return chrome.extension.getURL( url );
        }

        console.log("Unable to get extension relative URL as absolute URL");
        return false;
    }
};

//pullTabs.Browser.init();
if(typeof(pullTabs.Browser.ENV !== 'undefined') && pullTabs.Browser.ENV === 'DEVELOPMENT'){

    console.log("DEFAULT TABS: " + pullTabs.Browser.getTabs());
}
pullTabs.Browser.init(pullTabs);