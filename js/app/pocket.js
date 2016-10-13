"use strict";

var pullTabs = pullTabs || {};
pullTabs.Pocket = pullTabs.Pocket || {

    pocketKey: {
            access_token: 'access_token',
            user_name: 'user_name',
    },

    init: function(  ) {
        if(typeof(localStorage[this.pocketKey.user_name]) !== 'undefined' && localStorage[this.pocketKey.user_name] !== 'user_name' ){
            this.isAuthorized();
            return;
        }

        this.isNotAuthorized();
        return;
    },

    checkLocalLoginStatus: function(  ) {
        if(typeof(localStorage[this.pocketKey.user_name]) !== 'undefined' && localStorage[this.pocketKey.user_name] !== 'user_name' ){
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
            status.textContent = 'You are signed in as ' + decodeURIComponent(localStorage[this.pocketKey.user_name])+ ' Click to log out.';
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
            pullTabs.Pocket.logOut();
            return;
        }

        pullTabs.Pocket.initLogin();

    },

    initLogin: function( ) {
        var pocket = {};
        pocket.url = 'https://getpocket.com/v3/oauth/request';
        pocket.key = pullTabs.Config.credentials.consumer_key;
        pullTabs.Pocket.getRequestToken(pocket);
    },

    saveTabToPocket: function ( tab) {
        var url = tab.url;
        var id = tab.id;

        var pocket_data = {
            "url": url,
            "consumer_key": pullTabs.Config.credentials.consumer_key,
            "access_token": localStorage[this.pocketKey.access_token]
        };

        try{
            var xhr = new XMLHttpRequest();
            xhr.overrideMimeType("application/json");
            xhr.open('POST', 'https://getpocket.com/v3/add', false);
            xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
            xhr.setRequestHeader('X-Accept', 'application/json');

                var link = document.createElement('a');
                var status = document.createElement('span');
                var message;

                link.title = tab.title;
                link.href = tab.url;
                link.innerHTML = tab.title;

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status !== 200) {

                    if(tab.labelTabId !== undefined && tab.labelTabId !== null){
  //                      pullTabs.Form.setLabelStatus(tab, 'failed');
                    }
                    message = document.createTextNode('Failed saving to Pocket ');
                    status.appendChild(message);
                    status.appendChild(link);
                    pullTabs.App.updateStatusMessage(status, 'dependent', 'danger');

                    return false;
                }
                else if (xhr.readyState === 4 && xhr.status === 200){
                    if(tab.labelTabId !== undefined && tab.labelTabId !== null){
//                        pullTabs.Form.setLabelStatus(tab, 'successful');
                    }

                    message = document.createTextNode('Saved this tab to pocket: ');
                    status.appendChild(message);
                    status.appendChild(link);
                    pullTabs.App.updateStatusMessage(status, 'medium', 'success');


                    //if we remove the tab that the popup was invoked on the popup
                    //goes away, ideally we should move to event scripts
                    //so the popup isn't dependent on a tab being open
                    var autoClose;
                    if(autoClose){
                    chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
                        if(tab.id !== tabs[0].id){
                            //chrome.tabs.remove(tab.id);
                        }
                    });
                    }

                    return true;
                }
            };

            xhr.onerror = function (e) {
                pullTabs.Form.setLabelStatus(tab, 'failed');

                console.error("saveTabToPocket error: " + xhr.statusText);
                return;
            };

            xhr.send(JSON.stringify(pocket_data));
        }
        catch (e) {
            console.log("saveTabToPocket Exception: ");
            console.log(e);
            pullTabs.Form.setLabelStatus(tab, 'failed');
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

                    localStorage[pullTabs.Pocket.pocketKey.request_token] = pocket.token;

                    pocket.auth = 'https://getpocket.com/auth/authorize?request_token=' +
                            pocket.token +
                            '&redirect_uri=';

                    pullTabs.Browser.login(pocket);

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
                        pullTabs.Pocket.isAuthorized( items );
                    }
                    else{
                        pullTabs.Pocket.isNotAuthorized( );
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
        //pullTabs.Browser.save('Pocket', pocket );
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
        var pocket = {};
        pocket.url = 'https://getpocket.com/v3/oauth/authorize';
        pocket.key = pullTabs.Config.credentials.consumer_key;
        pocket.token = localStorage[this.pocketKey.request_token];
        var data = new FormData();
            data.append('consumer_key', pocket.key);
            data.append('code', pocket.token);

        var xhr = new XMLHttpRequest();

        xhr.open("POST", pocket.url, true);

        xhr.onload =  function(e) {
            if (xhr.readyState === 4) {
                if(xhr.status === 200) {
                    pullTabs.Pocket.setStoredCredentials(xhr.response);
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