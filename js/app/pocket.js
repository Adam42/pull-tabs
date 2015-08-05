var Pocket = {

    pocketKey: {
            access_token: 'access_token',
            user_name: 'user_name',
    },

    init: function(  ) {
        if(localStorage[this.pocketKey.user_name] !== 'user_name' && typeof(localStorage[this.pocketKey.user_name]) !== 'undefined'){
            this.isAuthorized();
            return;
        }

        this.isNotAuthorized();
        return;
    },

    isAuthorized: function (  ) {
        var status = document.getElementById('pocket-status');
        if(status !== null){
            status.href = '#pocket-logout';
            status.textContent = 'You are signed in as ' + localStorage[this.pocketKey.user_name] + ' Click to log out.';
        }
    },

    isNotAuthorized: function() {

       var status = document.getElementById('pocket-status');
            status.href = '#pocket-login';
            status.textContent = 'You are not authorized, please sign in.';
    },

    logOut: function ( ) {
        localStorage[this.pocketKey.user_name] = 'user_name';
        localStorage[this.pocketKey.access_token] = 'access_token';

        chrome.storage.local.set({
            access_token: 'access_token',
            user_name: 'user_name',
        }, function ( items ) {
                return;
        });

        this.isNotAuthorized();
    },

    checkLink: function (event) {
        var hash = event.target.href.indexOf("#") + 1;
        var action = event.target.href.substring(hash);

        if(action === 'pocket-logout'){
            Pocket.logOut();
            return;
        }

        Pocket.initLogin();

    },

    initLogin: function( ) {
        var pocket = {};
        pocket.url = 'https://getpocket.com/v3/oauth/request';
        pocket.key = pullTabsApp.Config.credentials.consumer_key;
        Pocket.getRequestToken(pocket);
    },

    saveTabToPocket: function ( tab) {
        var url = tab.url;
        var id = tab.id;
        var label = document.getElementById('label-tab-' + tab.labelTabId);

        var pocket_data = {
            "url": url,
            "consumer_key": pullTabsApp.Config.credentials.consumer_key,
            "access_token": localStorage[this.pocketKey.access_token]
        };

        try{
            var xhr = new XMLHttpRequest();
            xhr.overrideMimeType("application/json");
            xhr.open('POST', 'https://getpocket.com/v3/add', false);
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
                    label.setAttribute('class', label.className + ' successful');
                    console.log(url + ' from browser-tab ' + id + ' saved to Pocket');

                    //if we remove the tab that the popup was invoked on the popup
                    //goes away, ideally we should move to event scripts
                    //so the popup isn't dependent on a tab being open
                    chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
                        if(tab.id !== tabs[0].id){
                            chrome.tabs.remove(tab.id);
                        }
                    });


                    return true;
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

    getRequestToken: function ( pocket ) {
        var redirectURL = chrome.extension.getURL('pocket.html');

        var data = new FormData();
            data.append('consumer_key', pocket.key);
            data.append('redirect_uri', encodeURIComponent(redirectURL));

        var xhr = new XMLHttpRequest();

        xhr.open("POST", pocket.url, true);

        xhr.onload =  function(e) {
            if (xhr.readyState === 4) {
                if(xhr.status === 200) {
                    pocket.token = xhr.response.substring(5);

                    pocket.auth = 'https://getpocket.com/auth/authorize?request_token=' +
                            pocket.token +
                            '&redirect_uri=';

                    Browser.login(pocket);

                }
                else{
                    console.error(xhr.statusText);
                }
            }
        };

        xhr.onerror = function (e) {
            console.error(xhr.statusText);
        };

        xhr.send(data);
    },

    getStoredCredentials: function (callback) {
        if(chrome.storage.local){
        chrome.storage.local.get({
            access_token: 'access_token',
            user_name: 'user_name',
        }, function ( items ) {
                if(items.user_name !== 'user_name'){
                    Pocket.isAuthorized( items );
                }
                else{
                    Pocket.isNotAuthorized( );
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
        localStorage[this.pocketKey.access_token] = accessToken;

        localStorage[this.pocketKey.user_name] =  userName;

        this.isAuthorized();
/*
        //Browser.save('Pocket', pocket );
         chrome.storage.local.set( pocket , function () {
            var status = document.getElementById('status');
            status.textContent = pocket.key + ' saved.';
            setTimeout( function () {
               status.textContent = '';
            }, 750);
        });
*/
    },

    getAccessToken: function (pocket) {
        pocket.url = 'https://getpocket.com/v3/oauth/authorize';

        var data = new FormData();
            data.append('consumer_key', pocket.key);
            data.append('code', pocket.token);

        var xhr = new XMLHttpRequest();

        xhr.open("POST", pocket.url, true);

        xhr.onload =  function(e) {
            if (xhr.readyState === 4) {
                if(xhr.status === 200) {
                    Pocket.setStoredCredentials(xhr.response);
                }
                else{
                    console.error(xhr.statusText);
                }
            }
        };

        xhr.onerror = function (e) {
            console.error(xhr.statusText);
        };

        xhr.send(data);
    },
};

Pocket.init();