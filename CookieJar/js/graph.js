/*
Creates the Cytoscape graph.
*/
function createGraph(args) {
    // points array represents all of the objects (nodes and edges) displayed
    var points = [];

    // Set of domains we have already created a node for
    var domains = {};
    var data = args[0];
    var styleJson = args[1];
    var cy = cytoscape({
        container: document.getElementById('cy'), // container to render in
        style: styleJson,
        maxZoom: 10,
        minZoom: 1e-2,
    });
    
    cy.on('click', 'node,edge', function (e) { // On click
        var element = this;
        if (element.data('type') == 'none') { // do nothing for normal edge
            return;
        }
        
        // if the neighborhood is already selected, create the tooltip
        // uses custom class because 'select' and 'click' are too similar
        if (element.hasClass('nhoodSelected')) {
            createTooltip(element); 
            return;
        }
        
        // if the neighborhood hasn't been selected, select and zoom in on domain
        selectNeighborhood(element);
    });
    
    cy.on('unselect', 'node', function (e) { // Clicking away (unselect)
        var node = this;
        $('#search').val('');
        cy.nodes().unselect();
    });
    
    /* 
    Assigns a custom class to all elements (includes edges) of the neighboorhood of the given 
    node. This emulates the selection of multiple elements at once. Selects the given node 
    and zooms in on the domain.
    */
    function selectNeighborhood(node) {
        cy.batch(function () { // cy.batch prevents multiple style re-calculations or redraws
            cy.elements().removeClass('selected');
            cy.elements().removeClass('nhoodSelected');
        });
        
        var nhood = node.closedNeighborhood();
        var nodeDomain = node; // if node isn't actually domain, set it right
        
        if (node.data('type') == 'cookie') {
            nhood.forEach(function (n) {
                if (n.data('type') == 'domain') {
                    nodeDomain = n;
                };
            });
        } else if (node.data('type') == 'thirdParty') {
            nodeDomain = node.target();
        }        
        
        // select all nodes in the neighboorhood of the domain
        var domainHood = nodeDomain.closedNeighborhood();
        domainHood.forEach(function (n) {
            n.addClass('nhoodSelected');
        });
        
        node.addClass('selected');
        highlight(nodeDomain);
    };    
    
    /*
    Creates tooltip for selected node. Class 'tooltip' prevents a new tooltip from being 
    created every time a given node is clicked.
    */
    function createTooltip(node) {
        if (node.hasClass('tooltip')) {
            return;
        }
        node.addClass('tooltip');
        
        var qtipTitle;
        var qtipContent;
        // domain (parent) nodes do not have the same amount of info as cookie nodes
        if (node.data('type') == 'domain') {
            qtipTitle =   'Domain:  '+node.data('searchData');
            qtipContent = '<table class="table table-condensed borderless" id="tooltip">'+
                          '<tr><td>Full Domain:</td><td>'+node.data('fullDomain')+node.data('path')+
                          '</td></tr><td>Total Cookies:</td><td>'+countCookies(node)+'</td></tr></table>';
        } else if (node.data('type') == 'cookie') {
            qtipTitle =   'Cookie Name:  '+node.data('name');
            qtipContent = '<table class="table table-condensed borderless" id="tooltip">'+
                          '<tr><td>Value:  </td><td>'+crop(node.data('value'))+
                          '</td></tr><tr><td>Domain:</td><td>'+node.data('fullDomain')+node.data('path')+
                          '</td></tr><tr><td>Expires:</td><td>'+new Date(node.data('expirationDate')*1000)+
                          '</td></tr><tr><td>HTTP Only:</td><td>'+node.data('httpOnly')+
                          '</td></tr><tr><td>Host Only:</td><td>'+node.data('hostOnly')+
                          '</td></tr><tr><td>Secure:</td><td>'+node.data('secure')+
                          '</td></tr><tr><td>Session:</td><td>'+node.data('session')+'</td></tr></table>';
        } else if (node.data('type') == 'thirdParty') {
            qtipTitle =   'Third Party Connection'
            qtipContent = '<table class="table table-condensed borderless" id="tooltip">'+
                          '<tr><td>Source:</td><td>'+node.data('sourceDomain')+
                          '</td></tr><tr><td>Target:</td><td>'+node.data('target');
        } else {
            return;
        }
        
        node.qtip({
            content: {
                title: qtipTitle,
                text: qtipContent,
            },
            style: {
                classes: 'qtip-bootstrap'
            }
        });
    }
    
    function crop(text) {
        if (text.length > 150) {
            return text.substring(0,150)+'... (see table for full value)';
        }
        return text;
    }
    
    function countCookies(domain) {
        var num = 0;
        domain.closedNeighborhood().forEach(function (n) {
            if (n.data('type') == 'cookie') {
                num++;
            }
        });
        return num;
    }

    // Unselects selected/highlighed node, zooms out, and returns nodes to original positions
    function clear() {
        cy.batch(function () {
            // returns nodes to full opacity
            cy.elements().removeClass('highlighted').removeClass('faded');
            
            // removes highlight/select circle for selected node
            cy.elements().removeClass('selected');
            cy.elements().removeClass('nhoodSelected');            
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
        if (node.hasClass("highlighted")){
//            createTooltip(node);
            return;
        }
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
    var DEFAULT = 100;
    var amountToDisplay = Math.min(data.length,DEFAULT);
    
    $('#op1').click(function(e) {
        dropdown(DEFAULT);
        e.preventDefault();
    });
    
    $('#op2').click(function(e) {
        dropdown(parseInt(data.length / 3));
        e.preventDefault();
    });    
    
    $('#op3').click(function(e) {
        dropdown(parseInt(2 * data.length / 3));
        e.preventDefault();
    }); 
    
    $('#op4').click(function(e) {
        dropdown(data.length);
        e.preventDefault();
    });     
    
    function dropdown(newAmount) {
        if (amountToDisplay > newAmount) {
            cy.elements().remove();
        } else if (amountToDisplay == newAmount) {
            return;
        }
        
        amountToDisplay = newAmount;
        drawGraph(amountToDisplay);
        cy.layout(layout);
    };    
    
    // shows ## of cookies out of all cookies
    $('#amountShowing').on('myEvent', function (event, amountToDisplay) {
        $(this).text('Showing ' + amountToDisplay + ' of ' + data.length + ' cookies').show();
    });
    
    // shows warning for showing more cookies
    $('a[title]').qtip({
        content: {
            title: 'Warning!',
            text: 'Displaying more cookies may slow down CookieJar.',
        },
        style: {
            classes: 'qtip-bootstrap'
        }
    });
    
    drawGraph(amountToDisplay);
    function drawGraph(amountToDisplay) {
        points = []; // clear points and domains to redraw with different amounts
        domains = {};
        getStoredDomains();
        $('#amountShowing').trigger('myEvent', amountToDisplay);
        
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
                        'path': cook.path,
                        'searchData': mainDomain,
                        'weight': 2,
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
                    'hostOnly': cook.hostOnly,
                    // if httpOnly is true, cookie is inaccessible to client-side scripts 
                    //   (prevents potentially sensitive cookie info from being sent)
                    // http://www.troyhunt.com/2013/03/c-is-for-cookie-h-is-for-hacker.html
                    'httpOnly': cook.httpOnly,
                    'session': cook.session,
                    'expirationDate': cook.expirationDate,
                    'searchData': mainDomain + '/' + cook.name,
                    'weight': 1,
                },
                'removed': false,
                'selected': false,
                'selectable': true,
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
                    'type': 'none',
                    'weight': '2'
                },
                'selectable': 'false'
            };
            points.push(node);
            points.push(edgeObj);
        }
        cy.add(points);
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
        cy.nodes().unselect();
        // http://stackoverflow.com/questions/23461322/cytoscape-js-wrong-mouse-pointer-position-after-container-change
        cy.resize();
        // returns objects to their original positions
        cy.layout(layout);
    });

    // zooms in on the domain with the most recent cookie
    $('#mostRecent').on('click', function () {
        clear();
        cy.nodes().unselect(); // by having unselect in here, tooltips work better
        cy.layout(layout);
        var node = cy.nodes()[cy.nodes().length - 1];
        selectNeighborhood(node);
    });
    
    // zooms in on the domain with the most cookies
    $('#mostCookies').on('click', function () {
        clear();
        cy.nodes().unselect();
        cy.layout(layout);
        var node = getNodeWithMostEdges(2);
        selectNeighborhood(node);
    });

    // zooms in on the domain with the most third party connections
    $('#mostThirdParty').on('click', function () {
        clear();
        cy.nodes().unselect();
        cy.layout(layout);
        var node = getNodeWithMostEdges(1);
        selectNeighborhood(node);
    });

    // zooms in on the domain with the most connections (edges)
    $('#mostConnections').on('click', function () {
        clear();
        cy.nodes().unselect();
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
        selectNeighborhood(biggestNode);
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
            if (typeof obj ==='undefined') {
                return;
            }
            for (var i = 0;i<amountToDisplay;++i){
                var cook = data[i];
                var key = shortDomain(cook.domain).concat(cook.name);
                if (typeof obj[key] === 'undefined') {
                    continue;
                }
                if (typeof obj[key]['domains'] === 'undefined') {
                    continue;
                }
                createThirdPartyEdges(key, obj[key]['domains'], cook.domain);
            }
        });
    };

    function createThirdPartyEdges(key,domainsToAdd, sourceDomain) {
        if (Object.keys(domainsToAdd).length < 1) {
            return;
        }

        // var cookDom = shortDomain(cook.domain);
        var edges = [];
        for (var dom in domainsToAdd) { 
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
                        'type': 'thirdParty',
                        'sourceDomain': sourceDomain,
                        'weight': '1'
                    },
                    'selectable': 'false'
                };
                edges.push(edgeObj);
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
        selectNeighborhood(n);
    });

    $('#filters').on('click', function () {;
        var domain = $('#domain').is(':checked');
        var cookie = $('#cookie').is(':checked');
        var normalEdge = $('#normalEdge').is(':checked');
        var thirdParty = $('#thirdParty').is(':checked');

        cy.batch(function () {
            cy.elements().forEach(function (n) {
                n.removeClass('filtered');

                var filter = function () {
                    n.addClass('filtered');
                };

                var cType = n.data('type');
                if ((cType === 'domain' && !domain) || (cType === 'cookie' && !cookie) || (cType === 'none' && !normalEdge) || (cType === 'thirdParty' && !thirdParty)) {
                    filter();
                }
            });
        });
    });
    cy.ready(initializeTabs);
}
