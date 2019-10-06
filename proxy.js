function getChrome() {
    if (browser.runtime.getBrowserInfo == undefined) {
        return true
    }
    return false
}

function isDroid() {
    if (!getChrome()) {
        var gettingInfo = browser.runtime.getPlatformInfo();
        gettingInfo.then((got) => {
            if (got.os == "android") {
                console.log("android detected")
                return true
            } else {
                console.log("desktop detected")
                return false
            }
        });
    }
    return false
}

if (!getChrome()) {
    browser.privacy.network.peerConnectionEnabled.set({
        value: false
    });
}

chrome.privacy.network.networkPredictionEnabled.set({
    value: false
});
chrome.privacy.network.webRTCIPHandlingPolicy.set({
    value: "disable_non_proxied_udp"
});

console.log("Preliminarily disabled WebRTC.")

function shouldProxyRequest(requestInfo) {
    return requestInfo.parentFrameId != -1;
}



var onError = function(e) {
    console.error(e);
}

var handleContextProxyRequest = async function(requestDetails) {
    console.log("(proxy)Searching for proxy by context");
    try {
        var handleProxyRequest = function(context) {
            proxy = {
                failoverTimeout: 0,
                type: "direct",
                proxyDns: false
            }
            if (context.name == "i2pbrowser") {
                proxy = {
                    type: getScheme(),
                    host: getHost(),
                    port: getPort(),
                }
                console.log("(proxy)Using", proxy.type, "proxy ", proxy.host + ":" + proxy.port);
                return proxy
            }
            return proxy
        }
        var contextGet = async function(tabInfo){
            try {
                console.log("(proxy)Tab info from Function", tabInfo)
                context = await browser.contextualIdentities.get(tabInfo.cookieStoreId)
                return context
            } catch(error) {
                console.log("(proxy)Conext Error", error)
            }
        }
        var tabGet = async function(tabId) {
            try {
                console.log("(proxy)Tab ID from Request", tabId)
                let tabInfo = await browser.tabs.get(tabId)
                return tabInfo
            }catch(error){
                console.log("(proxy)Tab error", error)
            }
        }
        if (requestDetails.tabId > 0) {
            var tab = tabGet(requestDetails.tabId)
            var context = tab.then(contextGet)
            var proxy = await context.then(handleProxyRequest)
            console.log("(proxy)Returning I2P Proxy", proxy)
            return proxy
        }
    } catch (error) {
        console.log("(proxy)Not using I2P Proxy.", error);
    }
}

var proxy_scheme = "HTTP"

function getScheme() {
    if (proxy_scheme == undefined) {
        proxy_scheme = "http"
    }
    if (proxy_scheme == "HTTP") {
        proxy_scheme = "http"
    }
    if (proxy_scheme == "SOCKS") {
        proxy_scheme = "socks"
    }
    if (proxy_scheme != "http" && proxy_scheme != "socks") {
        proxy_scheme = "http"
    }
    //console.log("Got i2p proxy scheme:", proxy_scheme);
    return proxy_scheme;
}

var proxy_host = "127.0.0.1"
var proxy_port = "4444"
var control_host = "127.0.0.1"
var control_port = "4444"

function getHost() {
    if (proxy_host == undefined) {
        proxy_host = "127.0.0.1"
    }
    return proxy_host;
}

function getPort() {
    if (proxy_port == undefined) {
        var scheme = getScheme()
        if (scheme == "socks") {
            proxy_port = "4446"
        } else {
            proxy_port = "4444"
        }
    }
    return proxy_port;
}

function getControlHost() {
    if (control_host == undefined) {
        return "127.0.0.1"
    }
    return control_host;
}

function getControlPort() {
    if (control_port == undefined) {
        return "4444"
    }
    return control_port;
}

function setupProxy() {
    var controlHost = getControlHost()
    var controlPort = getControlPort();
    var Host = getHost()
    var Port = getPort()
    var Scheme = getScheme()
    if (!getChrome()) {
        /**/
        console.log("Setting up Firefox WebExtension proxy")
        browser.proxy.onRequest.addListener(handleContextProxyRequest, {
            urls: ["<all_urls>"]
        });
        console.log("i2p settings created for WebExtension Proxy")
        /**/
    } else {
        var config = {
            mode: "fixed_servers",
            rules: {
                singleProxy: {
                    scheme: Scheme,
                    host: Host,
                    port: parseInt(Port),
                },
            }
        };
        chrome.proxy.settings.set({
            value: config,
            scope: 'regular'
        }, function() {});
    }
}

function checkStoredSettings(storedSettings) {
    let defaultSettings = {};
    if (!storedSettings.proxy_scheme) {
        defaultSettings["proxy_scheme"] = "http"
    }
    if (!storedSettings.proxy_host) {
        defaultSettings["proxy_host"] = "127.0.0.1"
    }
    if (!storedSettings.proxy_port) {
        defaultSettings["proxy_port"] = 4444
    }
    if (!storedSettings.control_host) {
        defaultSettings["control_host"] = "127.0.0.1"
    }
    if (!storedSettings.control_port) {
        defaultSettings["control_port"] = 4444
    }
    chrome.storage.local.set(defaultSettings);
}

function update(restoredSettings) {
    proxy_scheme = restoredSettings.proxy_scheme
    console.log("restoring proxy scheme:", proxy_scheme)
    proxy_host = restoredSettings.proxy_host
    console.log("restoring proxy host:", proxy_host)
    proxy_port = restoredSettings.proxy_port
    console.log("restoring proxy port:", proxy_port)
    control_host = restoredSettings.control_host
    console.log("restoring control host:", control_host)
    control_port = restoredSettings.control_port
    console.log("restoring control port:", control_port)
}

chrome.storage.local.get(function(got) {
    checkStoredSettings(got)
    update(got)
    setupProxy()
});

// Theme all currently open windows
if (!getChrome()) {
    if (!isDroid()) {
        browser.windows.getAll().then(wins => wins.forEach(themeWindow));
    }
}
