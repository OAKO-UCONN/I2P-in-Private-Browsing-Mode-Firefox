function routerHost(url) {
  let hostname = "";
  let path = "";
  console.log("(urlcheck)", url);
  function pathcheck(str) {
    if (str != undefined) {
      let final = str.split("/")[0];
      if (final === "i2ptunnelmgr" || final === "i2ptunnel") {
        console.log("(urlcheck) application path", final);
        return "i2ptunnelmgr";
      } else if (final === "i2psnark" || final === "torrents") {
        console.log("(urlcheck) application path", final);
        return "i2psnark";
      } else if (final === "webmail" || final === "susimail") {
        console.log("(urlcheck) application path", final);
        return "webmail";
      } else if (final.startsWith("MuWire") && !final.includes("png")) {
        console.log("(urlcheck) application path", final);
        return "muwire";
      } else if (
        final === "home" ||
        final === "console" ||
        final === "dns" ||
        final.startsWith("config")
      ) {
        console.log("(urlcheck) application path", final);
        return "routerconsole";
      }
    }
    return true;
  }
  if (url.indexOf("://") > -1) {
    hostname = url.split("/")[2];
    let prefix = url.substr(0, url.indexOf("://") + 3);
    path = url.replace(prefix + hostname + "/", "");
  } else if (identifyProtocolHandler(url)) {
    let newurl = identifyProtocolHandler(url);
    return routerHost(newurl);
  } else {
    hostname = url.split("/")[0];
    path = url.replace(hostname + "/", "");
  }
  if (hostname === control_host + ":" + control_port) {
    //console.log("(hostcheck) router console found on configured ports");
    return pathcheck(path);
  }
  if (hostname === "localhost" + ":" + control_port) {
    //console.log("(hostcheck) router console found on configured ports");
    return pathcheck(path);
  }
  if (hostname === "127.0.0.1" + ":" + control_port) {
    return pathcheck(path);
  }

  return false;
}

function identifyProtocolHandler(url) {
  //console.log("looking for handler-able requests")
  if (routerHost(url)) {
    if (url.includes(encodeURIComponent("ext+rc:"))) {
      return url.replace(encodeURIComponent("ext+rc:"), "");
    } else if (url.includes("ext+rc:")) {
      return url.replace("ext+rc:", "");
    }
  } else if (url.includes("ext+rc:")) {
    return url;
  }
  return false;
}

function trimHost(url) {
  let hostname = "";
  let prefix = "";
  if (url.indexOf("://") > -1) {
    prefix = url.substr(0, url.indexOf("://") + 3);
    hostname = url.split("/")[2];
  } else {
    hostname = url.split("/")[0];
  }
  let path = url.replace(prefix + hostname, "");
  console.log("(handler) path", prefix + hostname, path);
  return path;
}

var handlerSetup = function(requestDetails) {
  //console.log("checking protocol handler listener")
  let rwurl = identifyProtocolHandler(requestDetails.url);
  if (rwurl != false) {
    console.log("(handler) rewrite URL requested", rwurl);
    requestDetails.redirectUrl = rwurl;
    requestDetails.url = trimHost(rwurl);
    requestDetails.originUrl = trimHost(rwurl);
  }
  return requestDetails;
};

browser.webRequest.onBeforeRequest.addListener(
  handlerSetup,
  { urls: ["<all_urls>"] },
  ["blocking"]
);
