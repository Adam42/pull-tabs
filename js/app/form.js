var Form = {

    options: '',

    init: function (values) {
        this.options = values;
    },

    createForm: function (tabs) {
        this.getOptions(function(options){

            pullTabs.App.assembleForm( tabs, options );
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
        if(value === defaultPref){
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
        var label = document.createElement('label');
            label.setAttribute('class','list-group-item ' + active);
            label.setAttribute('id','label-tab-' + tab.index);
            label.innerHTML = '<p>Title: ' + tab.title + '</p>';
            //if Full Mime Type add mimetype
            //@to-do Pull the setting from Options page
            //label.innerHTML = label.innerHTML + "<p> Type: " + type + "</p>";

            if(type.split("/").shift() === 'image'){
                label.innerHTML += '<img class="img-thumbnail" style="width: 150px; height: 150px;" src=' + tab.url + '/>';
            }

        return label;
    },

    toggleLabels: function(label) {
        label.addEventListener('click', function () {
            var input = label.getElementsByTagName('input')[0];
            if(label.classList.contains('active')){
                if(!input.checked){
                    label.classList.remove("active");
                }
            }
            if(!label.classList.contains('active')){
                if(input.checked){
                    label.classList.add('active');
                }
            }

        });
    },

    setLabelStatus: function ( tab, status ){
        var label = document.getElementById('label-tab-' + tab.labelTabId);
            label.setAttribute('class', label.className + ' ' + status);
    },

    updateStatus: function (tab, text){

        var label = document.getElementById('status');
        var link = document.createElement('a');
        var status = document.createElement('p');
        var message = document.createTextNode(text);

            link.title = tab.title;
            link.href = tab.url;
            link.innerHTML = tab.title;

            status.appendChild(message);
            status.appendChild(link);
            label.appendChild(status);
            label.removeAttribute('class', 'hidden');
    },

    assembleForm: function ( tabs, options ){
        var resources = document.getElementById('resources');

        tabs.forEach(function(tab) {

            pullTabs.App.getContentType(tab.url, function(response){
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

            var input = pullTabs.App.createCheckbox ( tab, type, checked );


            if(pref === 'download'){

            }
            var radioDown = pullTabs.App.createRadioInput ( tab, 'download', pref );
            var radioPocket = pullTabs.App.createRadioInput ( tab, 'pocket', pref );
            var radioIgnore = pullTabs.App.createRadioInput ( tab, 'ignore', pref );


            var label = pullTabs.App.createLabel ( tab, type, active );

            label.appendChild(input);
            label.appendChild(radioDown);
            label.appendChild(radioPocket);
            label.appendChild(radioIgnore);

            resources.appendChild(label);

        });
    },

    getSelectedGroup: function () {
        var group =  document.getElementById();
    },

    getSelectedTabs: function (tabs) {
        var inputs = tabs.length;
        var downloadURLs = [];
        var pocketURLs = [];
        var bookmarkURLs = [];
        var closeURLs = [];
        var ignoreURLs = [];
        var results = [];

        var i;

        for ( i=0; i < inputs; i++){
            var input = document.getElementById('tab-' + i);
            if(input.checked){
                var radios = document.getElementsByName('tab-pref-' + i);
                var x;
                tabs[i].labelTabId = i;
                for ( x=0; x < radios.length; x++){
                    if(radios[x].checked){
                        var action = radios[x].value;
                        switch (action){
                            case "download":
                                downloadURLs.push(tabs[i]);
                                break;
                            case "pocket":
                                pocketURLs.push(tabs[i]);
                                break;
                            case "bookmark":
                                bookmarkURLs.push(tabs[i]);
                                break;
                            case "close":
                                closeURLs.push(tabs[i]);
                                break;
                            default:
                                console.log("Ignoring" + tabs[i]);
                                ignoreURLs.push(tabs[i]);
                                break;
                        }
                    }
                }
            }
            else{
                ignoreURLs.push(tabs[i]);
            }
        }

        tabs.downloads = downloadURLs;
        tabs.pockets = pocketURLs;
        tabs.closes = closeURLs;
        tabs.bookmarks = bookmarkURLs;
        tabs.ignores = ignoreURLs;

        return tabs;
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