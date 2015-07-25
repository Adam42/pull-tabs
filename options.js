var Options = (function () {

    var mimeSettings = {},
    opt = {};

    opt.mimeTypes = ['application', 'image', 'message', 'model', 'multipart', 'text', 'video', 'unknown'];
    opt.numOfmimeTypes = opt.mimeTypes.length;

    opt.tabActions = ['ignore', 'download', 'pocket'];

    function setDefaultMimeTypes() {
        opt.mimeTypes.forEach(function(element){
            mimeSettings[element] = opt.tabActions[0];
        }, this);
    }

    opt.init = function(){
        document.getElementById('settings').addEventListener('submit', Options.saveOptions );
        setDefaultMimeTypes();
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

    opt.setSettings = function( items ) {
    for ( var i=0; i < opt.numOfmimeTypes; i++ ) {
        var settings = document.getElementsByName(opt.mimeTypes[i]);

        var download = settings[0];
        var pocket = settings[1];
        var ignore = settings[2];

        download.checked = false;
        pocket.checked = false;
        ignore.checked = false;

        download.parentNode.classList.remove('active');
        pocket.parentNode.classList.remove('active');
        ignore.parentNode.classList.remove('active');

        if( items[opt.mimeTypes[i]] === 'download') {
            download.checked = true;
            download.parentNode.classList.add('active');
        }
        else if ( items[opt.mimeTypes[i]] === 'pocket' ) {
            settings[1].checked = true;
            pocket.parentNode.classList.add('active');
        }
        else if ( items[opt.mimeTypes[i]] === 'ignore' ) {
            settings[2].checked = true;
            ignore.parentNode.classList.add('active');
        }
    }
};

    opt.saveOptions = function (evt) {
        evt.preventDefault();
        var mimeSettings = opt.getMimeTypes();

        for ( var i=0; i < opt.numOfmimeTypes; i++ ) {
            var settings = document.getElementsByName(opt.mimeTypes[i]);

            var download = settings[0].checked;
            var pocket = settings[1].checked;
            var ignore = settings[2].checked;

            if(download){
                mimeSettings[opt.mimeTypes[i]] = 'download';
            }
            else if(pocket){
                mimeSettings[opt.mimeTypes[i]] = 'pocket';
            }
            else if(ignore){
                mimeSettings[opt.mimeTypes[i]] = 'ignore';
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

}());

Options.init();