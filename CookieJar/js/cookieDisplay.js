
/*
GLOBAL VARIABLES
*/

// variables for displaying tabs
var tabLinks = new Array();
var contentDivs = new Array();

// Starts the extension
//TODO Create globalish variable for allCookies (do this once) and pass when needed
//TODO Consolidate selectAll function
$(function () {
    $('#DeleteAll').click(removeAllCookies);
    getAllCookies();
    $('#WebApp').click(openWebapp);
    $('#SelectAll').click(selectAll);
    $('#UnselectAll').click(unselectAll);
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
function createTable(data, cookieDiv, options) {
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
    tableHeader.appendChild(createRowElements('th', headerData));
    table.appendChild(tableHeader);

    // convert the rest of the array into the HTML data
    var tableData = data.slice(1, data.length);
    tableData.forEach(function (rowData) {
        tableBody.appendChild(createRowElements('td', rowData));
    });
    table.appendChild(tableBody);

    $(cookieDiv).append(table);
    initializeDataTable(tableName, lengthOption);
};

// Function to add cells to row
function createRowElements(cellType, rowData) {
    var row = document.createElement('tr');
    rowData.forEach(function (cellData) {
        var cell = document.createElement(cellType);
        cell.appendChild(document.createTextNode(cellData));
        row.appendChild(cell);
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
function format(cook) {
    //console.log("Formatted");
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
function expand(tableName,row,data,table) {
    var rows = $('#'+tableName+' > tbody > tr');
    for(var i = 0;i<rows.length;i++) {
        if($(rows[i]).hasClass('selected')) {
            chrome.cookies.getAll({},function(cookies) {
                for(var j = 0;j<cookies.length;j++) {
                    var cook = cookies[j];
                    if((data[0] == cook.name)&&(data[1] == cook.domain)) {
                        // Found the cookie
                        row.child(format(cook)).show();
                        break;
                    }
                }
            });
        }
    }
}

// TODO Double click

function doubleClickExpand(tableName,curRow,data,table) {
    var tr = curRow.closest('tr');
    var row = cookieTable.row( tr );

    if($(curRow).hasClass('shown')){
        row.child.hide();
        tr.removeClass('shown');
    }
    else {
        var data = [ tr[0].children[0].innerText, tr[0].children[1].innerText ];
        expand(tableName,curRow,data,cookieTable);
        tr.addClass('shown');
    } 
}

/*
Unselect all previously selected cells in the table
*/
function unselectAll() {
    var tableName = "cookieTableWebapp";
    if(!$("#"+tableName).length) { // The webapp is open
        tableName = "cookieTablePopup"
    }
    var cookieTable = $("#"+tableName);
    console.log(cookieTable);
    var rows = $('#'+tableName+' > tbody > tr');
    for(var i = 0;i<rows.length;i++) {
        var tr = $(rows[i]).closest('tr');
        var row = cookieTable.row( tr );
        if($(rows[i]).hasClass('selected')) {
            $(rows[i]).removeClass('selected');
        }
        if($(rows[i]).hasClass('shift')) {
            $(rows[i]).removeClass('shift');
        }
        if(row.child.isShown()) {
            row.child.hide();
            $(rows[i]).removeClass('shown');
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
    if (curRow.hasClass('selected')) {
        curRow.removeClass('selected');
        if ( row.child.isShown() ) {
            row.child.hide();
            tr.removeClass('shown');
        }
        else {
            /* 
            tr is the table row object, children is an array with the name and domain of the cookie in the 
            selected cell, and innerText refers to the text within the HTML element 
            */
            var data = [ tr[0].children[0].innerText, tr[0].children[1].innerText ];
            expand(tableName,row,data,cookieTable);
            tr.addClass('shown');
        }
        
    } else {
        cookieTable.$('tr.selected'); //.removeClass('selected');
        curRow.addClass('selected');
        if ( tr.hasClass('shown') ) {
            row.child.hide();
            tr.removeClass('shown');
        }
        else {
            var data = [ tr[0].children[0].innerText, tr[0].children[1].innerText ];
            expand(tableName,row,data,cookieTable);
            tr.addClass('shown');
        }
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
    var cookieTable = $('#' + tableName).DataTable({
        'lengthMenu': lengthOption
    });

    // allows a single row to be selected
    $('#' + tableName + ' tbody').on('click', 'tr', function(e) {
        var rows = $('#'+tableName+' > tbody > tr');
        // If the shift key is down on the click event...
        if(e.shiftKey) {
            shiftClickSelect($(this),rows);
        }
        // Otherwise...
        else {
            regularSelect($(this),rows,cookieTable,tableName);
        }
    });

    $('#' + tableName + ' tbody').on('dbclick','tr',function() {
        doubleClickExpand(tableName,row,cookieTable);
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
}

/*
Creates the Cytoscape graph.
*/
//TODO Continue code review (reorganize stuff?)
function createGraph(args) {
    // points array represents all of the objects (nodes and edges) displayed
    var points = [];

    // Set of domains we have already created a node for
    var domains = {};
    var data = args[0];
    var styleJson = args[1];
    var cy = cytoscape({
        container: document.getElementById('cy'), // container to render in
        style: styleJson
    });
    
    cy.on('select', 'node', function (e) { // On click (select)
        var node = this;
        // prevents animation from happening for cookies
        if (node.data('type') == 'domain') {
            $('#search').val(''); // clears anything in the search box
            highlight(node);
        };
        // TODO/QUESTION - show neighborhood instead of cookie -- do we want this?
        if (node.data('type') == 'cookie') {
            selectDomainOfCookie(node);
        };
        createTooltip(node);
    });
    
    cy.on('unselect', 'node', function (e) { // Clicking away (unselect)
        var node = this;
        $('#search').val('');
    });
    
    // TODO - show qip after node is highlights. For some reason, having a lot of trouble...
    function createTooltip(node) {
        // domain (parent) nodes do not have the same amount of info as cookie nodes
        if (node.data('type') == 'domain') {
            var qtipContent = '<b>'+node.data('type')+':  '+node.data('searchData')+
                              '</b><br>'+node.data('fullDomain')+node.data('path');
        } else {
            var qtipContent = '<b>'+node.data('type')+':  '+node.data('name')+
                              '</b><br>Path:  '+node.data('fullDomain')+node.data('path')+
                              '<br>HttpOnly?  '+node.data('httpOnly')+
                              '<br>Secure?  '+node.data('secure')+
                              '<br>Session?  '+node.data('session')+
                              '<br>Expiration:  '+new Date(node.data('expirationDate')*1000)+
                              '<br>Value:  '+node.data('value');
        }
        
        node.qtip({
            content: qtipContent,
            style: {
                classes: 'qtip-bootstrap'
            }
        });
    }

    // Unselects selected/highlighed node, zooms out, and returns nodes to original positions
    function clear() {
        cy.batch(function () {
            cy.$('.highlighted').forEach(function (n) {
                n.animate({
                    position: n.data('orgPos')
                });
            });
            cy.elements().removeClass('highlighted').removeClass('faded');
        });
        
        // animation for zooming back to standard view
        cy.animate({
            fit: {
                eles: cy.elements(),
                padding: zoomPadding
            },
            duration: animationSpeed
        });
    }

    var animationSpeed = 500;
    // zoomPadding:  amount the animation zooms out before zooming back in
    var zoomPadding = 50;

    // Used to zoom in on a node and organize its connections accordingly
    function highlight(node) {
        var nhood = node.closedNeighborhood();
        cy.batch(function () {
            cy.elements().not(nhood).removeClass('highlighted').addClass('faded');
            nhood.removeClass('faded').addClass('highlighted');

            var npos = node.position();
            var w = window.innerWidth;
            var h = window.innerHeight;

            cy.stop().animate({
                fit: {
                    eles: cy.elements(),
                    padding: zoomPadding
                }
            }, {
                duration: animationSpeed
            }).delay(animationSpeed, function () {
                nhood.layout({
                    name: 'concentric',
                    padding: zoomPadding,
                    animate: true,
                    animationDuration: animationSpeed,
                    boundingBox: {
                        x1: npos.x - w / 2,
                        x2: npos.x + w / 2,
                        y1: npos.y - w / 2,
                        y2: npos.y + w / 2
                    },
                    fit: true,
                    //TODO Add different weights for third-party connections/ explore different layouts
                    concentric: function (n) {
                        if (node.id() === n.id()) {
                            return 2;
                        } else {
                            return 1;
                        }
                    },
                    levelWidth: function () {
                        return 1;
                    }
                });
            });
        });
    };
    
    // Only display 100 cookies
    var amountToDisplay = Math.min(data.length,1000);
    getStoredDomains();
    for (var i = 0; i < amountToDisplay; i++) {
        var cook = data[i];
        var mainDomain = shortDomain(cook.domain);      // Removes the subdomain portion
        var key = mainDomain.concat(cook.name);
        if (!(mainDomain in domains)) {
            var parent = {
                'data': {
                    'id': mainDomain,
                    'type': 'domain',
                    'name': mainDomain,
                    'fullDomain': cook.domain,
                    'path': cook.path, // should this be included in parent data?
                    'searchData': mainDomain,
                    
                    // settings for cytoscape formatting
                    'weight': 2,
                    'color': '#666',
                    'image': 'https://', //TODO add image to the parent nodes here (possibly jar?)
                    'nodeWidth': '100',
                    'nodeHeight': '100',
                },
                'removed': false,
                'selected': false,
                'selectable': true,
                'locked': false,
                'grabbable': false,
            };
            points.push(parent);
            domains[mainDomain] = true;
        }
        //TODO: Could have problem if main domains have the same cookie name ie .google.com and google.com both having _utma 
        var node = {
            'data': {
                'id': key,
                'type': 'cookie',
                'name': cook.name,
                'value': cook.value,
                'domain': mainDomain,
                'fullDomain': cook.domain,
                'path': cook.path,
                'secure': cook.secure,
                // if httpOnly is true, cookie is inaccessible to client-side scripts 
                //   (prevents potentially sensitive cookie info from being sent)
                // http://www.troyhunt.com/2013/03/c-is-for-cookie-h-is-for-hacker.html
                'httpOnly': cook.httpOnly,
                'session': cook.session,
                'expirationDate': cook.expirationDate,
                'searchData': mainDomain + '/' + cook.name,
                
                // settings for cytoscape formatting
                'weight': 1,
                'color': '#666',
                'image': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Twemoji_1f36a.svg/2000px-Twemoji_1f36a.svg.png',
                'nodeWidth': '25',
                'nodeHeight': '25',
            },

            'removed': false,
            'selected': false,
            'selectable': true, // less undesirable zoom animation if false, can't search if false
            'locked': false,
            'grabbable': false,
        };
        // Connects domains to their cookies
        var edgeObj = {
            data: {
                'id': key.concat('parentedge'),
                'class': mainDomain,
                source: mainDomain,
                target: key,
                'color': '#ccc',
                'lineStyle': 'solid',
                'weight': '2'
            },
            'selectable': 'false'
        };
        points.push(node);
        points.push(edgeObj);
    }
    cy.add(points);
    var layout = {
        name: 'concentric',
        concentric: function (node) {
            return node.data('weight');
        },
        levelWidth: function () {
            return 1;
        }
    };

    cy.layout(layout);

    $('#reset').on('click', function () {
        clear();
        // returns objects to their original positions
        cy.layout(layout);
    });

    // zooms in on the domain with the most recent cookie
    $('#mostRecent').on('click', function () {
        cy.nodes().unselect(); // by having unselect in here, tooltips work better
        cy.layout(layout);
        var node = cy.nodes()[cy.nodes().length - 1];
        selectDomainOfCookie(node);
    });
    
    function selectDomainOfCookie(node) {
        var nodeDomain;
        node.closedNeighborhood().forEach(function (n) {
            if (n.data('type') == 'domain') {
                nodeDomain = n;
            };
        });
        nodeDomain.select();
    }

    // zooms in on the domain with the most cookies
    $('#mostCookies').on('click', function () {
        cy.nodes().unselect();
        cy.layout(layout);
        var node = getNodeWithMostEdges(2);
        node.select();
    });

    // zooms in on the domain with the most third party connections
    $('#mostThirdParty').on('click', function () {
        cy.nodes().unselect();
        cy.layout(layout);
        var node = getNodeWithMostEdges(1);
        node.select();
    });

    // zooms in on the domain with the most connections (edges)
    $('#mostConnections').on('click', function () {
        cy.layout(layout);
        var maxNeighbors = 0;
        var biggestNode;
        cy.batch(function () {
            cy.nodes().forEach(function (n) {
                if (n.closedNeighborhood().length > maxNeighbors) {
                    maxNeighbors = n.closedNeighborhood().length;
                    biggestNode = n;
                }
            });

        });
        biggestNode.select();
    });

    /*
    This function finds and returns the node with the most edges of the specified
    weight.

    As of writing, a weight of 2 represents edges between domains and cookies and
    a weight of 1 represents third party connections.
    */
    function getNodeWithMostEdges(edgeWeight) {
        var maxNeighbors = 0;
        var biggestNode;
        cy.batch(function () {
            cy.nodes().forEach(function (n) {
                var cookieEdges = 0;
                n.closedNeighborhood().edges().forEach(function (edge) {
                    if (edge.data('weight') == edgeWeight) {
                        cookieEdges++;
                    }
                });
                if (cookieEdges > maxNeighbors) {
                    maxNeighbors = cookieEdges;
                    biggestNode = n;
                }
            });
        });
        return biggestNode;
    }

    /*

    Callback is the createThirdPartyEdges function in the createGraph function 
    */
    function getStoredDomains() {
        chrome.storage.local.get(null, function (obj) {
            console.log(obj);
            if (typeof obj ==='undefined') {
                return;
            }
            for (var key in obj){
                if (typeof obj[key]['domains'] === 'undefined') {
                    continue;
                }
                createThirdPartyEdges(key, obj[key]['domains']);
            }
        });
    };

    function createThirdPartyEdges(key,domainsToAdd) {
        console.log("1");
        if (Object.keys(domainsToAdd).length < 1) {
            return;
        }
        console.log("2");

        // var cookDom = shortDomain(cook.domain);
        var edges = [];
        for (var dom in domainsToAdd) { 
            console.log("3".concat(dom));
            dom = shortDomain(dom);
            var different= false;
            for (var i=0;i<dom.length;++dom){
                if (dom.charAt(i)!=key.charAt(i)){
                    different = true;
                    break;
                }
            }
            if (different && domains[dom]) {
                var edgeObj = {
                    data: {
                        'id': key.concat('-edge-').concat(dom),
                        'class': key,
                        source: key,
                        target: dom,
                        'color': '#000000',
                        'lineStyle': 'dashed',
                        'weight': '1'
                    },
                    'selectable': 'false'
                };
                edges.push(edgeObj);
                console.log('3rd party cookie: '.concat(dom));
            } else if (!domains[dom]) {
                console.log('not valid cookie dom: '.concat(dom));
            }
        }
        cy.add(edges);
        cy.layout(layout);
    }

    $('#clearSearch').click(function(){
        $('#search').val('').select();
    });    

    $('#search').typeahead({
        minLength: 1,
        highlight: true,
    }, {
        name: 'search-dataset',
        source: function (query, cb) {
            function matches(str, q) {
                str = (str || '').toLowerCase();
                q = (q || '').toLowerCase();
                return str.match(q);
            }

            var fields = ['searchData'];
            function anyFieldMatches(n) {
                for (var i = 0; i < fields.length; i++) {
                    var f = fields[i];

                    if (matches(n.data(f), query)) {
                        return true;
                    }
                }
                return false;
            }

            function getData(n) {
                var data = n.data();
                return data;
            }

            function sortByName(n1, n2) {
                if (n1.data('name') < n2.data('name')) {
                    return -1;
                } else if (n1.data('name') > n2.data('name')) {
                    return 1;
                }
                return 0;
            }

            var res = cy.nodes().stdFilter(anyFieldMatches).sort(sortByName).map(getData);
            cb(res);
        },
        display: 'searchData',
        limit: 15,
        templates: {
            empty: '<div class="empty-message">No results <b>☹</b></div>\n',
            header: '<p class="description-message">Click to zoom in on result</p>',
        }
    }).on('typeahead:selected', function (e, entry, dataset) {
        var n = cy.getElementById(entry.id);
        n.select();
    });

    $('#filters').on('click', function () {
        //        console.log('filters button pressed');
        var domain = $('#domain').is(':checked');
        var cookie = $('#cookie').is(':checked');

        cy.batch(function () {
            cy.nodes().forEach(function (n) {
                n.removeClass('filtered');

                var filter = function () {
                    n.addClass('filtered');
                };

                var cType = n.data('type');
                if ((cType === 'domain' && !domain) || (cType === 'cookie' && !cookie)) {
                    filter();
                }
            });
        });
    });
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
