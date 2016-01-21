
/* 
modifications made to removeSelectedCookies:
    -now requires an array of selected cookies
    -no longer uses check boxes
*/
function removeSelectedCookies(selected) {
    chrome.cookies.getAll({},
        function (cookies) {
            console.log("trying to remove:" + selected[0]);

            for (var i = 0; i < selected.length; i++) {
                for (var j = 0; j < cookies.length; j++) {
                    var cookie = cookies[j];

                    curSelected = selected[i];
                    if (cookie.name == curSelected[0] && cookie.domain == curSelected[1]) {
                        chrome.cookies.remove({
                            url: "http" + ((cookie.secure) ? "s" : "") + "://" + cookie.domain,
                            name: cookie.name
                        });
                        console.log('cookie removed');
                    }
                }
            }
        });
//    DataTables dynammically updates the table so we don't have to reload the page
//    location.reload();
};

/*
In addition to getting all cookies, also creates an array (outputCookies) with data 
for the HTML table.
*/
function getAllCookies() {
    chrome.cookies.getAll({}, function (cookies) {
        var outputCookies = [];
        outputCookies.push(["Name", "Domain"]);
        for (var i = 0; i < cookies.length; i++) {
            var cook = cookies[i];
            var key = cook.domain.concat(cook.name);
            $(".cookie").append("<div id= \"" + key.replace(/\./g, '') + "\">" + "Name: " + cook.name + "\nValue: " + cook.value + "\nDomain: " + cook.domain + "<input type=\"checkbox\" name=\"" + cook.name + " " + cook.domain + "\"></div>");

            chrome.storage.local.get(key, function (obj) {
                var urlKey = Object.keys(obj)[0];
                var setterInfo = obj[urlKey];
                var id = "#".concat(urlKey).replace(/\./g, '');
//                $(id).append("<p>Set By: " + setterInfo.sourceUrl + "</p>");
            });
            //put cookies into table format
            outputCookies.push([cook.name, cook.domain]);
        }
        $(".count").append("<p>Number of cookies: " + cookies.length + "</p>");
        createTable(outputCookies,".outputCookies");
        return;
    });
};

// adapted from http://stackoverflow.com/a/15164958
function createTable(data, cookieDiv) {
    var table = document.createElement('table')
        , tableBody = document.createElement('tbody')
        , tableHeader = document.createElement('thead');
    
    // DataTable attributes
    table.setAttribute("class","display compact");
    table.setAttribute("id","cookieTable");
    table.setAttribute("width","100%");
    table.setAttribute("cellspacing","0");
    
    // convert first array in array to the HTML header row
    var headerData = data.slice(0,1)[0];
    var row = document.createElement('tr');
    headerData.forEach(function(cellData) {
        var cell = document.createElement('th'); 
        cell.appendChild(document.createTextNode(cellData));
        row.appendChild(cell);
    });
    tableHeader.appendChild(row);
    
    // convert the rest of the array into the HTML data
    var tableData = data.slice(1,data.length);
    tableData.forEach(function(rowData) {
        var row = document.createElement('tr');
        rowData.forEach(function(cellData) {
            var cell = document.createElement('td');
            cell.appendChild(document.createTextNode(cellData));
            row.appendChild(cell);
        });
        tableBody.appendChild(row);
    });

    table.appendChild(tableHeader);
    table.appendChild(tableBody);
    
    $(cookieDiv).append(table);
    
    initializeDataTable();
};

function initializeDataTable() {
    var cookieTable = $('#cookieTable').DataTable({
        "lengthMenu": [[15, 25, 100, -1], [15, 25, 100, "All"]]
    });
    
    // allows a single row to be selected
    $('#cookieTable tbody').on( 'click', 'tr', function () {
        if ( $(this).hasClass('selected') ) {
            $(this).removeClass('selected');
        }
        else {
            cookieTable.$('tr.selected');//.removeClass('selected');
            $(this).addClass('selected');
        }
    } );
    
    // button removes selected rows
    $('#buttonRemoveRow').click( function () {
        
        // convert html into an array. adapted from http://stackoverflow.com/a/9579792
        var selectedCookies = [];
        cookieTable.$('tr.selected').each(function() {
            var arrayOfThisRow = [];
            var tableData = $(this).find('td');
            if (tableData.length > 0) {
                tableData.each(function() { arrayOfThisRow.push($(this).text()); });
                selectedCookies.push(arrayOfThisRow);
            }
        });
        console.log(selectedCookies);
        
        $(cookieTable.$('tr.selected')).remove();
        removeSelectedCookies(selectedCookies);
    } );
};

function removeAllCookies() {
    chrome.cookies.getAll({},
        function (cookies) {
            var startNum = cookies.length;
            for (var j = 0; j < cookies.length; j++) {
                var cookie = cookies[j];

                if (cookie.domain.charAt(0) != ".") {
                    console.log(cookie.domain);
                    chrome.cookies.remove({
                        url: "http://" + cookie.domain,
                        name: cookie.name
                    });
                    chrome.cookies.remove({
                        url: "https://" + cookie.domain,
                        name: cookie.name
                    });
                    chrome.cookies.remove({
                        url: cookie.domain,
                        name: cookie.name
                    });
                } else {
                    console.log(cookie.domain);
                    cookie.domain = cookie.domain.substring(1, cookie.domain.length)
                    chrome.cookies.remove({
                        url: "http://" + cookie.domain,
                        name: cookie.name
                    });
                    chrome.cookies.remove({
                        url: "https://" + cookie.domain,
                        name: cookie.name
                    });
                    chrome.cookies.remove({
                        url: cookie.domain,
                        name: cookie.name
                    });
                }

            }
            var endNum = cookies.length - startNum;
            console.log(endNum);
        });
    location.reload();
};

function openWebapp() {
    var newURL = "/webapp.html";
    chrome.tabs.create({ url: newURL });
};

$(function () {
    $("#DeleteAll").click(removeAllCookies);
    getAllCookies();
    $("#WebApp").click(openWebapp);

});