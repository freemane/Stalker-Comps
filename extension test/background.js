// from http://stackoverflow.com/a/16504563


//On first run opens our FAQ/getting started page (eventually), 
//var firstRunURL = "http://google.com"
//var currentVersion = chrome.app.getDetails().version;
//var oldVersion = data.lastVersionRun;
//data.lastVersionRun = currentVersion;
//if (oldVersion != currentVersion) {
//    if (oldVersion== undefined) {
//        chrome.tabs.create({url: firstRunURL});
//    } 
//}
    
        
//chrome.browserAction.onClicked.addListener(function(activeTab){
//  var newURL = "chrome://settings/cookies";
//  chrome.tabs.create({ url: newURL });
//});
    
var curUrl= undefined;

chrome.history.onVisited.addListener( function(result) {
    
    curUrl = result.url;
});
                                     
chrome.cookies.onChanged.addListener ( function (changed) {
    var cookie = changed.cookie;
    var cause = changed.OnChangedCause;
    if (!changed.removed) {
        alert("new cookie!: " + cookie.name+ "domain: "+ cookie.domain + "\n set from: "+curUrl);
    }
});