function getURL( url ) {

    var file = 'file:///Users/adam/Dropbox/Sites/pullTabs/config.json';

    var xhr;

    if(typeof(XMLHttpRequest) === 'undefined'){
        //we're in node.js for testing
        console.log("Using node.js xhr");
        var NODEXMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
        xhr = new NODEXMLHttpRequest();
    }
    else{
        //we're in a browser!
        xhr = new XMLHttpRequest();
    }
    try{
        xhr.open('GET', file, false);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.overrideMimeType("application/json");

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === "200") {
                callback.apply(xhr.responseText);
            }
        };
        xhr.send(null);
    }
    catch (e) {
        console.log(e);
    }


    return;
}
