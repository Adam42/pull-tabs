function getURL( url ) {
    var xhr = new XMLHttpRequest();
    var file = 'file:///Users/adam/Dropbox/Sites/pullTabs/config.json';

    console.log(xhr);
    if(typeof(XMLHttpRequest) === 'undefined'){
        //we're in node.js for testing
        console.log('node.js for testing');
        console.log("Using node.js xhr");
        var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;   
        try{   
            xhr = new XMLHttpRequest();
            xhr.open('GET', file, true);
            xhr.setRequestHeader("Content-type: application/json");

            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == "200") {
                    //console.log(xhr.responseText);
                    callback.apply(xhr.responseText);
                }
            };
            xhr.send(null);
        }
        catch (e) {
            console.log(e);
        }
    }
    else{
        //we're in a browser!
        try{
            xhr = new XMLHttpRequest();
            xhr.overrideMimeType("application/json");
            xhr.open('GET', file, false);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == "200") {
                    callback.apply(xhr.responseText);
                }
            };
            xhr.send(null);
        }
        catch (e) {
            console.log(e);
        }
    }

    return;
}

getURL(url);
