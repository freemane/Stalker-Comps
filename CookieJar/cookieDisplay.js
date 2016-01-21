function removeSelectedCookies() {
    chrome.cookies.getAll({},
        function (cookies) {

            var selected = [];
            $('.cookie input:checked').each(function () {
                selected.push($(this).attr('name'));
            });
            console.log(selected);

            for (var i = 0; i < selected.length; i++) {
                for (var j = 0; j < cookies.length; j++) {
                    var cookie = cookies[j];

                    curSelected = selected[i].split(" ");
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
    location.reload();
};

function getAllCookies() {
    chrome.cookies.getAll({}, function (cookies) {
        console.log('testing');
        for (var i = 0; i < cookies.length; i++) {
            var cook = cookies[i];
            //if (cook.domain.charAt(0) != ".") {
            var key = cook.domain.concat(cook.name);
            $(".cookie").append("<div id= \"" + key.replace(/\./g, '') + "\">" + "Name: " + cook.name + "\nValue: " + cook.value + "\nDomain: " + cook.domain + "<input type=\"checkbox\" name=\"" + cook.name + " " + cook.domain + "\"></div>");

            chrome.storage.local.get(key, function (obj) {
                var urlKey = Object.keys(obj)[0];
                var setterInfo = obj[urlKey];
                var id = "#".concat(urlKey).replace(/\./g, '');
                $(id).append("<p>Set By: " + setterInfo.sourceUrl + "</p>");
            });

            //}

        }
        $(".count").append("<p>Num cookies: " + cookies.length + "</p>");
        return;
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
    $("#Delete").click(removeSelectedCookies);
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


