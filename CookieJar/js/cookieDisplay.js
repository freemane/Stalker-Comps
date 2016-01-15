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
        var outputCookies = [];
        for (var i = 0; i < cookies.length; i++) {
            var cook = cookies[i];
            var key = cook.domain.concat(cook.name);
            $(".cookie").append("<div id= \"" + key.replace(/\./g, '') + "\">" + "Name: " + cook.name + "\nValue: " + cook.value + "\nDomain: " + cook.domain + "<input type=\"checkbox\" name=\"" + cook.name + " " + cook.domain + "\"></div>");

            chrome.storage.local.get(key, function (obj) {
                var urlKey = Object.keys(obj)[0];
                var setterInfo = obj[urlKey];
                var id = "#".concat(urlKey).replace(/\./g, '');
                $(id).append("<p>Set By: " + setterInfo.sourceUrl + "</p>");
            });
            //put cookies into table format
            outputCookies.push([cook.name, cook.value, cook.domain]);
        }
        $(".count").append("<p>Num cookies: " + cookies.length + "</p>");
        $(".outputCookies").append(createTable(outputCookies));
        return;
    });
};

//from http://stackoverflow.com/a/15164958
function createTable(tableData) {
    var table = document.createElement('table')
        , tableBody = document.createElement('tbody');
    table.setAttribute("id","test");
    table.setAttribute("class","table");

    tableData.forEach(function(rowData) {
        var row = document.createElement('tr');
        rowData.forEach(function(cellData) {
            var cell = document.createElement('td');
            cell.appendChild(document.createTextNode(cellData));
            row.appendChild(cell);
        });
        tableBody.appendChild(row);
    });

    table.appendChild(tableBody);
    document.body.appendChild(table);
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