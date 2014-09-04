var saveTabsAs = {

  init: function() {
    saveTabsAs.requestTabs();
  },


  requestTabs: function() {
    var info = {currentWindow: true};

    var tabs = chrome.tabs.query(info,function(e){saveTabsAs.showUrls(e);}
    );
  },

  showUrls: function (tabs) {
    var ul = document.getElementById('links');

    //document.write('There are ' + tabs.length + ' tabs');

    tabs.forEach(function(tab){
      var li = document.createElement('li');
      var url = document.createTextNode(tab.url);
      li.appendChild(url);
      ul.appendChild(li);
      document.body.appendChild(li);
    });

    var confirm = document.getElementById('confirm');
    confirm.addEventListener('submit',function(){
      var submit = document.querySelector('input[name="confirmation"]:checked').value;
      if(submit === 'yes'){
        saveTabsAs.downloadUrls(tabs);
      }
    });
  },


  downloadUrls: function (urls) {
    urls.forEach(function(url){
      var file = {
        "url": url.url,
        "method": "GET"
        };
        var downloads = chrome.downloads.download(file, function(e){
          console.log(e);
          }
        );
    });
  },
}

document.addEventListener('DOMContentLoaded', function () {
    saveTabsAs.init();
});