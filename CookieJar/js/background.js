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

function shortDomain(url) {
    var split = url.split('.');
    var finalString;
    if (split.length < 2) {
        return url;
    }
    finalString = split[split.length-2].concat('.');
    return finalString.concat(split[split.length-1]);
}
                                     
chrome.cookies.onChanged.addListener ( function (changed) {
    var cookie = changed.cookie;
    var cause = changed.OnChangedCause;
    if (changed.removed) {
        var key = shortDomain(cookie.domain).concat(cookie.name);
        chrome.storage.local.remove(key,function () {})
    }
});

function setDomainInfo(key,domain,callback) {
    chrome.storage.local.get( key,function(item){
        var setObject = item[key];
        if (typeof setObject != 'object') {
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

//adapted from code @ https://github.com/chenyoufu/hack-http-headers/blob/master/js/hack-http-headers.js
var filter = {urls: ["<all_urls>"]};

chrome.webRequest.onSendHeaders.addListener(function(details){
    getCookiesFromHeaders(details.requestHeaders, details.url);
}, filter, ["requestHeaders"]);

chrome.webRequest.onHeadersReceived.addListener(function(details){
    getCookiesFromHeaders(details.responseHeaders,details.url);
}, filter, ["responseHeaders"]);

function getCookiesFromHeaders(headers, domain) {
    var cookies = [];
    var referer = '';
    domain = shortDomain(extractDomain(domain));
    if(headers === 'undefined'){
        return;
    }
    for (var i = 0; i< headers.length; ++i) {
        var headerName = headers[i].name;
        var headerVal = headers[i].value;
        if (headerName.toLowerCase() === 'cookie') {
            cookies = headerVal.split(';');
        }
        if (headerName.toLowerCase() === 'referer') {
            referer = shortDomain(extractDomain(headerVal));
        }
    }
    if (domain != referer) {
        for (var i = 0; i<cookies.length;++i) {
            var cook = cookies[i];
            var key = domain.concat(cook.split('=')[0].trim());
            setDomainInfo(key,referer,function () {});
        }
    }
}