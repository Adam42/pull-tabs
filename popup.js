var
config,
prefs,
pullTabs = {

    tabs: '',

    init: function(  ) {
        if(typeof(config) === 'undefined'){
            this.getConfig(this.setConfig);
        }

        if(config && (config !== 'pending')){
            if(!this.tabs){
                Browser.init(config);
                return;
            }
            if(this.tabs){
                this.setNumTabs(this.tabs);
                this.getOptions(this.setOptions);
                if(prefs){
                    this.createForm(this.tabs);
                    var numFormTabs = document.getElementById('resources').getElementsByClassName('list-group-item');
                    if(numFormTabs.length === this.tabs.length){
                        this.watchCheckBoxes(numFormTabs);
                        this.watchMutateCheck();
                        this.setActions();
                        this.watchLinks();
                        Pocket.init();
                    }
                    else{
                        window.setTimeout( this.init, 50);
                    }
                }
                else{
                    window.setTimeout( this.init, 50);
                }
            }
        }
        else{
            window.setTimeout( this.init, 50 );
            return;
        }
    },

    watchCheckBoxes: function (numFormTabs) {
        for(i=0;i<numFormTabs.length; i++){
            Form.toggleLabels(numFormTabs[i]);
        }
    },

    getTabs: function () {
        return Browser.getTabs();
    },

    getUrls: function (tabs) {
        var urls = [];

        tabs.forEach(function(tab){
            urls.push(tab.url);
        });

        return urls;
    },

    setTabs: function(tabs){
        this.tabs = tabs;
        this.init();
    },

    setNumTabs: function(tabs){
        var numTabs = document.getElementById('numTabs');
        numTabs.innerHTML = 'This window has ' + tabs.length + ' tabs.';
    },

    createForm: function (tabs) {
        if(prefs){
            this.assembleForm( tabs, prefs );
        }

        this.watchSubmit(tabs);
        return;
    },

    assembleForm: function ( tabs, prefs ){
        var resources = document.getElementById('resources');

        var fullMimeType = true;
        tabs.forEach(function(tab) {

            var type,pref;

            if(fullMimeType){
                pullTabs.getContentType(tab.url, function(response){
                    this.mType = response;
                });
            }
            if(this.mType){
                type = this.mType.split("/").shift().toLowerCase();

                pref = prefs[type] ? prefs[type] : 'ignore';

            }
            else{
                type = 'unknown';
                pref = 'ignore';
            }

            var checked = '';
            var active = '';

            if( (pref === 'download') || (pref === 'pocket') ){
                checked = 'checked';
                active = 'active';
            }

            var input = Form.createCheckbox ( tab, type, checked );


            if(pref === 'download'){

            }
            var radioDown = Form.createRadioInput ( tab, 'download', pref );
            var radioPocket = Form.createRadioInput ( tab, 'pocket', pref );
            var radioIgnore = Form.createRadioInput ( tab, 'ignore', pref );


            var label = Form.createLabel ( tab, type, active );

            label.appendChild(input);
            label.appendChild(radioDown);
            label.appendChild(radioPocket);
            label.appendChild(radioIgnore);

            resources.appendChild(label);

        });
    },

    getTabStatus: function(tabs){
            var results = Form.getSelectedTabs(tabs.length);

            if(results.downloads.length > 0){
                Browser.downloadUrls(results.downloads);
            }

            if(results.pockets.length > 0){
                Pocket.saveTabsToPocket(results.pockets, config);
            }

            return;
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
            callback('Unknown');
            console.log('Did not retrieve ' + url + ' Error: ' + e);
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
            video: 'download',
            unknown: 'ignore'
        }, function ( items ) {
            callback( items );
        });

        return;
    },

    setOptions: function ( items ) {
        prefs = items;
    },

    getConfig: function ( callback ) {
        if(config){
            console.log('public config set ' + config);
            return config;
        }
        else{
            var file = 'config.json';

            config = 'pending';
            try{
                var xhr = new XMLHttpRequest();
                xhr.overrideMimeType("application/json");
                xhr.open('GET', file, true);
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4 && xhr.status == "200") {
                        callback(xhr.responseText);
                    }
                };
                xhr.send(null);
            }
            catch (e) {
                console.log("Error acquiring config" + JSON.stringify(e,null,4));
            }
            /*
                //we're in node.js for testing
                file = 'file:///Users/adam/Dropbox/Sites/pullTabs/config.json';
                console.log("Using node.js xhr");
                var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
                try{
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', file, true);
                    xhr.setRequestHeader("Content-type: application/json");

                    xhr.onreadystatechange = function () {
                        if (xhr.readyState == 4 && xhr.status == "200") {
                            callback.apply(xhr.responseText);
                        }
                    };
                    xhr.send(null);
                }
                catch (e) {
                    console.log(e);
                }
            */
        }
    },

    setConfig: function ( configContents ) {
        config = JSON.parse(configContents);
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

        var setup = { attributes: true, childList: true, characterData: true };
        observer.observe(form, setup);
    },

    watchSubmit: function (tabs) {
        var checked = document.getElementById('list');
        checked.addEventListener('submit', function(){pullTabs.getTabStatus(tabs);});
    },

    showMainContent: function ( ) {
        var mainContent = document.getElementById('main');
            mainContent.classList.remove('bounce');

        return;
    },

    swapMainContent: function ( ) {
        var mainContent = document.getElementById('main');
        if(mainContent.classList.contains('bounce')){
            mainContent.classList.remove('bounce');
            return;
        }
        if(!mainContent.classList.contains('bounce')){
            mainContent.classList.add('bounce');
            return;
        }
    },

    swapContent: function ( link, content ) {
        if(!content){
            pullTabs.getContent( link, pullTabs.swapContent );
            return;
        }

        if(content){
            var container = document.getElementById('content');
            container.innerHTML = content;
            return;
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
            console.log("getContent Error: ");
            console.log(e);
        }
    },

    watchLinks: function () {
        var pocketLink = document.getElementById('pocket');
        pocketLink.addEventListener('click', function(){
            Pocket.init();
            return;
            });

        var aboutLink = document.getElementById('about');
        aboutLink.addEventListener('click', function(){
           pullTabs.swapMainContent();
            return;
        });

        var homeLink = document.getElementById('home');
        homeLink.addEventListener('click', function(){
           pullTabs.showMainContent();
            return;
        });

/*
        var navLinks = document.getElementById("main-nav");
        var links = navLinks.children;
        var numLinks = links.length;
        var i;

        for (i=0; i < numLinks; i++) {
            var link = links[i];
            //links[i].addEventListener('click', function(){pullTabs.swapContent(link);});
            //link = document.getElementById();
            link.addEventListener('click', function(){
                pullTabs.swapContent(link);
                return;
            });
        }*/
    },
};

document.addEventListener('DOMContentLoaded', function () {
    pullTabs.init();
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (var key in changes) {
        if(changes.hasOwnProperty('key')){
            var storageChange = changes[key];
            console.log('Storage key "%s" in namespace "%s" changed. ' +
                  'Old value was "%s", new value is "%s".',
                  key,
                  namespace,
                  storageChange.oldValue,
                  storageChange.newValue);
        }
    }
});
