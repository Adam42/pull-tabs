var saveTabsAs = {

	init: function() {
		saveTabsAs.getTabs();
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
				label.innerHTML = '<p>Title: ' + tab.title + '</p><p> Type: ' + this.response + '</p>';
				if(this.response.split("/").shift() == 'image'){
					label.innerHTML += '<img src=' + tab.url + '/>';
				}
				label.appendChild(input);

			var li = document.createElement('li');
				li.appendChild(label);

			resources.appendChild(li);
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
			xhr.open("GET", url, false);
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

	getExtension: function(url){
		return url.split('.').pop();
	},

	watchSubmit: function (tabs) {
		var checked = document.getElementById('list');
		checked.addEventListener('submit', function(){saveTabsAs.getTabStatus(tabs)});
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