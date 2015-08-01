var Pocket = {

    username: 'default',
    access_token:  'default',
    urls: 'default',

    cookieKeys: ['pullTabsPublicToken'],

    app_name : 'pullTabs',

    load: function () {
        var name = this.app_name + 'publicKey';

        var publicKey = docCookies.getItem(name);
        this.startAUTH(publicKey);

        if(docCookies.getItem(name) !== publicKey){
            publicKey = docCookies.getItem(name);
        }
        console.log(publicKey);
return;

        var status = document.getElementById('status');
        var queryString = this.getQueryString();
        var public_token;

        if(queryString){
            public_token = this.convertQueryStringToPublicToken(queryString);
        }

        if( (pullTabsPublicToken !== null) && (typeof(public_token) !== 'undefined') ){
            if(public_token === pullTabsPublicToken){
                status.textContent = "You're already authenticated to Pocket.";
                return;
            }
            else{
                status.textContent = "Error: there was an issue authenticating to Pocket.";
                return;
            }
        }

        if(pullTabsPublicToken){
            console.log(pullTabsPublicToken);
            status.textContent = "You're currently authenticated to Pocket.";
            return;
        }
        else if(typeof(public_token) !== 'undefined'){
            docCookies.setItem('pullTabsPublicToken', public_token);
            status.textContent = "You've successfully authenticated to Pocket.";
            return;
        }

        this.init();
    },

    startAUTH: function(publicKey) {
        if(publicKey === null){
            this.getPublicKey(this.startAUTH);
            return;
        }
        var name = Pocket.app_name + 'publicKey';
        console.log(docCookies.getItem(name));
    },

    getPublicKey: function(callback){
        var initAuthURL = 'https://pulltabs-five.app/api/init';
        try{
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://pulltabs-five.app/api/init', false);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status !== 200) {
                    console.log( xhr.status);
                    console.log(xhr.responseText);
                    return false;
                }
                else if (xhr.readyState === 4 && xhr.status === 200){
                    Pocket.setPublicKey(xhr.response, callback);
                    return;
                }
            };

            xhr.onerror = function (e) {
                console.error("initAuthURL error: " + xhr.statusText);
                return;
            };

            xhr.send();
        }
        catch (e) {
            console.log(e);
            return false;
        }
    },

    setPublicKey: function ( publicKey, callback ){
        var name = this.app_name + 'publicKey';
        docCookies.setItem(name, publicKey);

        callback(publicKey);

    },

    clearTokenCookie: function() {
        docCookies('pullTabsPublicToken');
        return;
    },

    getQueryString: function(){
        var queryString = location.search;
        if(queryString.length === 0){
            return false;
        }

        return queryString;
    },


    convertQueryStringToPublicToken: function (queryString){
        var query = queryString.slice(queryString.indexOf('?') + 1).split('&');

        var start = query[0].indexOf('=') + 1;

        var public_token = query[0].toString().substring(start);

        return public_token;

    },

    init: function( credentials ) {

        var pulltabsAppURL = 'https://pulltabs-five.app/api/login/';
        var redirect = chrome.extension.getURL('pocket.html');
        var redirectString = '?redirect=' + redirect;
        var timestamp = Date.now();
        var timeString = '&time=' + timestamp;
        var pullTabsPocketAuthURL;
        var pocketCookie = docCookies.getItem(this.app_name + 'publicKey');
        var cookieString;

        //
        if( pocketCookie !== null ){
            cookieString = '?pullTabsToken=' + pocketCookie;
            pullTabsPocketAuthURL = pulltabsAppURL + cookieString;
        }
        else{
            document.cookie = 'pullTabsId=' . timestamp;
            pullTabsPocketAuthURL = pulltabsAppURL + redirectString + timeString + '&publicKey=' + docCookies.getItem(this.app_name + 'publicKey');
        }

            window.location.href = pullTabsPocketAuthURL;

    },



    getPocketItems: function ( items ) {
        if( items ){
            console.log( 'Pocket authorized' );
            return;
        }
        else{
            Pocket.initLogin();
        }
    },

    saveTabToPocket: function ( tab) {
        var url = tab.url;
        var id = tab.id;
        var label = document.getElementById('label-tab-' + tab.labelTabId);

        var access_token = docCookies.getItem('pullTabsPublicToken');

        var pocket_data = {
            "url": url,
            "pullTabsPublicToken": access_token
        };

        try{
            var xhr = new XMLHttpRequest();
            xhr.overrideMimeType("application/json");
            xhr.open('POST', 'https://pulltabs-five.app/pocket/add/', false);
            xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
            xhr.setRequestHeader('X-Accept', 'application/json');

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status !== 200) {
                    console.log( xhr.status + " response from Pocket: ");
                    console.log(xhr.responseText);
                    label.setAttribute('class', label.className + ' failed');
                    return false;
                }
                else if (xhr.readyState === 4 && xhr.status === 200){
                    var results = JSON.parse(xhr.response);

                    var response_code = Number(results.item.response_code);

                    if(response_code === 200){
                        label.setAttribute('class', label.className + ' successful');
                        console.log(url + ' from browser-tab ' + id + ' saved to Pocket');
                        return true;
                    }
                }
            };

            xhr.onerror = function (e) {
                label.setAttribute('class', label.className + ' failed');

                console.error("saveTabToPocket error: " + xhr.statusText);
                return;
            };

            xhr.send(JSON.stringify(pocket_data));
        }
        catch (e) {
            console.log("saveTabToPocket Exception: ");
            console.log(e);
            label.setAttribute('class', label.className + ' failed');
            return false;
        }


    },


    saveTabsToPocket: function ( tabs ) {
        var numURLs = tabs.length;
        var i;

        for ( i=0; i < numURLs; i++ ){
            this.saveTabToPocket( tabs[i] );
        }
    },

    getStoredCredentials: function (callback) {
        if(chrome.storage.local){
        chrome.storage.local.get({
            access_token: 'default',
            user_name: 'default',
            key: 'default'
        }, function ( items ) {
                if(items.user_name !== 'default'){
                    callback( items );
                }
                else{
                    Pocket.initLogin( );
                }
                return;
        });
    }
    },

    setStoredCredentials: function (credentials) {
        //response = access_token=ACCESS_TOKEN&username=USERNAME
        var accessTokenStart = credentials.search('=') + 1;
        var accessTokenEnd = credentials.search('&');
        var userNameStart = accessTokenEnd + 10;

        var accessToken = credentials.substring(accessTokenStart,accessTokenEnd);
        var userName = credentials.substring(userNameStart);

        var pocket = {
            'access_token': accessToken,
            'user_name': userName
        };

        //Browser.save('Pocket', pocket );
         chrome.storage.local.set( pocket , function () {
            var status = document.getElementById('status');
            status.textContent = pocket.key + ' saved.';
            setTimeout( function () {
               status.textContent = '';
            }, 750);
        });
    },
};
