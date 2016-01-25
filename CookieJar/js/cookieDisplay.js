
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
            // chrome.storage.local.get(key, function (obj) {
            //     var urlKey = Object.keys(obj)[0];
            //     var setterInfo = obj[urlKey];
            //     var id = "#".concat(urlKey).replace(/\./g, '');
            // });
            //put cookies into table format
            outputCookies.push([cook.name, cook.domain]);
        }
        $(".count").append("<p>Number of cookies: " + cookies.length + "</p>");
        $(".listCookies").append("Here are your first 5 cookies!<p>" + outputCookies[1] + "</p>");
        $(".listCookies").append("<p>" + outputCookies[2] + "</p>");
        $(".listCookies").append("<p>" + outputCookies[3] + "</p>");
        $(".listCookies").append("<p>" + outputCookies[4] + "</p>");
        $(".listCookies").append("<p>" + outputCookies[5] + "</p>");
        createTable(outputCookies,".outputCookies");
        createGraph(cookies);
    });
};



// adapted from http://stackoverflow.com/a/15164958
function createTable(data, cookieDiv) {
    init();
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
    $('#cookieTable').dataTable();
}


function createGraph(data) {
    var points = [];
    var domains ={};
    for (var i = 0; i < data.length; i++) {
        var cook = data[i];
        var key = cook.domain.concat(cook.name);
        if (!(cook.domain in domains)) {
            var parent = 
                {
                    "data" : {"id":cook.domain, "weight":2},
                    "group":"nodes",
                    "removed":false,
                    "selected":false,
                    "selectable":true,
                    "locked":false,
                    "grabbable":true,
                    "classes":""
                };
            points.push(parent);
            domains[cook.domain] = true;

        }
        var node =
            {
                    "data" : {"id":key,"class":cook.domain, "weight":1,parent: cook.domain},
                    
                    "group":"nodes",
                    "removed":false,
                    "selected":false,
                    "selectable":true,
                    "locked":false,
                    "grabbable":true,
                    "classes":""
            };
        var edgeObj = {data: {"id":key.concat("parentedge"),"class":cook.domain,source:cook.domain,target:key}};
        points.push(node);
        //points.push(edgeObj);
    }

    var cy = cytoscape({

      container: document.getElementById('cy'), // container to render in

      elements: points,

      style: [ // the stylesheet for the graph
        {
          selector: 'node',
          style: {
            'background-color': '#666',
            'label': 'data(id)'
          }
        },

        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle'
          }
        }
      ],
      layout: {
        name: 'random'
      }

    // var a = cy.$('#a'); // assume a compound node

    // // the neighbourhood of `a` contains directly connected elements
    // var directlyConnected = a.neighborhood();

    // // you may want everything connected to its descendants instead
    // // because the descendants "belong" to `a`
    // var indirectlyConnected = a.add( a.descendants() ).neighborhood();
    });
}

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


// section for displaying tabs
var tabLinks = new Array();
var contentDivs = new Array();

function init() {
    // Grab the tab links and content divs from the page
    var tabListItems = document.getElementById('tabs').childNodes;
    for ( var i = 0; i < tabListItems.length; i++ ) {
        console.log("test");
        if ( tabListItems[i].nodeName == "LI" ) {
          var tabLink = getFirstChildWithTagName( tabListItems[i], 'A' );
          var id = getHash( tabLink.getAttribute('href') );
          tabLinks[id] = tabLink;
          contentDivs[id] = document.getElementById( id );
        }
    }

    // Assign onclick events to the tab links, and
    // highlight the first tab
    var i = 0;

    for ( var id in tabLinks ) {
        tabLinks[id].onclick = showTab;
        tabLinks[id].onfocus = function() { this.blur() };
        if ( i == 0 ) tabLinks[id].className = 'selected';
        i++;
    }

    // Hide all content divs except the first
    var i = 0;

    for ( var id in contentDivs ) {
        if ( i != 0 ) contentDivs[id].className = 'tabContent hide';
        i++;
      }
    }

function showTab() {
    var selectedId = getHash( this.getAttribute('href') );

    // Highlight the selected tab, and dim all others.
    // Also show the selected content div, and hide all others.
    for ( var id in contentDivs ) {
        if ( id == selectedId ) {
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

function getFirstChildWithTagName( element, tagName ) {
    for ( var i = 0; i < element.childNodes.length; i++ ) {
        if ( element.childNodes[i].nodeName == tagName ) return element.childNodes[i];
      }
}

function getHash( url ) {
    var hashPos = url.lastIndexOf ( '#' );
    return url.substring( hashPos + 1 );
}


