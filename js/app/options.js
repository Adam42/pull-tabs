"use strict";
var pullTabs = pullTabs || {};
pullTabs.Options = pullTabs.Options || (function () {

    var tabSettings = {},
        opt = {};

    //list of mimetypes we'll act on
    opt.mimeTypes = ['application', 'image', 'message', 'model', 'multipart', 'text', 'video', 'unknown'];
    opt.numOfmimeTypes = opt.mimeTypes.length;

    opt.mimeSettings = {};
    opt.fullMimeType = {
        'retrieveFullMimeType' : false
    };
    opt.layout = {
        'simple' : true,
        'advanced' : false
    };
    opt.autoClose = {
        'autoCloseTabs' : false
    };

    //list of available actions to apply to a tab
    opt.tabActions = ['ignore', 'download', 'pocket', 'bookmark', 'close'];

    opt.tabOptions = ['enabled', 'disabled'];

    opt.numOftabActions = opt.tabActions.length;

    //create a default preferences object to pass to restoreOptions
    //in case there is no existing preferences stored or
    //if stored preferences can't be retrieved will use this default
    function setDefaultMimeTypes() {
        opt.mimeTypes.forEach(function(element){
            opt.mimeSettings[element] = this.tabActions[0];
        }, opt);
    }

    function setDefaultTabActions() {
        opt.tabActions.forEach(function(element){
            tabSettings[element] = this.tabOptions[0];
        }, opt);
    }

    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }


    function createForm() {
        var optionsForm = document.getElementById('file-type-destinations');

        for ( var i=0; i < opt.numOfmimeTypes; i++ ) {
            var panel = document.createElement('div');
                panel.setAttribute('class', 'panel panel-default row');

            var headerDiv = document.createElement('div');
                headerDiv.setAttribute('class', 'panel-heading col-md-2');

            var header = document.createElement('h4');
                header.textContent = capitalize(opt.mimeTypes[i]);

                headerDiv.appendChild(header);
                panel.appendChild(headerDiv);

            var formDiv = document.createElement('div');
                formDiv.setAttribute('class', 'panel-body col-md-10');

                for(var x=0; x < opt.numOftabActions; x++ ) {
                    var label = document.createElement('label');

                    var input = document.createElement('input');
                        input.type = 'radio';
                        input.id = opt.tabActions[x];
                        input.name = opt.mimeTypes[i];
                        input.value = opt.tabActions[x];

                    var span = document.createElement('span');
                        span.textContent = capitalize(opt.tabActions[x]);
                        label.appendChild(input);
                        label.appendChild(span);
                        formDiv.appendChild(label);
                }
                panel.appendChild(formDiv);

                optionsForm.appendChild(panel);
        }

    }

    function bindUIActions() {
        document.getElementById('settings').addEventListener('submit', opt.saveMimeSettings);
        document.getElementById('pocket-status').addEventListener('click', pullTabs.Pocket.checkLink);
        document.getElementById('full-mime-types').addEventListener('click', opt.saveFullMimeType);
        document.getElementById('simple').addEventListener('click', opt.saveLayout);
        document.getElementById('advanced').addEventListener('click', opt.saveLayout);
        document.getElementById('autoclose').addEventListener('click',opt.saveAutoClose);
    }

    function checkPocketStatus(){
        //odd this should be associated with pocketKey?
        console.log(localStorage[pullTabs.user_name]);
        if(typeof(localStorage[pullTabs.access_token]) !== 'undefined' && localStorage[pullTabs.access_token] !== 'access_token' ){
            var pocketStatus = document.getElementById('pocket-status');

            //need to change below to updateAuthStatus as is confusing because not checking
            //if isAuthrozied but updating pocket-status link
//            pullTabs.Pocket.isAuthorized();
            loginStatus = pullTabs.Pocket.checkLocalLoginStatus(); //this actually checks.....
        }
    }

    opt.init = function(){
        bindUIActions();
        setDefaultMimeTypes();
        createForm();
        this.restoreMimeSettings().then( opt.setSettings );
        this.getLayout().then( pullTabs.Options.setLayout );
        this.getAutoClose().then( pullTabs.Options.setAutoClose );

        this.getFullMimeType().then( function( fullMimeType ) {
            pullTabs.Options.setFullMimeType( fullMimeType );
        }).catch( function(e){
            console.log(e);
        });

        checkPocketStatus();
    };

    opt.getMimeTypes = function(){
        return opt.mimeSettings;
    };

    opt.getMimeSettings = function(){
        return opt.mimeSettings;
    };

    opt.restoreMimeSettings = function (callback) {
        return pullTabs.Browser.retrieve( opt.mimeSettings, callback );
    };

    /*
     *
     * Loop through available mimeTypes and apply user's
     * stored preferences to each tab.
     *
    */

    opt.setSettings = function( items ) {
        for ( var i=0; i < opt.numOfmimeTypes; i++ ) {
           var settings = document.getElementsByName(opt.mimeTypes[i]);

            var setting = items[opt.mimeTypes[i]];

           for (var x = 0; x < settings.length; x++){
                if(settings[x].id === setting){
                    opt.mimeSettings[opt.mimeTypes[i]] = settings[x].id;
                    settings[x].checked = true;
                }
                else{
                    settings[x].checked = false;
               }
           }
        }
    };


    opt.setLayout = function ( layout ) {
        var simple = document.getElementById('simple');
        var advanced = document.getElementById('advanced');
        if(layout.simple === true){
            simple.checked = true;
        }
        else{
            simple.checked = false;
        }

        if(layout.advanced === true){
            advanced.checked = true;
        }
        else{
            advanced.checked = false;
        }

    };

    opt.setAutoClose = function( autoclose ) {
        var autoCloseButton = document.getElementById('autoclose');

        if (autoclose.autoCloseTabs === true){
            autoCloseButton.checked = true;
        }
    };

    opt.saveAutoClose = function(){
        var autoCloseButton = document.getElementById('autoclose');

        if(autoCloseButton.checked === true){
            opt.autoClose.autoCloseTabs = true;
        }
        else{
            opt.autoClose.autoCloseTabs = false;
        }

        try{
            pullTabs.Browser.store( opt.autoClose, opt.updateStatusMessage('Autoclose saved.'));
        }
        catch(e){
            console.log(e);
            return false;
        }
    };

    opt.saveLayout = function (){
        var simpleLayout = document.getElementById("simple");
        var advancedLayout = document.getElementById('advanced');

        if(simpleLayout.checked === true){
            opt.layout.simple = true;
        }
        else{
            opt.layout.simple = false;
        }

        if(advancedLayout.checked === true){
            opt.layout.advanced = true;
        }
        else{
            opt.layout.advanced = false;
        }

        try{
            pullTabs.Browser.store( opt.layout , opt.updateStatusMessage('Layout saved.') );
        }
        catch(e){
            console.log("Chrome storage sync set Exception: ");
            console.log(e);
            return false;
        }

        return true;

    };

    opt.setFullMimeType = function ( fullMimeType ) {
        var fullMimeTypeElement = document.getElementById('full-mime-types');
        if(fullMimeType.retrieveFullMimeType === true){
            fullMimeTypeElement.checked = true;
        }
        else{
            fullMimeTypeElement.checked = false;
        }
        return;
    };

    opt.saveFullMimeType = function (){
        var isChecked = document.getElementById('full-mime-types').checked;

        if(isChecked === true){
            opt.fullMimeType.retrieveFullMimeType = true;
        }
        else{
            opt.fullMimeType.retrieveFullMimeType = false;
        }

        try{
            pullTabs.Browser.store( opt.fullMimeType, opt.updateStatusMessage('Full mime type saved.') );
        }
        catch(e){
            console.log("Chrome storage sync set Exception: ");
            console.log(e);
            return false;
        }

    };

    opt.updateStatusMessage = function (message) {
        var status = document.getElementById('status');

            status.classList.add('alert','alert-success');
            status.classList.remove('hidden');
            status.textContent = message;
            status.style.top = 0;

        setTimeout( function () {
            status.textContent = '';
            status.classList.remove('alert', 'alert-success');
            status.classList.add('hidden');
        }, 1500);
    };

    opt.getFullMimeType = function () {
        return pullTabs.Browser.retrieve( opt.fullMimeType );
    };

    opt.getLayout = function () {
        return pullTabs.Browser.retrieve( opt.layout );
    };

    opt.getAutoClose = function () {
        return pullTabs.Browser.retrieve( opt.autoClose );
    };

    /*
     *
     * Save user's mimetype prefences to local storage
     *
     *
     */
    opt.saveMimeSettings = function (evt) {
        evt.preventDefault();

        for ( var i=0; i < opt.numOfmimeTypes; i++ ) {
            var settings = document.getElementsByName(opt.mimeTypes[i]);

            for ( var x = 0; x < opt.numOftabActions; x++){
                if(settings[x].checked){
                    opt.mimeSettings[opt.mimeTypes[i]] = opt.tabActions[x];
                }
            }
        }

        try{
            pullTabs.Browser.store(opt.mimeSettings , opt.updateStatusMessage('Mime settings saved') );
        }
        catch(e){
            console.log("Chrome storage sync set Exception: ");
            console.log(e);
            return false;
        }

        return true;

    };

    return opt;

}(pullTabs));

//pullTabs.Options.init();