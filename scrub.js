var titlepref = chrome.i18n.getMessage("titlePreface");
var titleprefpriv = chrome.i18n.getMessage("titlePrefacePrivate");
var webpref = chrome.i18n.getMessage("webPreface");
var webprefpriv = chrome.i18n.getMessage("webPrefacePrivate");
var routerpref = chrome.i18n.getMessage("routerPreface");
var routerprefpriv = chrome.i18n.getMessage("routerPrefacePrivate");
var mailpref = chrome.i18n.getMessage("mailPreface");
var mailprefpriv = chrome.i18n.getMessage("mailPrefacePrivate");
var torrentpref = chrome.i18n.getMessage("torrentPreface");
var torrentprefpriv = chrome.i18n.getMessage("torrentPrefacePrivate");
var tunnelpref = chrome.i18n.getMessage("i2ptunnelPreface");
var tunnelprefpriv = chrome.i18n.getMessage("i2ptunnelPrefacePrivate");

var contextScrub = async function(requestDetails) {
  console.log("(scrub)Scrubbing info from contextualized request");
  try {
    var headerScrub = function(context) {
      if (!context) {
        console.error("Context not found");
      } else if (context.name == titlepref) {
        var ua = "MYOB/6.66 (AN/ON)";
        if (i2pHost(requestDetails.url)) {
          for (var header of requestDetails.requestHeaders) {
            if (header.name.toLowerCase() === "user-agent") {
              header.value = ua;
              console.log("(scrub)User-Agent header modified", header.value);
            }
          }
        }
        return {
          requestHeaders: requestDetails.requestHeaders
        };
      } else if (context.name == routerpref) {
        var ua = "MYOB/6.66 (AN/ON)";
        if (i2pHost(requestDetails.url)) {
          for (var header of requestDetails.requestHeaders) {
            if (header.name.toLowerCase() === "user-agent") {
              header.value = ua;
              console.log("(scrub)User-Agent header modified", header.value);
            }
          }
        } else if (routerHost(requestDetails.url)) {
        }
        return {
          requestHeaders: requestDetails.requestHeaders
        };
      }
    };
    var contextGet = async function(tabInfo) {
      try {
        console.log("(scrub)Tab info from Function", tabInfo);
        context = await browser.contextualIdentities.get(tabInfo.cookieStoreId);
        return context;
      } catch (error) {
        console.log("(scrub)Conext Error", error);
      }
    };
    var tabFind = async function(tabId) {
      try {
        context = await browser.contextualIdentities.query({
          name: titlepref
        });
        tabId.cookieStoreId = context[0].cookieStoreId;
        console.log(
          "(scrub) forcing context",
          titlepref,
          tabId.cookieStoreId,
          "=>",
          context[0].cookieStoreId
        );
        return tabId;
      } catch (error) {
        console.log("(scrub)Context Error", error);
      }
    };
    var tabGet = async function(tabId) {
      try {
        console.log("(scrub)Tab ID from Request", tabId);
        let tabInfo = await browser.tabs.get(tabId);
        return tabInfo;
      } catch (error) {
        let tabInfo = await browser.tabs.getCurrent();
        return tabInfo;
      }
    };
    if (requestDetails.tabId > 0) {
      var tab = {};
      var context = {};
      var req = {};
      if (i2pHost(requestDetails.url)) {
        console.log("(Proxy)I2P URL detected, ");
        tab = tabGet(requestDetails.tabId);
        var mtab = tab.then(tabFind);
        context = mtab.then(contextGet);
        req = await context.then(headerScrub);
        console.log("(scrub)Scrubbing I2P Request", req);
        return req;
      } else if (routerHost(requestDetails.url)) {
        tab = tabGet(requestDetails.tabId);
        context = tab.then(contextGet);
        req = await context.then(headerScrub);
        console.log("(scrub)Scrubbing non-I2P Request", req);
        return req;
      }
      return req;
    }
  } catch (error) {
    console.log("(scrub)Not scrubbing non-I2P request.", error);
  }
};

var contextSetup = async function(requestDetails) {
  console.log("(isolate)Forcing I2P requests into context");
  try {
    var tabFind = async function(tabId) {
      try {
        var context = await browser.contextualIdentities.query({
          name: titlepref
        });
        if (tabId.cookieStoreId != context[0].cookieStoreId) {
          console.log(
            "(isolate) forcing I2P Browsing",
            requestDetails.url,
            " context",
            tabId.cookieStoreId,
            context[0].cookieStoreId
          );
          function Create(window) {
            function onCreated(tab) {
              console.log("(isolate) Closing old, un-isolated tab", window);
              browser.tabs.remove(tabId.id);
            }
            var created = browser.tabs.create({
              active: true,
              cookieStoreId: context[0].cookieStoreId,
              url: requestDetails.url
            });
            created.then(onCreated, onError);
          }
          var getting = browser.tabs.getCurrent();
          getting.then(Create);
          return tabId;
        }
      } catch (error) {
        console.log("(isolate)Context Error", error);
      }
    };
    var routerTabFind = async function(tabId) {
      try {
        var context = await browser.contextualIdentities.query({
          name: routerpref
        });
        if (tabId.cookieStoreId != context[0].cookieStoreId) {
          console.log(
            "(isolate) forcing Router Console",
            requestDetails.url,
            " context",
            tabId.cookieStoreId,
            context[0].cookieStoreId
          );
          function Create(window) {
            function onCreated(tab) {
              console.log("(isolate) Closing old, un-isolated tab");
              browser.tabs.remove(tabId.id);
              browser.tabs.remove(window.tabs[0].id);
            }
            var created = browser.tabs.create({
              active: true,
              cookieStoreId: context[0].cookieStoreId,
              url: requestDetails.url
              //windowId: window.id
            });
            created.then(onCreated, onError);
          }
          var getting = browser.tabs.getCurrent();
          getting.then(Create);
          return tabId;
        }
      } catch (error) {
        console.log("(isolate)Context Error", error);
      }
    };
    var i2ptunnelTabFind = async function(tabId) {
      try {
        var context = await browser.contextualIdentities.query({
          name: tunnelpref
        });
        if (tabId.cookieStoreId != context[0].cookieStoreId) {
          console.log(
            "(isolate) forcing HSM context",
            requestDetails.url,
            " context",
            tabId.cookieStoreId,
            context[0].cookieStoreId
          );
          function Create(window) {
            function onCreated(tab) {
              console.log("(isolate) Closing old, un-isolated tab");
              browser.tabs.remove(tabId.id);
            }
            var created = browser.tabs.create({
              active: true,
              cookieStoreId: context[0].cookieStoreId,
              url: requestDetails.url
              //windowId: window.id
            });
            created.then(onCreated, onError);
          }
          var getting = browser.tabs.getCurrent();
          getting.then(Create);
          return tabId;
        }
      } catch (error) {
        console.log("(isolate)Context Error", error);
      }
    };
    var snarkTabFind = async function(tabId) {
      try {
        var context = await browser.contextualIdentities.query({
          name: torrentpref
        });
        if (tabId.cookieStoreId != context[0].cookieStoreId) {
          console.log(
            "(isolate) forcing Bittorrent",
            requestDetails.url,
            " context",
            tabId.cookieStoreId,
            context[0].cookieStoreId
          );
          function Create(window) {
            function onCreated(tab) {
              console.log("(isolate) Closing old, un-isolated tab");
              browser.tabs.remove(tabId.id);
            }
            var created = browser.tabs.create({
              active: true,
              cookieStoreId: context[0].cookieStoreId,
              url: requestDetails.url
            });
            created.then(onCreated, onError);
          }
          var getting = browser.tabs.getCurrent();
          getting.then(Create);
          return tabId;
        }
      } catch (error) {
        console.log("(isolate)Context Error", error);
      }
    };
    var mailTabFind = async function(tabId) {
      try {
        var context = await browser.contextualIdentities.query({
          name: mailpref
        });
        if (tabId.cookieStoreId != context[0].cookieStoreId) {
          console.log(
            "(isolate) forcing Web Mail",
            requestDetails.url,
            " context",
            tabId.cookieStoreId,
            context[0].cookieStoreId
          );
          function Create(window) {
            function onCreated(tab) {
              console.log("(isolate) Closing old, un-isolated tab");
              browser.tabs.remove(tabId.id);
            }
            var created = browser.tabs.create({
              active: true,
              cookieStoreId: context[0].cookieStoreId,
              url: requestDetails.url
            });
            created.then(onCreated, onError);
          }
          var getting = browser.tabs.getCurrent();
          getting.then(Create);
          return tabId;
        }
      } catch (error) {
        console.log("(isolate)Context Error", error);
      }
    };
    var anyTabFind = async function(tabId) {
      try {
        var context = await browser.contextualIdentities.query({
          name: webpref
        });
        console.log("(ISOLATE)", tabId.cookieStoreId);
        if (
          tabId.cookieStoreId == "firefox-default" ||
          tabId.cookieStoreId == "firefox-private"
        ) {
          if (tabId.cookieStoreId != context[0].cookieStoreId) {
            console.log(
              "(isolate) forcing Web Browsing",
              requestDetails.url,
              " context",
              tabId.cookieStoreId,
              context[0].cookieStoreId
            );
            function Create(window) {
              function onCreated(tab) {
                console.log("(isolate) Closing old, un-isolated tab");
                browser.tabs.remove(tabId.id);
              }
              var created = browser.tabs.create({
                active: true,
                cookieStoreId: context[0].cookieStoreId,
                url: requestDetails.url
              });
              created.then(onCreated, onError);
            }
            var getting = browser.tabs.getCurrent();
            getting.then(Create);
            return tabId;
          }
        }
      } catch (error) {
        console.log("(isolate)Context Error", error);
      }
    };
    var tabGet = async function(tabId) {
      try {
        console.log("(isolate)Tab ID from Request", tabId);
        let tabInfo = await browser.tabs.get(tabId);
        return tabInfo;
      } catch (error) {
        console.log("(isolate)Tab error", error);
      }
    };
    if (requestDetails.tabId > 0) {
      if (proxyHost(requestDetails.url)) {
        setcookie = browser.cookies.set({
          firstPartyDomain: i2pHostName(requestDetails.url),
          url: requestDetails.url,
          secure: true
        });
        setcookie.then(onContextGotLog, onError);
        return requestDetails;
      }
      if (i2pHost(requestDetails.url)) {
        var setcookie = browser.cookies.set({
          firstPartyDomain: i2pHostName(requestDetails.url),
          url: requestDetails.url,
          secure: true
        });
        setcookie.then(onContextGotLog, onError);
        var tab = tabGet(requestDetails.tabId);
        var mtab = tab.then(tabFind);
        return requestDetails;
      }
      let routerhost = routerHost(requestDetails.url);
      if (routerhost) {
        if (routerhost === "i2ptunnelmgr") {
          var tab = tabGet(requestDetails.tabId);
          var mtab = tab.then(i2ptunnelTabFind);
          return requestDetails;
        } else if (routerhost === "i2psnark") {
          var tab = tabGet(requestDetails.tabId);
          var mtab = tab.then(snarkTabFind);
          return requestDetails;
        } else if (routerhost === "webmail") {
          var tab = tabGet(requestDetails.tabId);
          var mtab = tab.then(mailTabFind);
          return requestDetails;
        } else if (routerhost === "routerconsole") {
          var tab = tabGet(requestDetails.tabId);
          var mtab = tab.then(routerTabFind);
          return requestDetails;
        }
      } else {
        var tab = tabGet(requestDetails.tabId);
        var mtab = tab.then(anyTabFind);
        return requestDetails;
      }
    }
    //var tab = tabGet(requestDetails.tabId);
    //var mtab = tab.then(anyTabFind);
    return requestDetails;
  } catch (error) {
    console.log("(isolate)Not an I2P request, blackholing", error);
  }
};

browser.webRequest.onBeforeRequest.addListener(
  contextSetup,
  { urls: ["<all_urls>"] },
  ["blocking"]
);

browser.webRequest.onBeforeSendHeaders.addListener(
  contextScrub,
  { urls: ["<all_urls>"] },
  ["blocking", "requestHeaders"]
);

/*
function notify(message) {
  var response = await fetch('https://proxy.i2p', {
      credentials: 'include'
    });
    const myJson = await response.json();
    console.log(JSON.stringify(myJson));

  console.log(message);
  const Http = new XMLHttpRequest();
  Http.mozAnon = true;
  Http.withCredentials = true;
  const url = "http://proxy.i2p";
  Http.open("GET", url);
  Http.send();
  Http.onreadystatechange = e => {
    console.log(Http.responseText);
    browser.runtime.sendMessage(Http.responseText);
  };
}
*/
