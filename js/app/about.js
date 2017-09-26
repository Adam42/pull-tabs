var aboutPullTabs = aboutPullTabs || {
  init: function() {
    var creditLinks = document.getElementById("about-credits");
    var links = creditLinks.getElementsByTagName("a");
    var i;
    var len = links.length;

    for (i = 0; i < len; i++) {
      links[i].addEventListener("click", function(e) {
        var tabKey = {
          url: e.target.href,
          active: false
        };

        pullTabs.Browser.createTab(tabKey);
      });
    }
  }
};
aboutPullTabs.init();
