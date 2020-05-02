function routerHost(url) {
  let hostname = "";
  let path = "";
  function pathcheck(str) {
    if (str != undefined) {
      let final = str.split("/")[0];
      console.log("(urlcheck) checking full URL for loopback addr", url);
      if (
        final === "i2ptunnelmgr" ||
        final === "i2ptunnel" ||
        url.includes("//tun.rc") ||
        url.includes("//netcat.rc") ||
        url.includes("//socat.rc")
      ) {
        console.log("(urlcheck) Tunnel application path", final);
        return "i2ptunnelmgr";
      } else if (
        final === "i2psnark" ||
        final === "torrents" ||
        final.startsWith("transmission") ||
        url.includes("//bt.rc") ||
        url.includes("//bittorrent.rc") ||
        url.includes("//torrent.rc")
      ) {
        console.log("(urlcheck) Torrent application path", final);
        return "i2psnark";
      } else if (
        final === "webmail" ||
        final === "susimail" ||
        url.includes("//mail.rc") ||
        url.includes("//webmail.rc")
      ) {
        console.log("(urlcheck) Mail application path", final);
        return "webmail";
      } else if (final.startsWith("MuWire")) {
        if (!url.includes(".png")) {
          console.log("(urlcheck) MuWire application path", final);
          return "muwire";
        }
      } else if (
        final === "home" ||
        final === "console" ||
        final === "dns" ||
        final === "sitemap" ||
        final.startsWith("config")
      ) {
        console.log("(urlcheck) Console application path", final);
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
  if (hostname === "localhost" + ":" + 7070) {
    return pathcheck(path);
  }
  if (hostname === "127.0.0.1" + ":" + 7070) {
    return pathcheck(path);
  }
  if (hostname.endsWith(".rc")) {
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
