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
        outputCookies.push(['','Name','Domain']);
        // outputCookies.push(['Name','Domain','Select']);

        //put cookies into table format

        //TODO - See if we can pass the unmodified cookies, keep headers same
        var cookieData = [];
        for (var i = 0; i < cookies.length; i++) {
            var cook = cookies[i];
            var key = cook.domain.concat(cook.name); 
            // var showMoreButton = $("button").on('click',function() {
            //     exp
            // });
            var name = cook.name;
            var domain = cook.domain;


            // Either pass this data, or the whole cookie
            cookieData.push({
                "name":cook.name,
                "value":cook.value,
                "domain":cook.domain,
                "expirationDate":cook.expirationDate,
                "hostOnly":cook.hostOnly,
                "path":cook.path,
                "secure":cook.secure
            });

            // $('button').on('click', 'td.details-control', function () {
            //     var tr = $(this).closest('tr');
            //     var row = table.row( tr );
         
            //     if ( row.child.isShown() ) {
            //         // This row is already open - close it
            //         row.child.hide();
            //         tr.removeClass('shown');
            //     }
            //     else {
            //         // Open this row
            //         row.child( format(row.data()) ).show();
            //         tr.addClass('shown');
            //     }
            // } );
            outputCookies.push(['',name, domain]);
        }
        Promise.all([cookies, styleP]).then(createGraph);
        //TODO - Create if statement to check if we're in the popup or webapp, call appropriate function
        createTable(outputCookies, '#outputCookies', ['cookieTableWebapp', '100%', [
            [15, 25, 100, -1],
            [15, 25, 100, 'All']
        ]],cookieData);
        
    });
}