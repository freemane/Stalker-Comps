//chrome.browserAction.onClicked.addListener(function(activeTab){
//    alert("before");
chrome.cookies.getAll({}, function (cookies) {
    console.log('testing');
    for (var i = 0; i < cookies.length; i++) {
        var cook = cookies[i];
        //if (cook.domain.charAt(0) != ".") {
        $(".cookie").append("<p>Name: " + cook.name + "\nValue: " + cook.value + "\nDomain: " + cook.domain + "</p>");
        //}

    }
    return;
});


function removeCookies() {
    //alert('hi');
    chrome.cookies.getAll({},
        function (cookies) {
            var startNum = cookies.length;
            for (var j = 0; j < cookies.length; j++) {
                var cookie = cookies[j];

                //if (cookie.domain.charAt(0) != ".") {
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
                //}

            }
            var endNum = cookies.length - startNum;
            //console.log(endNum);
            //alert(endNum + " cookies deleted.");
        });
    location.reload();
};


$(function () {
    $("#cookieButton").click(removeCookies);
});
