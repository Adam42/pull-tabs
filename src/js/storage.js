/**
 * Wrapper around browser promise-based local storage calls
 */
export default class storage {
  constructor() {}

  /**
     * Store an object into browser local storage
     * @param  {object} object [description]
     * @return {Promise}        [description]
     */
  static store(object) {
    return browser.storage.local.set(object);
  }

  /**
     * Save an object to local storage via a key
     *
     * @param  {string} key    Local storage key
     * @param  {object} object The object to save
     * @return {[type]}        [description]
     */
  save(key, object) {
    try {
      browser.storage.local.set(object, function() {
        var status = document.getElementById("status");
        status.textContent = key + " saved.";
        setTimeout(function() {
          status.textContent = "";
        }, 750);
      });
    } catch (e) {
      console.log(e);
    }
  }

  /**
     * Get an object from local storage
     *
     * @param  {string}   key      The name of key in local storage
     * @return {Promise}           Promise represents object retrieved from local storage
     */
  static retrieve(key) {
    return browser.storage.local.get(key);
  }
}
