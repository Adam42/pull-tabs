var saveTabsAs = {

    init: function() {

        saveTabsAs.getTabs();
        saveTabsAs.watchMutateCheck();
        saveTabsAs.setActions();
    },

    getTabs: function () {
        var info = {currentWindow: true};

        chrome.tabs.query(info,function(e){
            var tabs = saveTabsAs.createForm(e);
        });
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
        numTabs.innerHTML = "<p> This window has " + tabs.length + " tabs.";

        var resources = document.getElementById('resources');

        tabs.forEach(function(tab) {
            var contentType = saveTabsAs.getContentType(tab.url, function(response){
                this.response = response;
            });

            var input = document.createElement('input');
                input.type = "checkbox";
                input.id = 'tab-' + tab.index;
                input.name = 'tabs' + tab.index;
                input.title = tab.title + this.response;
                input.value = tab.url;
                input.checked = "checked";

            var shortDescription = tab.title.substring(0,10);

            var label = document.createElement('label');
//              label.innerText = shortDescription;
                label.setAttribute('class','list-group-item active');
                label.setAttribute('id','label-tab-' + tab.index);
                label.innerHTML = '<p>Title: ' + tab.title + '</p><p> Type: ' + this.response + '</p>';
                if(this.response.split("/").shift() == 'image'){
                    label.innerHTML += '<img class="img-thumbnail" style="width: 150px; height: 150px;" src=' + tab.url + '/>';
                }
                label.appendChild(input);

                resources.appendChild(label);

        });

        saveTabsAs.watchSubmit(tabs);
    },

    getSelectedTabs: function (inputs) {
        var arr = [];

        for (var i = 0; i < inputs; i++){
            var input = document.getElementById('tab-' + i);
            if(input.checked){
                arr.push(input.value);
            }
        }

        return arr;
    },

    getTabStatus: function(tabs){
            var selectedTabs = this.getSelectedTabs(tabs.length);
            this.downloadUrls(selectedTabs);
    },

    getContentType: function(url, callback){
        var xhr = new XMLHttpRequest();
        var cType = "";
            xhr.open("HEAD", url, false);
            xhr.onload =  function(e) {
                if (xhr.readyState == 4) {
                    if(xhr.status === 200) {
                        callback(xhr.getResponseHeader("Content-Type"));
                    }
                    else{
                        console.error(xhr.statusText);
                    }
                }
            };
            xhr.onerror = function (e) {
                console.error(xhr.statusText);
            };
            xhr.send();

    },

/*  getExtension: function(url){
        return url.split('.').pop();
    },
*/
    setActions: function (){
        var actions = {
            check: function() {saveTabsAs.setAllActive();},
            uncheck: function() {saveTabsAs.setAllInactive();},
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

        for (i=0; i < numLabels; i++ ) {
            if(!labels[i].classList.contains('active')){
                labels[i].classList.add('active');
            }
        }
    },

    setAllInactive: function () {
        var labels = document.querySelectorAll("#resources > label");
        var numLabels = labels.length;

        for (i=0; i < numLabels; i++ ) {
            if(labels[i].classList.contains('active')){
                labels[i].classList.remove('active');
            }
        }
    },

    updateBackground: function (node, label){
        if(label.classList.contains('active')){
            if(!node.checked){
                label.classList.remove("active");
            }
        }
        if(!label.classList.contains('active')){
            if(node.checked){
                label.classList.add("active");
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
                            label.classList.remove("active");
                        }
                    }
                    if(!label.classList.contains('active')){
                        if(node.checked){
                            label.classList.add("active");
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
        checked.addEventListener('submit', function(){saveTabsAs.getTabStatus(tabs);});
    },

    downloadUrls: function (urls) {
        urls.forEach(function(url){
            var file = {
                "url": url,
                "method": "GET"
            };
            var downloads = chrome.downloads.download(file, function(e){
                console.log(e);
            });
        });
    },
}

document.addEventListener('DOMContentLoaded', function () {
    saveTabsAs.init();
});