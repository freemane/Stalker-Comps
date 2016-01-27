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


// used to clear storage area when changing storage layout
// chrome.storage.local.clear(function(){alert('cleared CookieJar stash');});



function getCurrentTab(callback) {
    chrome.tabs.query(
        {
            active: true,
            lastFocusedWindow: true
        }, function (tabs) {
            callback(tabs[0]);
        });
}
function extractDomain(url) {
    var domain;
    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    }
    else {
        domain = url.split('/')[0];
    }

    //find & remove port number
    domain = domain.split(':')[0];
    return domain;
}
                                     
chrome.cookies.onChanged.addListener ( function (changed) {
    var cookie = changed.cookie;
    var cause = changed.OnChangedCause;
    if (!changed.removed) {
        getCurrentTab(function (tab) {
            var key = cookie.domain.concat(cookie.name);
            if (typeof tab === 'undefined') {
                return;
            }
        	var domain = extractDomain(tab.url);
            setDomainInfo(key,domain,function () {
                //idk
            });
        // alert("new cookie!: " + cookie.name+ "domain: "+ cookie.domain + "\n set from: "+curUrl);
        });
    }
});

function setDomainInfo(key,domain,callback) {
    chrome.storage.local.get( key,function(item){
        var setObject = item[key];
        if (typeof setObject != 'object') {
            console.log(typeof item);
            var t = new Date();
            setObject= {domains:{},setTime:t.getTime(),count:0};
        } 
        if (typeof setObject['domains'][domain] === 'undefined'){
            setObject['domains'][domain] = 0;
        }
        setObject['domains'][domain]++;
        setObject['count']++;
        var newObj = {};
        newObj[key] = setObject;
        chrome.storage.local.set(newObj, callback);
    });
}

function handleError(lastError) {
    if (lastError){
        console.log(lastError.message)
    }
}