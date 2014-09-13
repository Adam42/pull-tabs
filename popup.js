var pullTabs = {

    init: function() {

        pullTabs.getTabs();
        pullTabs.watchMutateCheck();
        pullTabs.setActions();
        pullTabs.watchLinks();
        Pocket.init();

    },

    getTabs: function () {
        var info = {currentWindow: true};

        Browser.getTabs(info);

    },

    getUrls: function (tabs) {
        var urls = [];

        tabs.forEach(function(tab){
            urls.push(tab.url);
        });

        return urls;
    },

    createForm: function (tabs) {
        var numTabs = document.getElementById('numTabs');
        numTabs.innerHTML = 'This window has ' + tabs.length + ' tabs.';

        pullTabs.getOptions(function(options){
   
            pullTabs.assembleForm( tabs, options );
            return;
        });

        pullTabs.watchSubmit(tabs);
        return;
    },

    createInput: function (tab, type, checked) {
        var input = document.createElement('input');
            input.type = 'checkbox';
            input.id = 'tab-' + tab.index;
            input.name = 'tabs' + tab.index;
            input.title = tab.title + type;
            input.value = tab.url;
            input.checked = checked;

        return input;
    },

    createLabel: function ( tab, type, active){
        var label = document.createElement('label');
            label.setAttribute('class','list-group-item ' + active);
            label.setAttribute('id','label-tab-' + tab.index);
            label.innerHTML = '<p>Title: ' + tab.title + '</p><p> Type: ' + type + '</p>';
            if(type.split("/").shift() == 'image'){
                label.innerHTML += '<img class="img-thumbnail" style="width: 150px; height: 150px;" src=' + tab.url + '/>';
            }

        return label;
    },

    assembleForm: function ( tabs, options ){
        var resources = document.getElementById('resources');

        tabs.forEach(function(tab) {

            pullTabs.getContentType(tab.url, function(response){
                this.mType = response;
            });

            var type = this.mType.split("/").shift();

            var pref = options[type];

            var checked = '';            
            var active = '';

            if( (pref === 'download') || (pref === 'pocket') ){
                checked = 'checked';
                active = 'active';
            }

            var input = pullTabs.createInput ( tab, type, checked );

            var label = pullTabs.createLabel ( tab, type, active );

            label.appendChild(input);

            resources.appendChild(label);

        });
    },

    getSelectedTabs: function (inputs) {
        var arr = [];
        var i;

        for ( i=0; i < inputs; i++){
            var input = document.getElementById('tab-' + i);
            if(input.checked){
                arr.push(input.value);
            }
        }

        return arr;
    },

    getTabStatus: function(tabs){
            var selectedTabs = this.getSelectedTabs(tabs.length);
            Browser.downloadUrls(selectedTabs);
    },

    getContentType: function(url, callback){

        try{
            var xhr = new XMLHttpRequest();
            xhr.open("HEAD", url, false);
            xhr.onload =  function(e) {
                if (xhr.readyState == 4) {
                    if(xhr.status === 200) {
                        callback(xhr.getResponseHeader("Content-Type"));
                    }
                    else{
                        callback('Unknown');
                        console.error(xhr.statusText);
                        return;
                    }
                }
            };

            xhr.onerror = function (e) {
                console.error(xhr.statusText);
                return;
            };

            xhr.send();
        }
        catch (e) {
            console.log(e);
        }
    },

/*  getExtension: function(url){
        return url.split('.').pop();
    },
*/

    getOptions: function ( callback ) {
        chrome.storage.sync.get({
            application: 'download',
            image: 'download',
            message: 'ignore',
            model: 'ignore',
            multipart: 'ignore',
            text: 'download',
            video: 'download'
        }, function ( items ) {
            callback( items );
        });

        return;
    },

    setOptions: function ( items ) {
        console.log( items );
    },

    getConfig: function ( callback ) {
        var file = 'config.json';

        try{
            var xhr = new XMLHttpRequest();
            xhr.overrideMimeType("application/json");
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

    setActions: function (){
        var actions = {
            check: function() {pullTabs.setAllActive();},
            uncheck: function() {pullTabs.setAllInactive();},
        };

        $('body').on('click', '[data-action]', function() {
            var action = $(this).data('action');
            if (action in actions) {
                actions[action].apply(this, arguments);
            }
        });
    },

    setAllActive: function () {
        var labels = document.querySelectorAll("#resources > label");
        var numLabels = labels.length;
        var i;

        for (i=0; i < numLabels; i++ ) {
            if(!labels[i].classList.contains('active')){
                labels[i].classList.add('active');
            }
        }
    },

    setAllInactive: function () {
        var labels = document.querySelectorAll("#resources > label");
        var numLabels = labels.length;
        var i;

        for (i=0; i < numLabels; i++ ) {
            if(labels[i].classList.contains('active')){
                labels[i].classList.remove('active');
            }
        }
    },

    updateBackground: function (node, label){
        if(label.classList.contains('active')){
            if(!node.checked){
                label.classList.remove('active');
            }
        }
        if(!label.classList.contains('active')){
            if(node.checked){
                label.classList.add('active');
            }
        }
    },

    watchMutateCheck: function () {
        var form = document.querySelector('#resources');

        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                var node = document.querySelector('#' + mutation.addedNodes[0].id + " > input");
                var label = document.querySelector('#label-' + node.id);
                label.addEventListener('click', function () {
                    if(label.classList.contains('active')){
                        if(!node.checked){
                            label.classList.remove('active');
                        }
                    }
                    if(!label.classList.contains('active')){
                        if(node.checked){
                            label.classList.add('active');
                        }
                    }
                });
            });
        });

        var config = { attributes: true, childList: true, characterData: true };

        observer.observe(form, config);
    },

    watchSubmit: function (tabs) {
        var checked = document.getElementById('list');
        checked.addEventListener('submit', function(){pullTabs.getTabStatus(tabs);});
    },

    swapContent: function ( link, content ) {
        if(!content){
            pullTabs.getContent( link, pullTabs.swapContent );
        }

        if(content){
            var container = document.getElementById('content');
            container.innerHTML = content;
        }
    },

    getContent: function ( link, callback ) {
        try{
            var xhr = new XMLHttpRequest();
            xhr.open("GET", link.href, false);
            xhr.onload =  function(e) {
                if (xhr.readyState == 4) {
                    if(xhr.status === 200) {
                        callback(link,xhr.response);
                    }
                    else{
                        console.error(xhr.statusText);
                        return;
                    }
                }
            };

            xhr.onerror = function (e) {
                console.error(xhr.statusText);
                return;
            };

            xhr.send();
        }
        catch (e) {
            console.log(e);
        }
    },

    watchLinks: function () {
        var navLinks = document.getElementById("main-nav");
        var links = navLinks.children;
        var numLinks = links.length;
        var i;

        for (i=0; i < numLinks; i++) {
            var link = links[i];
            links[i].addEventListener('click', function(){pullTabs.swapContent(link);});
        }
    },
}

document.addEventListener('DOMContentLoaded', function () {
    pullTabs.init();
});


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
            Browser.ENV = JSON.parse(config)['1']['environment_mode'];
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
}

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

    getTabs: function ( info ) {
        var devtabs = '[{"active":false,"height":779,"highlighted":false,"id":71,"incognito":false,"index":0,"pinned":false,"selected":false,"status":"complete","title":"Dot Boston: Apple, Bicycles, Boston, Dot and Web Media","url":"http://adamp.com/","width":1440,"windowId":68},{"active":false,"height":779,"highlighted":false,"id":83,"incognito":false,"index":1,"pinned":false,"selected":false,"status":"complete","title":"Is It Boston? Find out if your area is part of Boston.","url":"http://isitboston.com/","width":1440,"windowId":68},{"active":false,"height":779,"highlighted":false,"id":85,"incognito":false,"index":2,"pinned":false,"selected":false,"status":"complete","title":"amiacylon.com","url":"http://amiacylon.com/","width":1440,"windowId":68},{"active":true,"height":779,"highlighted":true,"id":91,"incognito":false,"index":3,"pinned":false,"selected":true,"status":"complete","title":"3571814663_5c742efc65_b.jpg (1024×768)","url":"https://c4.staticflickr.com/4/3322/3571814663_5c742efc65_b.jpg","width":1440,"windowId":68}]';
        var tabs = pullTabs.createForm(JSON.parse(devtabs));
    },
}

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

    getTabs: function ( info ) {
        chrome.tabs.query(info,function(e){
            var tabs = pullTabs.createForm(e);
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
        console.log(chrome.storage.local);
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

}

var Pocket = {

    init: function( ) {

        Pocket.getStoredCredentials(); 

    },

    initLogin: function( key ) {
        var pocket = {};
        pocket.url = 'https://getpocket.com/v3/oauth/request';
        
        if(key){
            pocket.key = key
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
            console.log( 'getPocketItems ' + items );
            return;
        }
        else{
            Pocket.initLogin();
        }
    },

    getConsumerKey: function( config ) {
        if(!config){
            pullTabs.getConfig( Pocket.getConsumerKey );
            return;
        }
        var consumerKey = JSON.parse(config)['0'];

        var key = consumerKey['consumer_key'];

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

    getStoredCredentials: function () {
        chrome.storage.sync.get({
            access_token: 'default',
            user_name: 'default'
        }, function ( items ) {
                if(items['username'] !== 'default'){
                    Pocket.getPocketItems( items );
                    console.log( 'From storage ' + items['user_name'] );
                }
                else{
                    Pocket.initLogin( );
                }
                return;
        });
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