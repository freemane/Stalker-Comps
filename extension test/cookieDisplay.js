function getAllCookies() {
    chrome.cookies.getAll({}, function (cookies) {
        console.log('testing');
        for (var i = 0; i < cookies.length; i++) {
            var cook = cookies[i];
            //if (cook.domain.charAt(0) != ".") {
            var key = cook.domain.concat(cook.name);
            $(".cookie").append("<div id= \"" + key.replace(/\./g,'') +"\">" + "<p>Name: " + cook.name + "\nValue: " + cook.value + "\nDomain: " + cook.domain + "</p></div>");
            
            chrome.storage.local.get(key, function (obj) {
                var urlKey = Object.keys(obj)[0];
                var setterInfo = obj[urlKey];
                var id = "#".concat(urlKey).replace(/\./g,'');
                $(id).append("<p>Set By: " + setterInfo.sourceUrl +"</p>");
                });
            
            //}

        }
        $(".count").append("<p>Num cookies: " + cookies.length + "</p>");
        return;
    });
}

function removeCookies() {
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
            //alert(endNum + " cookies deleted.");
        });
    location.reload();
};


$(function () {
    getAllCookies();
    $("#cookieButton").click(removeCookies);
});
