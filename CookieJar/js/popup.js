// var cookies = [];
// function getCurrentTab () {
// 	return chrome.tabs.getSelected(null, function(tab) {
// 		return shortDomain(extractDomain(tab.url));
// 	});
// }

/*
In addition to getting all cookies, also creates an array (outputCookies) with data
for the HTML table.
*/
function getAllCookies() {
    chrome.cookies.getAll({}, function (cookies) {
        var outputCookies = [];
        var newCookies = [];
        outputCookies.push(['Name','Domain']);
        // outputCookies.push(['Name','Domain','Select']);

        //put cookies into table format

        //TODO - See if we can pass the unmodified cookies, keep headers same
        for (var i = 0; i < cookies.length; i++) {
            var cook = cookies[i];
            var key = cook.domain.concat(cook.name); 
            // var showMoreButton = $("button").on('click',function() {
            //     exp
            // });
            outputCookies.push([cook.name, cook.domain]);
        }

        //TODO - Create if statement to check if we're in the popup or webapp, call appropriate function

        createTable(outputCookies, '#listCookies', ['cookieTablePopup', '500px', [
            [10, 20, 50, -1],
            [10, 20, 50, 'All']
        ]])
    });
}