var Form = {

    options: '',

    init: function (values) {
        console.log('init Form');
        this.options = values;
    },

    createForm: function (tabs) {
        this.getOptions(function(options){

            pullTabs.assembleForm( tabs, options );
            return;
        });

        this.watchSubmit(tabs);
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

            var type = this.mType.split("/").shift().toLowerCase();

            var pref = options[type] ? options[type] : 'ignore';

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

        results.downloads = downloadURLs;
        results.pockets = pocketURLs;
        results.ignores = ignoreURLs;

        return results;
    },

    getTabStatus: function(tabs){
            var results = pullTabs.getSelectedTabs(tabs.length);

            Browser.downloadUrls(results.downloads);
            Pocket.saveTabsToPocket(results.pockets);
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
        console.log( items );
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

};
console.log(Form);

Form.init('test');

console.log(Form);
//var form = new Form();