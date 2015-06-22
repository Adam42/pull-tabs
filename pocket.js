var Pocket = {

    username: 'default',
    access_token:  'default',
    urls: 'default',

    init: function( credentials ) {
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

    saveTabToPocket: function ( url, credentials ) {
      if(!credentials){
            this.getStoredCredentials(this.saveTabToPocket(url));
            return;
        }


            var pocket_data = {
                "url": url,
                "consumer_key": config.credentials.consumer_key,
                "access_token": credentials.access_token
            };

        try{
            var xhr = new XMLHttpRequest();
            xhr.overrideMimeType("application/json");
            xhr.open('POST', 'https://getpocket.com/v3/add', false);
            xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
            xhr.setRequestHeader('X-Accept', 'application/json');

            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == "200") {
                    console.log("Response from Pocket: ");
                    console.log(xhr.responseText);
                }
            };

            xhr.onerror = function (e) {
                console.error(xhr.statusText);
                return;
            };

            xhr.send(JSON.stringify(pocket_data));
        }
        catch (e) {
            console.log("saveTabToPocket Exception: ");
            console.log(e);
        }



    },

    getConfig: function ( ) {
                    chrome.storage.local.get({
                        access_token: 'default',
                        user_name: 'default'
                    }, function ( items ) {
                            Pocket.saveTabsToPocket( urls, items );
                    return;
                    });
    },


    saveTabsToPocket: function ( urls, config ) {

        this.urls = urls;
        if(typeof(config) === 'undefined'){
            console.log("Config is not defined");
            this.urls = urls;
            Pocket.getConfig();
        }
        else{
           var numURLs = urls.length;
            var i;

        for ( i=0; i < numURLs; i++ ){
//            console.log(this);
            this.saveTabToPocket( urls[i], config );
        }
    }
    },

    getConsumerKey: function( config ) {
        if(!config){
            pullTabs.getConfig( Pocket.getConsumerKey );
            return;
        }
        var credentials = JSON.parse(config).credentials;

        var key = credentials.consumer_key;

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
            if (xhr.readyState == 4) {
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
        console.log("Credentials" + credentials);


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
            if (xhr.readyState == 4) {
                if(xhr.status === 200) {
                    console.log('dat data ' + xhr.response);
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
