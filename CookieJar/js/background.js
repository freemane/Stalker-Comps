// from http://stackoverflow.com/a/16504563
        
//chrome.browserAction.onClicked.addListener(function(activeTab){
//  var newURL = "chrome://settings/cookies";
//  chrome.tabs.create({ url: newURL });
//});


// used to clear storage area when changing storage layout
//chrome.storage.local.clear(function(){alert('cleared CookieJar stash');});

//TODO Code review ALL of this (add comments as well)


// On first run opens our FAQ/getting started page (eventually)
function handleFirstRun() {
    var firstRunURL = '/webapp.html#faq';
    var currentVersion = chrome.app.getDetails().version;
    var oldVersion = chrome.storage.local.get('lastVersionRun', function(item) {
        var oldVersion = item.lastVersionRun;
        if (oldVersion != currentVersion) {
            chrome.tabs.create({url: firstRunURL});
        }
        chrome.storage.local.set({'lastVersionRun':currentVersion},handleError);
    });
}
handleFirstRun();

/*
Extracts the subdomain and domain from a url. Removes http://, and /.../..
*/
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
/*
removes any subdomains from the domain name

Doesn't work with "odd" domains with extra periods like .co.uk
*/
function shortDomain(url) {
    var split = url.split('.');
    var finalString;
    if (split.length < 2) {
        return url;
    }
    finalString = split[split.length-2].concat('.');
    return finalString.concat(split[split.length-1]);
}


/*
When cookies are removed from the browser, removes the equivalent entry from our db
*/                                    
chrome.cookies.onChanged.addListener ( function (changed) {
    var cookie = changed.cookie;
    var cause = changed.OnChangedCause;
    if (changed.removed) {
        var key = shortDomain(cookie.domain).concat(cookie.name);
        chrome.storage.local.remove(key,handleError)
    }
});


/*
Stores the 3rd party connection in the option with the corresponding cookie object

Appends to an object that already exists if it can, otherwise creates a new object 
*/
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
//
var filter = {urls: ["<all_urls>"]};

//Listener for cookies being sent from browser to host
chrome.webRequest.onSendHeaders.addListener(function(details){
    getCookiesFromHeaders(details.requestHeaders, details.url);
}, filter, ["requestHeaders"]);

//Listener for cookies being received
chrome.webRequest.onHeadersReceived.addListener(function(details){
    getCookiesFromHeaders(details.responseHeaders,details.url);
}, filter, ["responseHeaders"]);


/*
Parses http headers to get cookies being set, then stores the domain info in storage
*/
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
        if (headerName.toLowerCase() === 'set-cookie') {
            cookies.push(headerVal.split('=')[0]);
        }
        if (headerName.toLowerCase() === 'referer') {
            referer = shortDomain(extractDomain(headerVal));
        }
    }
    //Checks to make sure only storing 3rd party headers
    if (domain != referer && referer.length>0) {
        for (var i = 0; i<cookies.length;++i) {
            var cook = cookies[i];
            var key = domain.concat(cook.split('=')[0].trim());
            setDomainInfo(key,referer,handleError);
        }
    }
}