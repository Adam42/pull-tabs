var Form = {

    options: '',

    init: function (values) {
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
            label.innerHTML = '<p>Title: ' + tab.title + '</p><p> Type: ' + type + '</p>';
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

    getSelectedTabs: function (tabs) {
        var inputs = tabs.length;
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
                    tabs[i].labelTabId = i;
                    downloadURLs.push(tabs[i]);
                }

                if(radios[1].checked){
                    tabs[i].labelTabId = i;
                    pocketURLs.push(tabs[i]);
                }
            }
            else{
                tabs[i].labelTabId = i;
                ignoreURLs.push(tabs[i]);
            }
        }

        tabs.downloads = downloadURLs;
        tabs.pockets = pocketURLs;
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