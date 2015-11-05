//chrome.browserAction.onClicked.addListener(function(activeTab){
//    alert("before");
    chrome.cookies.getAll({},function(cookies) {
        var cook = cookies[0];
        $(".cookie").append("<p>Name: " + cook.name + "\nValue: " + cook.value + "\nDomain: " + cook.domain + "</p>");
    });

//});