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
    
var curUrl = undefined;
var curUrlVisitTime = undefined;

chrome.history.onVisited.addListener( function(result) {
    curUrl = result.url;
    curUrlVisitTime = result.lastVisitTime;

});
                                     
chrome.cookies.onChanged.addListener ( function (changed) {
    var cookie = changed.cookie;
    var cause = changed.OnChangedCause;
    if (!changed.removed) {
    	var cookieInfo = {sourceUrl:curUrl,modTime:curUrlVisitTime};
        var key = cookie.domain.concat(cookie.name);
        var setObject = {};
        setObject[key] = cookieInfo;
    	chrome.storage.local.set(setObject, function (){
    		//return function on storage of cookie success
    		chrome.storage.local.get(key,function (item) {
                var info = item[key];
            });
    	});
        // alert("new cookie!: " + cookie.name+ "domain: "+ cookie.domain + "\n set from: "+curUrl);
    }
});