var pullTabs = {

    init: function() {

        pullTabs.getTabs();
        pullTabs.watchMutateCheck();
        pullTabs.setActions();        
        pullTabs.watchLinks();
        //Pocket.init();

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
        numTabs.innerHTML = "<p> This window has " + tabs.length + " tabs.";

        var resources = document.getElementById('resources');

        tabs.forEach(function(tab) {
            var contentType = pullTabs.getContentType(tab.url, function(response){
                this.response = response;
            });

            var input = document.createElement('input');
                input.type = "checkbox";
                input.id = 'tab-' + tab.index;
                input.name = 'tabs' + tab.index;
                input.title = tab.title + this.response;
                input.value = tab.url;
                input.checked = "checked";

            var shortDescription = tab.title.substring(0,10);

            var label = document.createElement('label');
//              label.innerText = shortDescription;
                label.setAttribute('class','list-group-item active');
                label.setAttribute('id','label-tab-' + tab.index);
                label.innerHTML = '<p>Title: ' + tab.title + '</p><p> Type: ' + this.response + '</p>';
                if(this.response.split("/").shift() == 'image'){
                    label.innerHTML += '<img class="img-thumbnail" style="width: 150px; height: 150px;" src=' + tab.url + '/>';
                }
                label.appendChild(input);

                resources.appendChild(label);

        });

        pullTabs.watchSubmit(tabs);
    },

    getSelectedTabs: function (inputs) {
        var arr = [];

        for (var i = 0; i < inputs; i++){
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

    getOptions: function () {
        chrome.storage.sync.get({
            application: 'download',
            image: 'download',
            message: 'ignore',
            model: 'ignore',
            multipart: 'ignore',
            text: 'download',
            video: 'download'
        }, function ( items ) {
            setOptions( items );
        });
    },

    setOptions: function () {
        console.log('setOptions');
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

        for (i=0; i < numLabels; i++ ) {
            if(!labels[i].classList.contains('active')){
                labels[i].classList.add('active');
            }
        }
    },

    setAllInactive: function () {
        var labels = document.querySelectorAll("#resources > label");
        var numLabels = labels.length;

        for (i=0; i < numLabels; i++ ) {
            if(labels[i].classList.contains('active')){
                labels[i].classList.remove('active');
            }
        }
    },

    updateBackground: function (node, label){
        if(label.classList.contains('active')){
            if(!node.checked){
                label.classList.remove("active");
            }
        }
        if(!label.classList.contains('active')){
            if(node.checked){
                label.classList.add("active");
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
                            label.classList.remove("active");
                        }
                    }
                    if(!label.classList.contains('active')){
                        if(node.checked){
                            label.classList.add("active");
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

    swapContent: function (link) {

        console.log(link);
    },

    watchLinks: function () {
        var navLinks = document.getElementById("main-nav");
        var links = navLinks.children;
        var numLinks = links.length;

        for (i=0; i < numLinks; i++) {
            var link = links[i];
            links[i].addEventListener('click', function(){pullTabs.swapContent(link);});
            console.log(links[i]);
        }
    },
}

document.addEventListener('DOMContentLoaded', function () {
    pullTabs.init();
});

//Generic Browser: switch between Chrome and Firefox
var Browser = {

    getTabs: function (info) {
        if (!(typeof chrome ==='undefined')) {
            var browser = PTChrome;
        }
        else{
            var browser = DevBrowse;
        }

        browser.getTabs(info);
    },

    downloadUrls: function (urls) {
        if (!(typeof chrome ==='undefined')) {
            var browser = PTChrome;
        }
        else{
            var browser = DevBrowse;
        }

        browser.downloadUrls(urls)
    },

    login: function ( pocket ) {
        if (!(typeof chrome ==='undefined')) {
            var browser = PTChrome;
        }
        else{
            var browser = DevBrowse;
        }

        browser.login( pocket );
    },
}

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

var Pocket = {

    init: function( key ) {
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

    getConsumerKey: function( config ) {
        if(!config){
            pullTabs.getConfig( Pocket.getConsumerKey );
        }

        key = JSON.parse(config)['0']['consumer_key'];

        Pocket.init(key);
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
                    console.log(xhr.response);
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


//PullTabs Chrome wrapper, should only be automatically called via Browser
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
    }
}
