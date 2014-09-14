var
config,

pullTabs = {

    init: function() {

        this.getConfig(this.setConfig);
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
        numTabs.innerHTML = 'This window has ' + tabs.length + ' tabs.';

        pullTabs.getOptions(function(options){

            pullTabs.assembleForm( tabs, options );
            return;
        });

        pullTabs.watchSubmit(tabs);
        return;
    },

    createCheckbox: function (tab, type, checked) {
        var input = document.createElement('input');
            input.type = 'checkbox';
            input.id = 'tab-' + tab.index;
            input.name = 'tabs' + tab.index;
            input.title = tab.title + type;
            input.value = tab.url;
            input.checked = checked;

        return input;
    },

    createRadioInput: function ( tab, value, defaultPref ) {
        var checked = '';
        if(value == defaultPref){
            checked = 'checked';
        }
       var input = document.createElement('input');
            input.type = 'radio';
            input.id = 'tab-pref-' + tab.index;
            input.name = 'tab-pref-' + tab.index;
            input.value = value;
            input.checked = checked;

        var label = document.createElement('label');
            label.setAttribute('class', 'preferences');
            label.innerHTML = '<span>' + value + '</span>';

            label.appendChild(input);

        return label;
    },

    createLabel: function ( tab, type, active){
        if(active === 'active'){
            active = active +  ' alert-success';
        }
        else{
//            active = active + ' alert-danger';
        }

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

            var input = pullTabs.createCheckbox ( tab, type, checked );


            if(pref === 'download'){

            }
            var radioDown = pullTabs.createRadioInput ( tab, 'download', pref );
            var radioPocket = pullTabs.createRadioInput ( tab, 'pocket', pref );
            var radioIgnore = pullTabs.createRadioInput ( tab, 'ignore', pref );


            var label = pullTabs.createLabel ( tab, type, active );

            label.appendChild(input);
            label.appendChild(radioDown);
            label.appendChild(radioPocket);
            label.appendChild(radioIgnore);

            resources.appendChild(label);

        });
    },

    getSelectedTabs: function (inputs) {
        var downloadURLs = [];
        var pocketURLs = [];
        var ignoreURLs = [];
        var results = [];

        var i;

        for ( i=0; i < inputs; i++){
            var input = document.getElementById('tab-' + i);
            if(input.checked){
                var radios = document.getElementsByName('tab-pref-' + i);

                if(radios[0].checked){
                    downloadURLs.push(input.value);
                }

                if(radios[1].checked){
                    pocketURLs.push(input.value);
                }
            }
            else{
                ignoreURLs.push(input.value);
            }
        }

        results['downloads'] = downloadURLs;
        results['pockets'] = pocketURLs;
        results['ignores'] = ignoreURLs;

        return results;
    },

    getTabStatus: function(tabs){
            var results = pullTabs.getSelectedTabs(tabs.length);

            Browser.downloadUrls(results['downloads']);
            Pocket.saveTabsToPocket(results['pockets']);
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
            xhr.open('GET', file, false);
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

        var config = { attributes: true, childList: true, characterData: true };

        observer.observe(form, config);
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
}

document.addEventListener('DOMContentLoaded', function () {
    pullTabs.init();
});
