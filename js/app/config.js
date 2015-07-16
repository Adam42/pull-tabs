///popup.js
/*
function Config(){
    this.consumer_key;
    this.mode;
    this.app_name;
}
*/

function Config(){
}

Config.prototype = {


    file : '/config.json',

    setConfig : function ( setting ){
//        console.log(setting);
        this.settings = setting;
//       console.log(this);

//    return this;
    },

    loadConfig : function( ){
        console.log(this);
//        this.SetConfig();
//        Config.setConfig.bind(Config);
//console.log(Config);
        var callback = Config.setConfig.bind(Config);
        console.log(callback);
        get(this.file, callback);
    },

};

Config.prototype.getConfig = function ( settings ){

    };

//Config.prototype.setConfig = 

Config.prototype.getConfig = function( ){
    return this.settings;
};

var config = new Config();
console.log(config.settings);

config.setConfig('test');
console.log(config.getConfig());
console.log(config.settings);

/*

var CONFIG = ( function () {
    var settings = {
        file: '/config.json',
        mode: '',
        key: '',
    };

    complete = false;

    if(settings.name === 'undefined'){
        console.log('yo');

        load();
    }

    function load() {
        settings.name = "PullTabs";
        return settings;
    }

    settings.get = function(){

    };

    return settings;

//    return settings;
} () );

console.log(CONFIG.file);


if(CONFIG.name === ''){console.log('ha');}

//console.log(CONFIG.getSettings);

//Config.prototype.loadConfig = 
*/
/*
Config.prototype.getConfig = function( callback ){
    get(this.file, function(e){
//            console.log(e);
        callback(e);
    });
    return this;
};
*/
/*
var
config,
prefs,
ConfigObject = {

    file: '/config.json',
    
    init: function(  ) {

        if(typeof(config) === 'undefined'){
            this.getConfig(this.setConfig.bind(this));
        }

        if(config){
            console.log(config);
        }
    },
    
    getConfig: function ( callback ) {
        get(this.file, callback);
    },

    setConfig: function ( configContents ) {
        config = JSON.parse(configContents);
    },
};

/*
    
///pulltabs.js
    
var
config,
prefs,
pullTabs = {

    tabs: '',
    
    init: function(  ) {

        if(typeof(config) === 'undefined'){
            
            this.getConfig();
            
            //this.setConfig(testConfig);
            
//            console.log('Final config: ' + config);
            
//            this.getConfig(this.setConfig);
        }
        
        console.log('testConfig now: ' + config);

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
}*/
/*
document.addEventListener('DOMContentLoaded', function () {
    console.log('Using config.js');
//    pullTabs.init();
});*/