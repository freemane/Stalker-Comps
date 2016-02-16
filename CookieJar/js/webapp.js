/*
In addition to getting all cookies, also creates an array (outputCookies) with data
for the HTML table.
*/
function getAllCookies() {
    var styleP = $.ajax({
        url: './css/graphStyle.cycss',
        type: 'GET',
        dataType: 'text'
    });
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
        Promise.all([cookies, styleP]).then(createGraph);
        //TODO - Create if statement to check if we're in the popup or webapp, call appropriate function
        createTable(outputCookies, '#outputCookies', ['cookieTableWebapp', '100%', [
            [15, 25, 100, -1],
            [15, 25, 100, 'All']
        ]]);
        initializeTabs();
        
    });
}