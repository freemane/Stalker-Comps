// var cookies = [];

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
    $(currentURL).empty();
	$(currentURL).append("Here are your cookies relating to "+ domain);
    return domain;
}

/*
In addition to getting all cookies, also creates an array (outputCookies) with data
for the HTML table.
*/
function getAllCookies() {
	chrome.tabs.getSelected(null, function(tab){
		tab = shortDomain(extractDomain(tab.url));
	    chrome.cookies.getAll({'domain':tab}, function (cookies) {
	        var outputCookies = [];
	        var newCookies = [];
	        var cookieData = [];
	        
	        outputCookies.push(['','Name','Domain']);
	        // outputCookies.push(['Name','Domain','Select']);

	        //put cookies into table format

	        //TODO - See if we can pass the unmodified cookies, keep headers same
	        for (var i = 0; i < cookies.length; i++) {
	            var cook = cookies[i];
	            var key = cook.domain.concat(cook.name); 
	            cookieData.push({
	                "name":cook.name,
	                "value":cook.value,
	                "domain":cook.domain,
	                "expirationDate":cook.expirationDate,
	                "hostOnly":cook.hostOnly,
	                "path":cook.path,
	                "secure":cook.secure
            	});
	            // var showMoreButton = $("button").on('click',function() {
	            //     exp
	            // });
	            outputCookies.push(['',cook.name, cook.domain]);
	        }

	        //TODO - Create if statement to check if we're in the popup or webapp, call appropriate function

	        createTable(outputCookies, '#listCookies', ['cookieTablePopup', '500px', [
	            [10, 20, 50, -1],
	            [10, 20, 50, 'All']
	        ]],cookieData)
	    });
	});
}