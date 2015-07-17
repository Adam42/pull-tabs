function get(url, callback) {
 var xhr = new XMLHttpRequest();

    xhr.open("GET", url, true);

    xhr.onload =  function(e) {
        if (xhr.readyState === 4) {
            if(xhr.status === 200) {
                callback(xhr.responseText);
            }
            else{
                console.error(xhr.statusText);
            }
        }
    };

    xhr.onerror = function (e) {
        console.error(xhr.statusText);
    };
    try{
        xhr.send();
    }
    catch(e){
        console.log(e);
    }
}