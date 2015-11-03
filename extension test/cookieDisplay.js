
chrome.browserAction.onClicked.addListener(function(activeTab){
        chrome.cookies.getAll({},function(cookies) {

        var cook = cookies[0];
        alert("Name: " + cook.name + "\nValue: " + cook.value + "\nDomain: " + cook.domain);
    });
    
});