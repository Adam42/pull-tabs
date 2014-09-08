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

		var resources = document.getElementById('resources');

		tabs.forEach(function(tab) {

			var input = document.createElement('input');
				input.type = "checkbox";
				input.id = 'tab-' + tab.index;
				input.name = 'tabs' + tab.index;
				input.title = tab.title;
				input.value = tab.url;
				input.checked = "checked";

			var shortDescription = tab.title.substring(0,10);

			var label = document.createElement('label');
				label.innerText = shortDescription;
				label.appendChild(input);

			var li = document.createElement('li');
				li.appendChild(label);

			resources.appendChild(li);
		});

		saveTabsAs.watchSubmit(tabs);
	},

	getSelectedTabs: function (inputs) {
		var arr = [];
		console.log(inputs);

		for (var i = 0; i < inputs; i++){
			var input = document.getElementById('tab-' + i);
			if(input.checked){
				arr.push(input.value);
			}
		}
		return arr;
	},

	getTabStatus: function(tabs){

		var allTabs = document.getElementById('tabs-ALL');

		if(!allTabs.checked){

			var selectedTabs = this.getSelectedTabs(tabs.length);

			this.downloadUrls(selectedTabs);

			return;
		}

		var urls = this.getUrls(tabs);

		this.downloadUrls(urls);

		return;
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