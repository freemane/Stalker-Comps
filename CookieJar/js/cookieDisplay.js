
/*
GLOBAL VARIABLES
*/

// variables for displaying tabs
var tabLinks = new Array();
var contentDivs = new Array();
var myCookies = [];
chrome.cookies.getAll({}, function(cookies) {
    for(var i = 0;i<cookies.length;i++) {
        myCookies.push(cookies[i]);
    }
});
var cookieTable;
// var cookies = chrome.cookies.getAll(function(cookies) {});


// Starts the extension
//TODO Create globalish variable for allCookies (do this once) and pass when needed
//TODO Consolidate selectAll function
$(function () {
    $('#DeleteAll').click(removeAllCookies);
    getAllCookies();
    $('#WebApp').click(openWebapp);
    $('#SelectAll').click(selectAll);
    $('#UnselectAll').click(unselectAll);
    $('[data-toggle="popover"]').popover();
});

/*
Attempts to remove all cookies using the chrome.cookies API, refreshes page 

Check to see if we can simplify the process with '*'
*/
function removeAllCookies() {
    chrome.cookies.getAll({},
        function (cookies) {
            for (var j = 0; j < cookies.length; j++) {
                var cookie = cookies[j];
                if (cookie.domain.charAt(0) != '.') {
                      deleteCookie(cookie.domain,cookie.name,cookie.storeId,cookie.value);
                } else {
                    cookie.domain = cookie.domain.substring(1, cookie.domain.length)
                    deleteCookie(cookie.domain,cookie.name,cookie.storeId,cookie.value);
                }
            }
        });
    location.reload();
};

//TODO Consolidate this function and removeAllCookis to one, pass different lists of cookies
function removeSelectedCookies(selected) {
    chrome.cookies.getAll({},
        function (cookies) {

            //TODO Call deleteCookie on the selected list only, w/o the getAll call
            for (var i = 0; i < selected.length; i++) {
                for (var j = 0; j < cookies.length; j++) {
                    var cookie = cookies[j];

                    curSelected = selected[i];
                    if (cookie.name == curSelected[0] && cookie.domain == curSelected[1]) {
                      var url = "http" + ((cookie.secure == true) ? "s" : "")+"://"+cookie.domain;
                        deleteCookie(url,cookie.name,cookie.storeId,cookie.value,cookie.secure);
                    }
                }
            }
        });
    //    DataTables dynammically updates the table so we don't have to reload the page
        //location.reload();
};

/*
Removes cookie, given it's url, name, storeId, value, and secure boolean
*/
function deleteCookie(url,name,store,value,secure,callback){
    url = "http" + ((secure == true) ? "s" : "")+"://"+url;
	chrome.cookies.remove({
		'url':url,
		'name':name,
		'storeId':store
	}, function(details) {
		if(typeof callback === "undefined")
			return;
		if(details=="null" || details===undefined || details==="undefined") {
			callback(false);
		} else {
			callback(true);
		}
	});
}


/*
Creates the table in both the webapp and the popup. It converts array, called data,
into an HTML table.

options is an array that can be expanded to include additional table/style choices
code adapted from http://stackoverflow.com/a/15164958
*/
function createTable(data, cookieDiv, options, cookieData) {
    tableName = options[0];
    tableWidth = options[1];
    lengthOption = options[2];

    // we only want the init function to happen once
    if (tableName == 'cookieTableWebapp') {
        initializeTabs();
    }

    var table = document.createElement('table'),
        tableBody = document.createElement('tbody'),
        tableHeader = document.createElement('thead');

    // DataTable attributes
    table.setAttribute('class', 'display compact');
    table.setAttribute('id', tableName);
    table.setAttribute('width', tableWidth);
    table.setAttribute('cellspacing', '0');
    
    // convert first array in array to the HTML header row
    var headerData = data.slice(0, 1)[0];
    tableHeader.appendChild(createRowElements('th', headerData,cookieData));
    table.appendChild(tableHeader);

    // convert the rest of the array into the HTML data
    var tableData = data.slice(1, data.length);

    var index = 0;
    tableData.forEach(function (rowData) {
        tableBody.appendChild(createRowElements('td', rowData,cookieData,tableName,cookieTable, index));
        index = index + 1;
    });
    table.appendChild(tableBody);

    $(cookieDiv).append(table);
    var cookieTable = initializeDataTable(tableName, lengthOption);

};

// Function to add cells to row. Need to change this to add buttons to the row
function createRowElements(cellType, rowData, cookieData, tableName,cookieTable,index) {
    var row = document.createElement('tr');
    var count = 0;
    rowData.forEach(function (cellData) {
        var curCookieData = {
            "name":cookieData[index]
        };
        if(count == 0) {
            // Do stuff
            var cell = document.createElement(cellType);
            var button = document.createElement('div');
            var innerTable = document.createElement('div');
            innerTable = format(innerTable,cookieData);

            $(button).addClass('expandButtonOpen');
            $(button).on('click',function() {
                if($(button).hasClass('expandButtonOpen')) {
                    $(button).removeClass('expandButtonOpen');
                    $(button).addClass('expandButtonClose');
                    expand(tableName,$(row),cookieData[index],cookieTable,false);
                }
                else if($(button).hasClass('expandButtonClose')) {
                    $(button).removeClass('expandButtonClose');
                    $(button).addClass('expandButtonOpen');
                    expand(tableName,$(row),cookieData[index],cookieTable,true);
                }
            });

            cell.appendChild(button);
            row.appendChild(cell);
        }
        else {
            var cell = document.createElement(cellType);
            cell.appendChild(document.createTextNode(cellData));
            row.appendChild(cell);
        }
        count = count + 1;
    });
    return row;    
}

/*
Function that allows for the user to select all cookies in the current table 
*/
function selectAll() {
    var tableName = "cookieTablePopup";
    if(!$("#"+tableName).length) { // The webapp is open
        tableName = "cookieTableWebapp";
    }
    var rows = $('#'+tableName+' > tbody > tr');
    for(var i = 0;i<rows.length;i++) {
        if(!$(rows[i]).hasClass('selected')) {
            $(rows[i]).addClass('selected');
        }
    }
}

/*
Given cookie data, return a string with the HTML for a small table that includes the cookie information
Formatted the date from milliseconds since UNIX epoch to an actual time
*/
/*
Given cookie data, return a string with the HTML for a small table that includes the cookie information
Formatted the date from milliseconds since UNIX epoch to an actual time
*/
function format(cook) {
    var date = new Date(cook.expirationDate * 1000);
    return '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">'+
        '<tr>'+
            '<td>Name:</td>'+
            '<td>'+cook.name+'</td>'+
        '</tr>'+
        '<tr>'+
            '<td>Value:</td>'+
            '<td>'+cook.value+'</td>'+
        '</tr>'+
        '<tr>'+
            '<td>Domain:</td>'+
            '<td>'+cook.domain+'</td>'+
        '</tr>'+
        '<tr>'+
            '<td>HTTP Only:</td>'+
            '<td>'+cook.httpOnly+'</td>'+
        '</tr>'+
        '<tr>'+
            '<td>Host Only:</td>'+
            '<td>'+cook.hostOnly+'</td>'+
        '</tr>'+
        '<tr>'+
            '<td>Expiration Date</td>'+
            '<td>'+date+'</td>'+
        '</tr>'+
        '<tr>'+
            '<td>Secure:</td>'+
            '<td>'+cook.secure+'</td>'+
        '</tr>'+
    '</table>';
}

/*

*/
function expand(tableName,row,data,table,expanded) {
    var rows = $('#'+tableName+' > tbody > tr');
    var tr = row.closest('tr');
    var row = cookieTable.row(tr);
    for(var i = 0;i<rows.length;i++) {
        for(var j = 0;j<myCookies.length;j++) {
            var cook = myCookies[j];
            if((data["name"] == cook.name)&&(data["domain"] == cook.domain) && (data["value"] == cook.value)) {
                if(expanded) {
                    row.child.hide();
                }
                else {
                    row.child(format(cook)).show();
                }
            }
        }
    }
}

/*
Unselect all previously selected cells in the table
*/
function unselectAll() {
    var tableName = "cookieTableWebapp";
    if(!$("#"+tableName).length) { // The webapp is open
        tableName = "cookieTableWebapp";
    }
    var cookieTable = $("#"+tableName);
    var rows = $('#'+tableName+' > tbody > tr');
    for(var i = 0;i<rows.length;i++) {
        if($(rows[i]).hasClass('selected')) {
            $(rows[i]).removeClass('selected');
        }
        if($(rows[i]).hasClass('shift')) {
            $(rows[i]).removeClass('shift');
        }
    }
}

/*
Defines functionality for when a user clicks on a row while holding shift,
allowing for multiple cells to be selected
*/
function shiftClickSelect(curRow,rows) {
    if (curRow.hasClass('shift')) {
        curRow.removeClass('shift');
    } else {
        curRow.addClass('shift');
    }
    // Find the indices of the first selected cell and the shift-clicked cell
    var firstSelectedIndex = -1;
    var shiftSelectedIndex = -1;
    for(var i = 0;i<rows.length;i++) {
        if($(rows[i]).hasClass('selected') && firstSelectedIndex == -1){
            firstSelectedIndex = i;
        }
        if($(rows[i]).hasClass('shift')) {
            shiftSelectedIndex = i;
        }
    }
    // Shift click from the top-down or bottom-up
    var found = false;
    for(var i = 0;i<rows.length;i++) {
        if(i >= firstSelectedIndex && i <= shiftSelectedIndex) {
            if (!$(rows[i]).hasClass('selected')) {
                $(rows[i]).addClass('selected');
                found = true;
            }
        }
    }
    if(!found) {
        for(var i = rows.length-1;i>=0;i--) {
            if(i <= firstSelectedIndex && i >= shiftSelectedIndex) {
                if (!$(rows[i]).hasClass('selected')) {
                    $(rows[i]).addClass('selected');
                }
            }
        }
    }
}

/*
Defines functionality for when a user clicks on a row without holding shift,
expanding the cell to show more info. 
*/
function regularSelect(curRow,rows,cookieTable,tableName){
    //TODO - Remove unnecessary classes (selected, shift, shown)
    for(var i = 0;i<rows.length;i++) {
        if($(rows[i]).hasClass('shift')) {
            $(rows[i]).removeClass('shift')
        }
    }
    var tr = curRow.closest('tr');
    var row = cookieTable.row( tr );
    // If the button was clicked, don't do this
    if (curRow.hasClass('selected')) {
        curRow.removeClass('selected');
    
    } else {
        cookieTable.$('tr.selected'); //.removeClass('selected');
        curRow.addClass('selected');
    }
}

/*
As opposed to createTable, this function incorporates DataTables functionality
to finalize the creation of the table. It adds the ability to select and
delete any number of rows where each row represents a cookie.
Allows for shift clicking to select multiple rows at once
*/

//TODO - Modularize the shiftClick and show functionality into different functions
function initializeDataTable(tableName, lengthOption) {
    cookieTable = $('#' + tableName).DataTable({
        // 'lengthMenu': lengthOption
    });

    // allows a single row to be selected
    $('#' + tableName + ' tbody').on('click', 'tr', function(e) {
        if(e.target.childNodes.length > 0) {
            if(e.target.firstChild.nodeType == 3) {
                var rows = $('#'+tableName+' > tbody > tr');
                // If the shift key is down on the click event...
                if(e.shiftKey) {
                    shiftClickSelect($(this),rows);
                }
                // Otherwise...
                else {
                    regularSelect($(this),rows,cookieTable,tableName);
                }
            }
        }
    });

    // button removes selected rows
    $('#buttonRemoveRow').click(function() {

        // convert html into an array. adapted from http://stackoverflow.com/a/9579792
        var selectedCookies = [];
        cookieTable.$('tr.selected').each(function() {
            var arrayOfThisRow = [];
            var tableData = $(this).find('td');
            if (tableData.length > 0) {
                tableData.each(function() {
                    arrayOfThisRow.push($(this).text());
                });
                selectedCookies.push(arrayOfThisRow);
            }
            // removes all selected rows from table
            cookieTable.row('tr.selected').remove().draw(false);
        });

        $(cookieTable.$('tr.selected')).remove();
        removeSelectedCookies(selectedCookies);
    });
    $('#' + tableName).dataTable();

    return cookieTable;
}

function openWebapp() {
    var newURL = '/webapp.html';
    chrome.tabs.create({
        url: newURL
    });
};

//TODO (Emma) - Explain what is going on here in code review
/*
Matches LI items in the list to the corresponding div with the same ID
*/
function initializeTabs() {
    // Grab the tab links and content divs from the page
    var tabListItems = document.getElementById('tabs').childNodes;
    for (var i = 0; i < tabListItems.length; i++) {
        if (tabListItems[i].nodeName == 'LI') {
            var tabLink = getFirstChildWithTagName(tabListItems[i], 'A');
            var id = getHash(tabLink.getAttribute('href'));
            tabLinks[id] = tabLink;
            contentDivs[id] = document.getElementById(id);
        }
    }

    // Assign onclick events to the tab links, and
    // highlight the first tab
    var i = 0;

    for (var id in tabLinks) {
        tabLinks[id].onclick = showTab;
        tabLinks[id].onfocus = function () {
            this.blur()
        };
        if (i == 0) tabLinks[id].className = 'selected';
        i++;
    }

    // Hide all content divs except the first
    var i = 0;

    for (var id in contentDivs) {
        if (i != 0) contentDivs[id].className = 'tabContent hide';
        i++;
    }
}

/*
Shows the tab most recently clicked on
*/
function showTab() {
    var selectedId = getHash(this.getAttribute('href'));

    // Highlight the selected tab, and dim all others.
    // Also show the selected content div, and hide all others.
    for (var id in contentDivs) {
        if (id == selectedId) {
            tabLinks[id].className = 'selected';
            contentDivs[id].className = 'tabContent';
        } else {
            tabLinks[id].className = '';
            contentDivs[id].className = 'tabContent hide';
        }
    }

    // Stop the browser following the link
    return false;
}

function getFirstChildWithTagName(element, tagName) {
    for (var i = 0; i < element.childNodes.length; i++) {
        if (element.childNodes[i].nodeName == tagName) return element.childNodes[i];
    }
}

function getHash(url) {
    var hashPos = url.lastIndexOf('#');
    return url.substring(hashPos + 1);
}

function shortDomain(dom) {
        var split = dom.split('.');
        var finalString;
        if (split.length < 3) {
            return dom;
        }
        finalString = split[split.length-2].concat('.');
        return finalString.concat(split[split.length-1]);
};
