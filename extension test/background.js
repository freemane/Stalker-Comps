// from http://stackoverflow.com/a/16504563
chrome.browserAction.onClicked.addListener(function(activeTab){
  var newURL = "chrome://settings/cookies";
  chrome.tabs.create({ url: newURL });
});