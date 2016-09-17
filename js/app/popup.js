var
pullTabs = {

    tabs: '',

    prefs: '',

    layout: '',

    linksWatched: false,

    init: function(  ) {
        //Force user to go to options page on initial load
        if(localStorage.initialSetup !== 'no'){
            localStorage.initialSetup = 'yes';
            this.doInitialSetup();
            return;
        }

        if(!this.tabs){
            var callback = pullTabs.setTabs();
            Browser.getTabs(callback);
            return;
        }

        this.continueLoad();
    },

    doInitialSetup: function () {
        if(localStorage.initialSetup === 'yes'){
            var mainDiv = document.getElementById('main');
                mainDiv.setAttribute('class', 'hidden');

            var optionsLink = document.createElement('a');
                //Browser is not instantiated at this point
                //optionsLink.href = Browser.extensionGetURL('options.html');
                optionsLink.href = chrome.extension.getURL( 'options.html' );
                optionsLink.textContent = " Setup PullTabs with your preferences.";

            var setupDiv = document.getElementById('setup');
                setupDiv.classList.remove('hidden');

            var setupMessage = document.getElementById('setup-message');
                setupMessage.appendChild(optionsLink);

                setupMessage.addEventListener('click', function () {
                    localStorage.initialSetup = 'no';
                });
        }
    },

    continueLoad: function( ) {
        if(this.tabs){
            this.setNumTabs(this.tabs);

            this.getLayout(this.setLayout);

            if(pullTabs.layout){

                if(pullTabs.layout.simple){
                    this.watchButtons();
                    if(!this.linksWatched){
                        this.watchLinks();
                    }
                }
                else{
                    var simple = document.getElementById('simple');
                    simple.classList.add('hidden');

                }

                if(pullTabs.layout.advanced){
                    this.setAdvancedLayout();
                }
            }
            else{
                window.setTimeout( this.init, 50);
            }
        }
    },

    setAdvancedLayout: function () {

        var advanced = document.getElementById('advanced');
        advanced.classList.remove('hidden');

        this.getOptions(this.setOptions);
        if(pullTabs.prefs){
            this.createForm(this.tabs);
            var numFormTabs = document.getElementById('resources').getElementsByClassName('list-group-item');
            if(numFormTabs.length === this.tabs.length){
                this.watchCheckBoxes(numFormTabs);
                this.watchMutateCheck();
                this.setActions();
                if(!this.linksWatched){
                    this.watchLinks();
                }
            }
            else{
                window.setTimeout( this.init, 50);
            }
        }
        else{
            window.setTimeout( this.init, 50);
        }
    },

    watchCheckBoxes: function (numFormTabs) {
        var i;
        for(i=0;i<numFormTabs.length; i++){
            Form.toggleLabels(numFormTabs[i]);
        }
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
        this.continueLoad();
    },

    setNumTabs: function(tabs){
        var numTabs = document.getElementById('numTabs');
        numTabs.innerHTML = 'This window has ' + tabs.length + ' tabs. Do this action to all tabs:';
    },

    createForm: function (tabs) {
        if(pullTabs.prefs){
            this.assembleForm( tabs, pullTabs.prefs );
        }

        this.watchSubmit();
        return;
    },

    assembleForm: function ( tabs, prefs ){

        var group = document.getElementById('group');

        var resources = document.getElementById('resources');

        var fullMimeType = false;
        tabs.forEach(function(tab) {

            var type,pref, fullType;

            if(fullMimeType){
                pullTabs.getContentType(tab.url, function(response){
                    this.mType = response;
                });
            }

            if(this.mType){
                fullType = this.mType.split(";").shift();
                type = this.mType.split("/").shift().toLowerCase();
                pref = prefs[type] ? prefs[type] : 'ignore';

            }
            else{
                fullType = 'unknown';
                type = 'unknown';
                pref = 'ignore';
            }

            var checked = '';
            var active = '';

            if( (pref !== 'ignore') ){
                checked = 'checked';
                active = 'active';
            }

            var input = Form.createCheckbox ( tab, fullType, checked );

            var radioDown = Form.createRadioInput ( tab, 'download', pref );
            var radioPocket = Form.createRadioInput ( tab, 'pocket', pref );
            var radioBookmark = Form.createRadioInput( tab, 'bookmark', pref);
            var radioClose = Form.createRadioInput( tab, 'close', pref);

            var label = Form.createLabel ( tab, fullType, active );

            label.appendChild(input);
            label.appendChild(radioDown);
            label.appendChild(radioPocket);
            label.appendChild(radioBookmark);
            label.appendChild(radioClose);

            resources.appendChild(label);

        });
    },

    getTabStatus: function(){
            this.tabs = Form.getSelectedTabs(this.tabs);

            if(this.tabs.downloads.length > 0){
                Browser.downloadUrls(this.tabs.downloads);
            }

            if(this.tabs.pockets.length > 0){
                Pocket.saveTabsToPocket(this.tabs.pockets);
            }

            if(this.tabs.closes.length > 0){
                Browser.closeTabs(this.tabs.closes);
            }

            if(this.tabs.bookmarks.length > 0){
                Browser.bookmarkTabs(this.tabs.bookmarks);
            }

            return;
    },

    getContentType: function(url, callback){

        try{
            var xhr = new XMLHttpRequest();
            xhr.open("HEAD", url, false);
            xhr.onload =  function(e) {
                if (xhr.readyState === 4) {
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

    setLayout: function ( layout ) {
        pullTabs.layout = layout;
    },

    getLayout: function( callback ) {
        var key = {
            simple: 'true',
            advanced: 'false'
        };

        Browser.retrieve(key, callback);
    },

    getOptions: function ( callback ) {
        var key = {
            application: 'download',
            image: 'download',
            message: 'ignore',
            model: 'ignore',
            multipart: 'ignore',
            text: 'download',
            video: 'download',
            unknown: 'ignore'
        };

        Browser.retrieve( key, callback );

        return;
    },

    setOptions: function ( items ) {
        pullTabs.prefs = items;
    },

    setActions: function (){
        var actions = {
            check: function() {pullTabs.setAllActive();},
            uncheck: function() {pullTabs.setAllInactive();},
        };

        //Here be the only piece of jQuery code in this extension's
        //core files. Maybe one day I'll rewrite this in pure JS
        //but this gets the job done easier now
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

    process: function (evt) {
        evt.preventDefault();
        pullTabs.getTabStatus();
    },

    processGroup: function (evt) {
        evt.preventDefault();
        var destination = document.getElementById('default');

    },

    doAction: function(evt) {
        evt.preventDefault();
        pullTabs.processButton(this.id);
    },

    processButton: function(action){
        switch(action) {
            case "download":
                Browser.downloadUrls(pullTabs.tabs);
                break;

            case "pocket":
                Pocket.saveTabsToPocket(pullTabs.tabs);
                break;

            case "bookmark":
                Browser.bookmarkTabs(pullTabs.tabs);
                break;

            case "close":
                Browser.closeTabs(pullTabs.tabs);
                break;

            default:
                console.log(this);
                break;
        }
    },

    watchButtons: function () {
        var download = document.getElementById('download');
        download.addEventListener('click', this.doAction);

        var pocket = document.getElementById('pocket');
        pocket.addEventListener('click',this.doAction);

        var bookmark = document.getElementById('bookmark');
        bookmark.addEventListener('click', this.doAction);

        var close = document.getElementById('close');
        close.addEventListener('click', this.doAction);

        var ignore = document.getElementById('ignore');
        ignore.addEventListener('click', this.doAction);

    },

    watchSubmit: function () {
        var group = document.getElementById('default');
        group.addEventListener('submit', this.processGroup);

        var checked = document.getElementById('list');
        checked.addEventListener('submit', this.process);
    },

    showMainContent: function ( ) {
        var mainContent = document.getElementById('main');
        var aboutContent = document.getElementById('about-credits');

            mainContent.classList.remove('bounce');

            if(!aboutContent.classList.contains('hidden')){
                aboutContent.classList.add('hidden');
            }

        return;
    },

    swapMainContent: function ( ) {
        var mainContent = document.getElementById('main');
        var aboutContent = document.getElementById('about-credits');

        if(mainContent.classList.contains('bounce')){
            mainContent.classList.remove('bounce');

            if(!aboutContent.classList.contains('hidden')){
                aboutContent.classList.add('hidden');
            }

            return;
        }
        if(!mainContent.classList.contains('bounce')){
            mainContent.classList.add('bounce');

            if(aboutContent.classList.contains('hidden')){
                aboutContent.classList.remove('hidden');
            }

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
                if (xhr.readyState === 4) {
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

        var creditLinks = document.getElementById('about-credits').getElementsByTagName('a');
        var i;
        var len = creditLinks.length;

        for(i = 0; i < len; i++){
            creditLinks[i].addEventListener('click', function (e) {
                var tabKey = {
                    'url': e.target.href,
                    'active': false
                };

                Browser.createTab( tabKey );
            });
        }

        this.linksWatched = true;

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
