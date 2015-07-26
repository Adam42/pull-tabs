var Pocket = {

    username: 'default',
    access_token:  'default',
    urls: 'default',

    init: function( credentials ) {
        config = Config;
        if(!credentials){

            this.getStoredCredentials(this.init);
            return;
        }

        if( credentials ){
            config.username = credentials.user_name;
            config.access_token = credentials.access_token;
        }
    },

    initLogin: function( key ) {
        var pocket = {};
        pocket.url = 'https://getpocket.com/v3/oauth/request';

        if(key){
            pocket.key = key;
        }
        else{
            Pocket.getConsumerKey();
        }

        if(pocket.key){
            Pocket.getRequestToken(pocket);
        }
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

        var pocket_data = {
            "url": url,
            "consumer_key": config.credentials.consumer_key,
            "access_token": config.access_token
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

    getConsumerKey: function( ) {

        var key = Config.credentials.consumer_key;

        Pocket.initLogin(key);
    },

    getRequestToken: function ( pocket ) {
        var redirectURL = chrome.extension.getURL('pocket');

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
