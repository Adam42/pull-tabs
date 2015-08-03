var pullTabsApp = pullTabsApp || {};
pullTabsApp.Options = pullTabsApp.Options || (function () {

    var mimeSettings = {},
        tabSettings = {},
        opt = {};

    //list of mimetypes we'll act on
    opt.mimeTypes = ['application', 'image', 'message', 'model', 'multipart', 'text', 'video', 'unknown'];
    opt.numOfmimeTypes = opt.mimeTypes.length;

    opt.mimeSettings = [];

    //list of available actions to apply to a tab
    opt.tabActions = ['ignore', 'download', 'pocket', 'bookmark', 'close'];

    opt.tabOptions = ['enabled', 'disabled'];

    opt.numOftabActions = opt.tabActions.length;

    //create a default preferences object to pass to restoreOptions
    //in case there is no existing preferences stored or
    //if stored preferences can't be retrieved will use this default
    function setDefaultMimeTypes() {
        opt.mimeTypes.forEach(function(element){
            mimeSettings[element] = this.tabActions[0];
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
        document.getElementById('settings').addEventListener('submit', opt.saveOptions);
        document.getElementById('pocket-status').addEventListener('click', Pocket.checkLink);
    }

    opt.init = function(){
        bindUIActions();
        setDefaultMimeTypes();
                createForm();
        this.restoreOptions();
    };

    opt.getMimeTypes = function(){
        return mimeSettings;
    };

    opt.restoreOptions = function () {
        chrome.storage.sync.get(mimeSettings, function ( items ) {
            opt.setSettings( items );
        });
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

    /*
     *
     * Save user's mimetype prefences to local storage
     *
     * @to-do Factor out the chrome specific part to Browser
     *
     */

    opt.saveOptions = function (evt) {
        evt.preventDefault();
        var mimeSettings = opt.getMimeTypes();

        for ( var i=0; i < opt.numOfmimeTypes; i++ ) {
            var settings = document.getElementsByName(opt.mimeTypes[i]);

            for ( var x = 0; x < opt.numOftabActions; x++){
                if(settings[x].checked){
                    mimeSettings[opt.mimeTypes[i]] = opt.tabActions[x];
                }
            }
        }

        try{
            chrome.storage.sync.set(mimeSettings , function () {
                var status = document.getElementById('status');
                status.textContent = 'Options saved.';
                setTimeout( function () {
                    status.textContent = '';
                }, 1500);
            });
        }
        catch(e){
            console.log("Chrome storage sync set Exception: ");
            console.log(e);
            return false;
        }

        return true;

    };

    return opt;

}(pullTabsApp));

pullTabsApp.Options.init();