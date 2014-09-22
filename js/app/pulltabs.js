var
config,
prefs,
pullTabs = {

    tabs: '',
    
    init: function(  ) {
        //console.log('init: ' + this);
        //console.log('config: ' + config);

        if(typeof(config) === 'undefined'){
            
            this.getConfig();
            
            //this.setConfig(testConfig);
            
//            console.log('Final config: ' + config);
            
//            this.getConfig(this.setConfig);
        }
        
        console.log('testConfig now: ' + config);

        
        
        
        /*start refactor
        if(config){

            if(!this.tabs){
                console.log('again');
                console.log(config);
                Browser.init();
                return;
            }
            if(this.tabs){
                this.setNumTabs(this.tabs);
                if(prefs){
                    console.log('options ' + this.prefs);
                }
                else{
                    this.getOptions(pullTabs.setOptions);
                console.log(prefs);
                console.log(this.prefs);

                    //                this.createForm(this.tabs);
    //              this.watchMutateCheck();
    //            this.setActions();
      //          this.watchLinks();
        //        Pocket.init();
                }
            }
        }
        end refactor*/

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
        this.prefs = items;
    },

    getConfig: function ( ) {
        
        console.log('getconfig called');
        
        if(config){
            console.log('public config set ' + config);
            return config;
        }
        else if (this.config){
            console.log('this config set ' + this.config);
            return this.config;
        }
        else{
            var callback = this.setConfig;
           // console.log(this);
            var file = 'config.json';
                
            if(typeof(XMLHttpRequest) === 'undefined'){
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
                            //console.log(xhr.responseText);
                            callback.apply(xhr.responseText);
                        }
                    };
                    xhr.send(null);
                }
                catch (e) {
                    console.log(e);
                }
            }
            else{
                //we're in a browser!
                try{
                    var xhr = new XMLHttpRequest();
                    xhr.overrideMimeType("application/json");
                    xhr.open('GET', file, false);
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
            }
            
            return;
        }
    },

    setConfig: function ( configContents ) {
        var result = JSON.parse(configContents);
        config = result;
//        console.log(this);
//        this.config = result;
        return;
    },
};