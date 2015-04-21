QUnit.test( "hello test", function( assert ) {
  assert.ok( 1 == "1", "Passed!" );
});
/*
QUnit.asyncTest("test Get JSON config file", function( assert) {
    expect(1);

    var config = get(url, callback);


} );
*/

QUnit.asyncTest("Get App Name", function( assert ) {
    expect(1);
    var result;
    get('/config.json', function(response){
        var result = JSON.parse(response);
        assert.strictEqual(result.app.name, 'Pull Tabs');
        QUnit.start();
    });
});
console.log(typeof(sessionStorage));
console.log(window.localStorage);


//console.log(typeof(Config));
var setter = new Config();

var settings = setter.getConfig();

console.log('settings ' + settings);

if(settings === ''){
    setter.settings = 'test';

   setter.loadConfig();
}
//console.log(setter);
//console.log(setter.getConfig());
console.log(setter.getConfig());


//console.log('test ' + test.test);


//console.log(config.getConfig(config.setConfig));
//console.log(config);



//QUnit.asyncTest("Load global config variable", function( assert ) {
//    expect(1);

   // Config.init();

     //   assert.strictEqual(config.app.name, 'Pull Tabs');
       // QUnit.start();
//});


