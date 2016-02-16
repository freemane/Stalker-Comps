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
        createTooltip(node);
        // prevents animation from happening for cookies
        if (node.data('type') == 'domain') {
            // TODO - figure out clear/highlight/select so same neighborhood nodes don't have to be re-animated
//            clear();
            $('#search').val(''); // clears anything in the search box
            highlight(node);
        };
        // TODO/QUESTION - show neighborhood instead of cookie -- do we want this?
        // I think we do -Robert
        if (node.data('type') == 'cookie') {
            selectDomainOfCookie(node);
        };
        
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
        if (node.hasClass("highlighted")){
            createTooltip(node);
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
    var amountToDisplay = Math.min(data.length,100);
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
                    'shape': 'polygon',
                    'polygonPoints': '-1, -1,   1, -0.5,   1, 1,   -1, 0.5',
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
                'shape': 'polygon',
                'polygonPoints': '-1, -1,   1, -0.5,   1, 1,   -1, 0.5',
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
        cy.nodes().unselect();
        // returns objects to their original positions
        cy.layout(layout);
    });

    // zooms in on the domain with the most recent cookie
    $('#mostRecent').on('click', function () {
        clear();
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
        clear();
        cy.nodes().unselect();
        cy.layout(layout);
        var node = getNodeWithMostEdges(2);
        node.select();
    });

    // fixed - TODO/BUG - 3rd party and most connections buttons don't work one after the other
    // TODO/BUG - uncaught error when no 3rd party connections
    // zooms in on the domain with the most third party connections
    $('#mostThirdParty').on('click', function () {
        clear();
        cy.nodes().unselect();
        cy.layout(layout);
        var node = getNodeWithMostEdges(1);
        node.select();
    });

    // zooms in on the domain with the most connections (edges)
    $('#mostConnections').on('click', function () {
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
            if (typeof obj ==='undefined') {
                return;
            }
            for (var key in obj){
                if (typeof obj[key]['domains'] === 'undefined') {
                    continue;
                }
//                createThirdPartyEdges(key, obj[key]['domains']);
            }
        });
    };

    function createThirdPartyEdges(key,domainsToAdd) {
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
                        'color': '#000000',
                        'lineStyle': 'dashed',
                        'weight': '1'
                    },
                    'selectable': 'false'
                };
                edges.push(edgeObj);
//                console.log('3rd party cookie: '.concat(dom));
            } else if (!domains[dom]) {
//                console.log('not valid cookie dom: '.concat(dom));
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
