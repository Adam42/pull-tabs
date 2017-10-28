/**
     * Retrieve the URLs represented in tabs collection
     * @param  {array} tabs Collection of tab objects
     * @return {array}      Collection of URLs from user's tabs
     */
export function getUrls(tabs) {
  var urls = [];

  tabs.forEach(function(tab) {
    urls.push(tab.url);
  });

  return urls;
}
