var Pocket = {

    username: 'default',
    access_token:  'default',

    init: function( credentials ) {

        if(!credentials){

            this.getStoredCredentials(this.init);
            return;
        }

        if( credentials ){
            this.username = credentials.user_name;
            this.access_token = credentials.access_token;
        }
            console.log(this.username);

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
        console.log(url);
        if(!credentials){
            this.getStoredCredentials(saveTabToPocket(url));
            return;
        }

/*

       var data = new FormData();
            data.append('url', encodeURIComponent(url));

            data.append('redirect_uri', encodeURIComponent(redirectURL));

        try{
            var xhr = new XMLHttpRequest();
//            xhr.overrideMimeType("application/json");
            xhr.open('POST', 'https://getpocket.com/v3/add', true);
            xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
            xhr.setRequestHeader('X-Accept', 'application/json');

            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == "200") {
                    console.log(xhr.responseText);
                }
            }
            xhr.send(null);
        }
        catch (e) {
            console.log(e);
        }

*/

    },

    saveTabsToPocket: function ( urls, credentials ) {
        console.log(urls);
        if(!credentials){
            //Pocket.getStoredCredentials(Pocket.saveTabsToPocket);
            return;
        }

        var numURLs = urls.length;
        var i;

        for ( i=0; i < numURLs; i++ ){
            Pocket.saveTabToPocket( urls[i], credentials );
        }
    },

    getConsumerKey: function( config ) {
        if(!config){
            pullTabs.getConfig( Pocket.getConsumerKey );
            return;
        }
        var consumerKey = JSON.parse(config)['0'];

        var key = consumerKey.consumer_key;

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
            user_name: 'default'
        }, function ( items ) {
                if(items.username !== 'default'){
//                    console.log(items);
                    callback( items );
                }
                else{
                    Pocket.initLogin( );
                }
                return;
        });
    }
    },

    setStoredCredentials: function () {

        //response = access_token=ACCESS_TOKEN&username=USERNAME
        var accessTokenStart = xhr.response.search('=') + 1;
        var accessTokenEnd = xhr.response.search('&');
        var userNameStart = accessTokenEnd + 10;

        var accessToken = xhr.response.substring(accessTokenStart,accessTokenEnd);
        var userName = xhr.response.substring(userNameStart);

        var pocket = {
            'access_token': accessToken,
            'user_name': userName
        };

        //Browser.save('Pocket', pocket );
         chrome.storage.local.set( pocket , function () {
            var status = document.getElementsById('status');
            status.textContent = key + ' saved.';
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
}
