function isFirefox() {
    testPlain = navigator.userAgent.indexOf('Firefox') !== -1;
    if (testPlain) {
        return testPlain
    }
    testTorBrowser = navigator.userAgent.indexOf('Tor') !== -1;
    if (testTorBrowser) {
        return testTorBrowser
    }
    return false
}

browser.privacy.network.peerConnectionEnabled.set({value: false});
browser.privacy.network.networkPredictionEnabled.set({value: false});
browser.privacy.network.webRTCIPHandlingPolicy.set({value: "disable_non_proxied_udp"});

console.log("Preliminarily disabled WebRTC.")

if (isFirefox()) {
    var proxySettings = {
        proxyType: "manual",
        http: "http://127.0.0.1:4444",
        passthrough: "",
        httpProxyAll: true
    };
    browser.proxy.settings.set({value:proxySettings});
    console.log("i2p settings created for Firefox")
}else{
    var config = {
        mode: "fixed_servers",
        rules: {
            proxyForHttp: {
                scheme: "http",
                host: "127.0.0.1",
                port: 4444
            },
            proxyForFtp: {
                scheme: "http",
                host: "127.0.0.1",
                port: 4444
            },
            proxyForHttps: {
                scheme: "http",
                host: "127.0.0.1",
                port: 4444
            },
            fallbackProxy: {
                scheme: "http",
                host: "127.0.0.1",
                port: 4444
            }
        }
    };
    chrome.proxy.settings.set(
      {value: config, scope: 'regular'},
      function() {});
    console.log("i2p settings created for Chromium")
}