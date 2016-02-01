function removeSelectedCookies(selected) {
    chrome.cookies.getAll({},
        function (cookies) {
            console.log('trying to remove:' + selected[0]);

            for (var i = 0; i < selected.length; i++) {
                for (var j = 0; j < cookies.length; j++) {
                    var cookie = cookies[j];

                    curSelected = selected[i];
                    if (cookie.name == curSelected[0] && cookie.domain == curSelected[1]) {
                      var url = "http" + ((cookie.secure == true) ? "s" : "")+"://"+cookie.domain;
                        deleteCookie(url,cookie.name,cookie.storeId,cookie.value,cookie.secure);
                        console.log('cookie removed');
                    }
                }
            }
        });
    //    DataTables dynammically updates the table so we don't have to reload the page
        location.reload();
};

function deleteCookie(url,name,store, value,secure,callback){
	//console.log("Delete URL: "+url+" | NAME: "+name+" |");
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
  document.cookie = name+"="+value+";expires="+new Date(0).toUTCString()+";";
}

/*
In addition to getting all cookies, also creates an array (outputCookies) with data
for the HTML table.
*/
function getAllCookies() {
    var styleP = $.ajax({
        url: './css/graphStyle.cycss', // wine-and-cheese-style.cycss
        type: 'GET',
        dataType: 'text'
    });
    chrome.cookies.getAll({}, function (cookies) {
        var outputCookies = [];
        var newCookies = [];
        outputCookies.push(['Name', 'Domain']);
        for (var i = 0; i < cookies.length; i++) {
            var cook = cookies[i];
            //cook.expirationDate = 112233445566;
            if(cook.expirationDate != 112233445566) {
              var key = cook.domain.concat(cook.name);
              //put cookies into table format
              outputCookies.push([cook.name, cook.domain]);
            }

        }
        $('.count').append('<p>Number of total cookies: ' + cookies.length + '</p>');
        createTable(outputCookies, '.listCookies', ['cookieTablePopup', '500px', [
            [10, 20, 50, -1],
            [10, 20, 50, 'All']
        ]])
        createTable(outputCookies, '.outputCookies', ['cookieTableWebapp', '100%', [
            [15, 25, 100, -1],
            [15, 25, 100, 'All']
        ]]);
        Promise.all([cookies, styleP]).then(createGraph);
    });
};

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
        init();
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
    var row = document.createElement('tr');
    headerData.forEach(function (cellData) {
        var cell = document.createElement('th');
        cell.appendChild(document.createTextNode(cellData));
        row.appendChild(cell);
    });
    tableHeader.appendChild(row);

    // convert the rest of the array into the HTML data
    var tableData = data.slice(1, data.length);
    tableData.forEach(function (rowData) {
        var row = document.createElement('tr');
        rowData.forEach(function (cellData) {
            var cell = document.createElement('td');
            cell.appendChild(document.createTextNode(cellData));
            row.appendChild(cell);
        });
        tableBody.appendChild(row);
    });

    table.appendChild(tableHeader);
    table.appendChild(tableBody);

    $(cookieDiv).append(table);
    initializeDataTable(tableName, lengthOption);
};

/*
As opposed to createTable, this function incorporates DataTables functionality
to finalize the creation of the table. It adds the ability to select and
delete any number of rows where each row represents a cookie.
*/
function initializeDataTable(tableName, lengthOption) {
    var cookieTable = $('#' + tableName).DataTable({
        'lengthMenu': lengthOption
    });

    // allows a single row to be selected
    $('#' + tableName + ' tbody').on('click', 'tr', function () {
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
        } else {
            cookieTable.$('tr.selected'); //.removeClass('selected');
            $(this).addClass('selected');
        }
    });

    // button removes selected rows
    $('#buttonRemoveRow').click(function () {

        // convert html into an array. adapted from http://stackoverflow.com/a/9579792
        var selectedCookies = [];
        cookieTable.$('tr.selected').each(function () {
            var arrayOfThisRow = [];
            var tableData = $(this).find('td');
            if (tableData.length > 0) {
                tableData.each(function () {
                    arrayOfThisRow.push($(this).text());
                });
                selectedCookies.push(arrayOfThisRow);
            }
            // removes all selected rows from table
            // PROBLEM:  also removes rows of cookies that weren't actually deleted
            // ^ this is something we will have to decide:  do we show these or not?
            cookieTable.row('tr.selected').remove().draw(false);
        });
        console.log(selectedCookies);

        $(cookieTable.$('tr.selected')).remove();
        removeSelectedCookies(selectedCookies);
    });
    $('#' + tableName).dataTable();
}

function createGraph(array) {
    // points array represents all of the nodes displayed
    var points = [];
    var domains = {};
    var data = array[0];
    var styleJson = array[1];
    var infoTemplate = '<p class="name">{{name}}</p>';
    var cy = cytoscape({

        container: document.getElementById('cy'), // container to render in
        style: styleJson
            //style was here

    });
    cy.on('select', 'node', function (e) {
        var node = this;
        highlight(node);
    });
    cy.on('unselect', 'node', function (e) {
        var node = this;
        clear();
    });


    function clear() {
        cy.batch(function () {
            cy.$('.highlighted').forEach(function (n) {
                n.animate({
                    position: n.data('orgPos')
                });
            });

            cy.elements().removeClass('highlighted').removeClass('faded');
        });
    }

    var layoutPadding = 50;
    var layoutDuration = 500;

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
                    padding: layoutPadding
                }
            }, {
                duration: layoutDuration
            }).delay(layoutDuration, function () {
                nhood.layout({
                    name: 'concentric',
                    padding: layoutPadding,
                    animate: true,
                    animationDuration: layoutDuration,
                    boundingBox: {
                        x1: npos.x - w / 2,
                        x2: npos.x + w / 2,
                        y1: npos.y - w / 2,
                        y2: npos.y + w / 2
                    },
                    fit: true,
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
    for (var i = 0; i < data.length; i++) {
        var cook = data[i];
        var key = cook.domain.concat(cook.name);
        getStoredDomains(key, cook, cy, domains, createThirdPartyEdges);
        if (!(cook.domain in domains)) {
            var parent = {
                'data': {
                    'id': cook.domain,
                    'weight': 2,
                    'name': cook.domain,
                    'color': '#666',
                    'image': 'https://',
                    'nodeWidth': '100',
                    'nodeHeight': '100',
                    'type': 'domain'
                },
                'group': 'nodes',
                'removed': false,
                'selected': false,
                'selectable': true,
                'locked': false,
                'grabbable': true,
                'classes': '',
                'NodeType': 'Domain'
            };
            points.push(parent);
            domains[cook.domain] = true;
        }
        var node = {
            'data': {
                'id': key,
                'domain': cook.domain,
                'weight': 1,
                'name': cook.name,
                'color': '#666',
                'image': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Twemoji_1f36a.svg/2000px-Twemoji_1f36a.svg.png',
                'nodeWidth': '25',
                'nodeHeight': '25',
                'type': 'cookie'
            }, //removed ,parent: cook.domain

            'group': 'nodes',
            'removed': false,
            'selected': false,
            'selectable': true,
            'locked': false,
            'grabbable': true,
            'classes': '',
            'NodeType': 'Cookie'
        };
        var edgeObj = {
            data: {
                'id': key.concat('parentedge'),
                'class': cook.domain,
                source: cook.domain,
                target: key,
                'color': '#ccc',
                'lineStyle': 'solid',
                'weight': '2'
            }
        };
        points.push(node);
        points.push(edgeObj);
    }
    cy.add(points);
    var layout = {
        name: 'concentric',
        concentric: function (node) {
            //            console.log(node.data('weight'));
            return node.data('weight');
        },
        levelWidth: function () {
            return 1;
        }
    };

    cy.layout(layout);

    $('#reset').on('click', function () {
        cy.animate({
            fit: {
                eles: cy.elements(),
                padding: layoutPadding
            },
            duration: layoutDuration
        });
        cy.layout(layout);
    });

    // zooms in on the most recent cookie centered on its domain
    $('#mostRecent').on('click', function () {
        cy.layout(layout);
        var node = cy.nodes()[cy.nodes().length - 1];
        highlight(node);
    });

    // zooms in on the domain with the most cookies
    $('#mostCookies').on('click', function () {
        cy.layout(layout);
        highlight(getNodeWithMostEdges(2));
    });

    // zooms in on the domain with the most third party connections
    $('#mostThirdParty').on('click', function () {
        cy.layout(layout);
        highlight(getNodeWithMostEdges(1));
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
        highlight(biggestNode);
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

    function createThirdPartyEdges(cook, domains, cy, domainsAdded) {
        if (Object.keys(domains).length < 1) {
            return;
        }
        var edges = [];
        for (var dom in domains) {
            if (dom != cook.domain && domainsAdded[dom]) {
                var edgeObj = {
                    data: {
                        'id': cook.domain.concat('-edge-').concat(dom),
                        'class': cook.domain,
                        source: cook.domain,
                        target: dom,
                        'color': '#000000',
                        'lineStyle': 'dashed',
                        'weight': '1'
                    }
                };
                edges.push(edgeObj);
                //console.log('3rd party cookie');
            } else if (!domainsAdded[dom]) {
                //console.log('not valid cookie dom'.concat(dom));
            }
        }
        cy.add(edges);
        cy.layout(layout);
    }

    $('#search').typeahead({
        minLength: 2,
        highlight: true,
    }, {
        name: 'search-dataset',
        source: function (query, cb) {
            function matches(str, q) {
                str = (str || '').toLowerCase();
                q = (q || '').toLowerCase();
                return str.match(q);
            }

            var fields = ['name', 'domain'];
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
        display: 'name'
//        templates: {
//          suggestion: infoTemplate
//        }
    }).on('typeahead:selected', function (e, entry, dataset) {
        var n = cy.getElementById(entry.id);
        n.select();
        //        showNodeInfo( n );
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
                console.log(cType + ' ' + !domain + ' ' + !cookie);
                //
                if ((cType === 'domain' && !domain) || (cType === 'cookie' && !cookie)) {
                    console.log('filter call');
                    filter();
                    //                    cy.layout(layout);
                }
            });
        });
    });
}

function getStoredDomains(key, cookie, cy, domainsAdded, callback) {
    chrome.storage.local.get(key, function (obj) {
        if (typeof obj === 'undefined' || typeof obj[key] === 'undefined') {
            return callback(cookie, {});
        }
        return callback(cookie, obj[key]['domains'], cy, domainsAdded);
    });
}

function removeAllCookies() {
    chrome.cookies.getAll({},
        function (cookies) {
            var startNum = cookies.length;
            for (var j = 0; j < cookies.length; j++) {
                var cookie = cookies[j];

                if (cookie.domain.charAt(0) != '.') {
                      deleteCookie(cookie.domain,cookie.name,cookie.storeId,cookie.value);
                } else {
                    cookie.domain = cookie.domain.substring(1, cookie.domain.length)
                    deleteCookie(cookie.domain,cookie.name,cookie.storeId,cookie.value);
                }
            }
            var endNum = cookies.length - startNum;
            console.log(endNum);
        });
    location.reload();
};

function openWebapp() {
    var newURL = '/webapp.html';
    chrome.tabs.create({
        url: newURL
    });
};

$(function () {
    $('#DeleteAll').click(removeAllCookies);
    getAllCookies();
    $('#WebApp').click(openWebapp);
});


// section for displaying tabs
var tabLinks = new Array();
var contentDivs = new Array();

function init() {
    // Grab the tab links and content divs from the page
    var tabListItems = document.getElementById('tabs').childNodes;
    for (var i = 0; i < tabListItems.length; i++) {
        console.log('test');
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
