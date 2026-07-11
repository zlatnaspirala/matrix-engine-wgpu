// src/engine/utils.js
var supportsTouch = "ontouchstart" in window || navigator.msMaxTouchPoints;
var MeshType = Object.freeze({ MESH: 0, INSTANCED: 1, PROCEDURAL: 2, BVHANIM: 3 });
var cachedUserAgent = navigator.userAgent;
var scriptManager = {
  SCRIPT_ID: 0,
  LOAD: function addScript(src, id, type, parent, callback) {
    var s = document.createElement("script");
    s.onload = function() {
      if (typeof callback != "undefined") callback();
    };
    if (typeof type !== "undefined") {
      s.setAttribute("type", type);
      s.innerHTML = src;
    } else {
      s.setAttribute("src", src);
    }
    if (typeof id !== "undefined") {
      s.setAttribute("id", id);
    }
    if (typeof parent !== "undefined") {
      document.getElementById(parent).appendChild(s);
      if (typeof callback != "undefined") callback();
    } else {
      document.body.appendChild(s);
    }
  },
  loadModule: function addScript2(src, id, type, parent) {
    var s = document.createElement("script");
    s.onload = function() {
      scriptManager.SCRIPT_ID++;
    };
    if (typeof type === "undefined") {
      s.setAttribute("type", "module");
      s.setAttribute("src", src);
    } else {
      s.setAttribute("type", type);
      s.innerHTML = src;
    }
    s.setAttribute("src", src);
    if (typeof id !== "undefined") {
      s.setAttribute("id", id);
    }
    if (typeof parent !== "undefined") {
      document.getElementById(parent).appendChild(s);
    } else {
      document.body.appendChild(s);
    }
  },
  loadGLSL: function(src) {
    return new Promise((resolve) => {
      fetch(src).then((data) => {
        resolve(data.text());
      });
    });
  }
};
var urlQuery = (function() {
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
      query_string[pair[0]] = arr;
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  }
  return query_string;
})();
var jsonHeaders = new Headers({
  "Content-Type": "application/json",
  "Accept": "application/json"
});
var htmlHeader = new Headers({
  "Content-Type": "text/html",
  "Accept": "text/plain"
});
var geometryTypes = Object.freeze({
  "quad": "quad",
  "cube": "cube",
  "sphere": "sphere",
  "pyramid": "pyramid",
  "star": "star",
  "circle": "circle",
  "diamond": "diamond",
  "rock": "rock",
  "meteor": "meteor",
  "thunder": "thunder",
  "shard": "shard",
  "circlePlane": "circlePlane",
  "ring": "ring",
  "icosahedron": "icosahedron",
  "torusKnot": "torusKnot",
  "mobius": "mobius",
  "crystal": "crystal",
  "starPrism": "starPrism",
  "crescent": "crescent",
  "pyramidFractal": "pyramidFractal"
});
var geoTypesForMorph = Object.freeze({
  cube: "cube",
  sphere: "sphere",
  mobius: "mobius",
  cylinder: "cylinder",
  plane: "plane",
  capsule: "capsule",
  cone: "cone",
  torus: "torus",
  wavePlane: "wavePlane",
  supershape: "supershape",
  pyramid: "pyramid",
  diamond: "diamond",
  icosahedron: "icosahedron",
  circlePlane: "circlePlane",
  rock: "rock",
  star: "star",
  star3d: "star3d",
  littleStar: "littleStar",
  flatStar: "flatStar",
  klein: "klein",
  shell: "shell",
  rippleSphere: "rippleSphere",
  twistedTorus: "twistedTorus",
  tornado: "tornado",
  galaxySpiral: "galaxySpiral"
});

// src/engine/networking/matrix-stream.js
var netConfig = {
  NETWORKING_DOMAIN: "",
  NETWORKING_PORT: "2020",
  isDataOnly: false,
  streamRender: false
};
function byId2(d) {
  return document.getElementById(d);
}
var BIGLOG = "color: #55fd53;font-size:20px;text-shadow: 0px 0px 5px #f4fd63, -1px -1px 5px orange";
var REDLOG = "color: lime;font-size:15px;text-shadow: 0px 0px 5px red, -2px -2px 5px orangered";
var OV;
var numVideos = 0;
var sessionName;
var token;
var session;
function joinSession(options) {
  if (typeof options === "undefined") {
    options = {
      resolution: "320x240"
    };
  }
  document.getElementById("join-btn").disabled = true;
  document.getElementById("join-btn").innerHTML = "Joining...";
  getToken(function() {
    OV = new OpenVidu();
    window.OV = OV;
    session = OV.initSession();
    session.on("connectionCreated", (event) => {
      dispatchEvent(new CustomEvent("onConnectionCreated", { detail: event }));
      pushEvent(event);
    });
    session.on("connectionDestroyed", (e2) => {
      dispatchEvent(new CustomEvent("connectionDestroyed", { detail: { connectionId: e2.connection.connectionId, event: e2 } }));
      pushEvent(e2);
    });
    if (!options.isDataOnly) {
      session.on("streamCreated", (event) => {
        pushEvent(event);
        console.log(`%c [onStreamCreated] ${event.stream.streamId}`);
        setTimeout(() => {
          console.log(`%c REMOTE STREAM READY [] ${byId2("remote-video-" + event.stream.streamId)}`, BIGLOG);
        }, 2e3);
        dispatchEvent(new CustomEvent("onStreamCreated", { detail: { event, msg: `[connectionId][${event.stream.connection.connectionId}]` } }));
        var subscriber = session.subscribe(event.stream, "video-container");
        subscriber.on("videoElementCreated", (event2) => {
          dispatchEvent(new CustomEvent(`videoElementCreatedSubscriber`, { detail: event2 }));
          updateNumVideos(1);
        });
        subscriber.on("videoElementDestroyed", (event2) => {
          pushEvent(event2);
          updateNumVideos(-1);
        });
        subscriber.on("streamPlaying", (event2) => {
          dispatchEvent(new CustomEvent("streamPlaying", { detail: event2 }));
        });
      });
      session.on("streamDestroyed", (event) => {
        pushEvent(event);
      });
    } else {
      session.on("streamCreated", (event) => {
        const subscriber = session.subscribe(event.stream, "subscriber");
        console.log("USER DATA: " + event.stream.connection.data);
      });
    }
    session.on("sessionDisconnected", (event) => {
      console.log("Session Disconected", event);
      pushEvent(event);
      if (event.reason !== "disconnect") {
        removeUser();
      }
      if (event.reason !== "sessionClosedByServer") {
        session = null;
        numVideos = 0;
        byId2("join").style.display = "block";
        byId2("session").style.display = "none";
      }
    });
    session.on("exception", (exception) => {
      console.warn(exception);
    });
    dispatchEvent(new CustomEvent(`setupSessionObject`, { detail: session }));
    if (netConfig.streamRender === true) {
      session.connect(token, netConfig.customData).then(() => {
        byId2("session-title").innerText = sessionName;
        byId2("join").style.display = "none";
        byId2("session").style.display = "block";
        const stream = app.canvas.captureStream(30);
        const videoTrack = stream.getVideoTracks()[0];
        var publisher = OV.initPublisher("video-container", {
          audioSource: false,
          videoSource: videoTrack,
          publishAudio: false,
          publishVideo: true,
          resolution: options.resolution,
          frameRate: 30,
          insertMode: "APPEND",
          mirror: false
        });
        session.publish(publisher);
        console.log("[STREAM RENDER]", session);
      }).catch((error) => {
        console.warn("Error connecting to the session [stream render]:", error.code, error.message);
        enableBtn();
      });
    } else if (!netConfig.isDataOnly) {
      session.connect(token).then(() => {
        byId2("session-title").innerText = sessionName;
        byId2("join").style.display = "none";
        byId2("session").style.display = "block";
        var publisher = OV.initPublisher("video-container", {
          audioSource: netConfig.isDataOnly ? false : void 0,
          // The source of audio. If undefined default microphone
          videoSource: netConfig.isDataOnly ? false : void 0,
          // The source of video. If undefined default webcam
          publishAudio: !netConfig.isDataOnly,
          // Whether you want to start publishing with your audio unmuted or not
          publishVideo: !netConfig.isDataOnly,
          // Whether you want to start publishing with your video enabled or not
          resolution: options.resolution,
          // The resolution of your video
          frameRate: 30,
          // The frame rate of your video
          insertMode: "APPEND",
          // How the video is inserted in the target element 'video-container'
          mirror: false
          // Whether to mirror your local video or not
        });
        publisher.on("accessAllowed", (event) => {
          pushEvent({
            type: "accessAllowed"
          });
        });
        publisher.on("accessDenied", (event) => {
          pushEvent(event);
        });
        publisher.on("accessDialogOpened", (event) => {
          pushEvent({
            type: "accessDialogOpened"
          });
        });
        publisher.on("accessDialogClosed", (event) => {
          pushEvent({
            type: "accessDialogClosed"
          });
        });
        publisher.on("streamCreated", (event) => {
          dispatchEvent(new CustomEvent(`LOCAL-STREAM-READY`, { detail: event.stream }));
          console.log(`%c LOCAL STREAM READY ${event.stream.connection.connectionId}`, BIGLOG);
          pushEvent(event);
        });
        publisher.on("videoElementCreated", (event) => {
          dispatchEvent(new CustomEvent(`videoElementCreated`, { detail: event }));
          updateNumVideos(1);
          console.log("NOT FIXED MUTE event.element, ", event.element);
          event.element.mute = true;
        });
        publisher.on("videoElementDestroyed", (event) => {
          dispatchEvent(new CustomEvent(`videoElementDestroyed`, { detail: event }));
          pushEvent(event);
          updateNumVideos(-1);
        });
        publisher.on("streamPlaying", (event) => {
          console.log("streamPlaying");
          dispatchEvent(new CustomEvent(`streamPlaying`, { detail: event }));
        });
        session.publish(publisher);
      }).catch((error) => {
        console.warn("Error connecting to the session:", error.code, error.message);
        enableBtn();
      });
    } else {
      console.log("netConfig", netConfig.customData);
      session.connect(token, netConfig.customData).then(() => {
        byId2("session-title").innerText = sessionName;
        byId2("join").style.display = "none";
        byId2("session").style.display = "block";
      }).catch((error) => {
        console.warn("Error connecting to the session:", error.code, error.message);
        enableBtn();
      });
    }
    return false;
  });
}
function leaveSession() {
  session.disconnect();
  enableBtn();
}
function enableBtn() {
  document.getElementById("join-btn").disabled = false;
  document.getElementById("join-btn").innerHTML = "Join!";
}
function getToken(callback) {
  sessionName = byId2("sessionName").value;
  httpRequest(
    "POST",
    "https://" + netConfig.NETWORKING_DOMAIN + ":" + netConfig.NETWORKING_PORT + "/api/get-token",
    {
      sessionName
    },
    "Request of TOKEN gone WRONG:",
    (res) => {
      token = res[0];
      console.log("Excellent (TOKEN:" + token + ")");
      callback(token);
    }
  );
}
function removeUser() {
  httpRequest(
    "POST",
    "https://" + netConfig.NETWORKING_DOMAIN + ":" + netConfig.NETWORKING_PORT + "/api/remove-user",
    {
      sessionName,
      token
    },
    "User couldn't be removed from session",
    (res) => {
      console.warn("You have been removed from session " + sessionName);
    }
  );
}
function closeSession() {
  httpRequest(
    "DELETE",
    "https://" + netConfig.NETWORKING_DOMAIN + ":" + netConfig.NETWORKING_PORT + "/api/close-session",
    {
      sessionName
    },
    "Session couldn't be closed",
    (res) => {
      console.warn("Session " + sessionName + " has been closed");
    }
  );
}
function fetchInfo(sessionName2) {
  httpRequest(
    "POST",
    "https://" + netConfig.NETWORKING_DOMAIN + ":" + netConfig.NETWORKING_PORT + "/api/fetch-info",
    {
      sessionName: sessionName2
    },
    "Session couldn't be fetched",
    (res) => {
      dispatchEvent(new CustomEvent("check-gameplay-channel", { detail: JSON.stringify(res, null, "	") }));
    }
  );
}
function httpRequest(method, url, body, errorMsg, callback) {
  byId2("textarea-http").innerText = "";
  var http = new XMLHttpRequest();
  http.open(method, url, true);
  http.setRequestHeader("Content-type", "application/json");
  http.addEventListener("readystatechange", processRequest, false);
  http.send(JSON.stringify(body));
  function processRequest() {
    if (http.readyState == 4) {
      if (http.status == 200) {
        try {
          callback(JSON.parse(http.responseText));
        } catch (e2) {
          callback(e2);
        }
      } else {
        console.warn(errorMsg + " (" + http.status + ")");
        if (url.indexOf("fetch-info") != -1) {
          if (http.status == 0 && errorMsg == "Session couldn't be fetched") {
            const errorText = errorMsg + ": HTTP " + http.status + " (" + http.responseText + ")";
            dispatchEvent(new CustomEvent("check-gameplay-channel", { detail: { status: "false", errorText } }));
          } else {
            dispatchEvent(new CustomEvent("check-gameplay-channel", { detail: { status: "free", url } }));
          }
        }
      }
    }
  }
}
var events = "";
window.onbeforeunload = function() {
  if (session) {
    removeUser();
    leaveSession();
  }
};
function updateNumVideos(i) {
  numVideos += i;
  var coll = document.getElementsByTagName("video");
  for (var x = 0; x < coll.length; x++) {
    coll.classList = "";
  }
  for (var x = 0; x < coll.length; x++) {
    coll.classList = "";
    switch (numVideos) {
      case 1:
        coll[x].classList.add("two");
        break;
      case 2:
        coll[x].classList.add("two");
        break;
      case 3:
        coll[x].classList.add("three");
        break;
      case 4:
        coll[x].classList.add("four");
        break;
    }
  }
}
function pushEvent(event) {
  events += (!events ? "" : "\n") + event.type;
  byId2("textarea-events").innerText = events;
}

// src/engine/networking/net.js
var MatrixStream = class {
  connection = null;
  session = null;
  constructor(arg) {
    if (typeof arg === "undefined") {
      throw console.error("MatrixStream constructor must have argument : { domain: <DOMAIN_NAME> , port: <NUMBER> }");
    }
    netConfig.NETWORKING_DOMAIN = arg.domain;
    netConfig.NETWORKING_PORT = arg.port;
    netConfig.sessionName = arg.sessionName;
    netConfig.resolution = arg.resolution;
    netConfig.isDataOnly = arg.isDataOnly;
    netConfig.streamRender = arg.streamRender;
    if (arg.customData) netConfig.customData = arg.customData;
    scriptManager.LOAD("./networking/openvidu-browser-2.20.0.js", void 0, void 0, void 0, () => {
      setTimeout(() => {
        this.loadNetHTML();
      }, 2500);
    });
  }
  loadNetHTML() {
    fetch("./networking/broadcaster2.html", { headers: htmlHeader }).then((res) => {
      return res.text();
    }).then((html) => {
      var popupUI = byId2("matrix-net");
      popupUI.style = "display: block;";
      popupUI.innerHTML = html;
      this.joinSessionUI = byId2("join-btn");
      this.buttonCloseSession = byId2("buttonCloseSession");
      this.buttonLeaveSession = byId2("buttonLeaveSession");
      byId2("sessionName").value = netConfig.sessionName;
      this.sessionName = byId2("sessionName");
      console.log("[CHANNEL]" + this.sessionName.value);
      this.attachEvents();
      this.closeSession = closeSession;
      console.log(`%cMatrixStream constructed.`, BIGLOG);
    });
  }
  attachEvents() {
    this.fetchInfo = fetchInfo;
    this.sendOnlyData = (netArg) => {
      this.session.signal({
        data: JSON.stringify(netArg),
        to: [],
        type: netConfig.sessionName + "-data"
      }).then(() => {
      }).catch((error) => {
        console.error("Erro signal => ", error);
      });
    };
    this.send = (netArg) => {
      const to = netArg.toRemote ? netArg.toRemote : [];
      netArg.toRemote = "null";
      this.session.signal({
        data: JSON.stringify(netArg),
        to,
        type: netConfig.sessionName
      }).then(() => {
      }).catch((error) => {
        console.error("Erro signal => ", error);
      });
    };
    addEventListener(`LOCAL-STREAM-READY`, (e2) => {
      console.log("LOCAL-STREAM-READY ", e2.detail.connection);
      this.connection = e2.detail.connection;
      var CHANNEL = netConfig.sessionName;
      this.connection.send = (netArg) => {
        this.session.signal({
          data: JSON.stringify(netArg),
          to: [],
          type: CHANNEL
        }).then(() => {
        }).catch((error) => {
          console.error("Erro signal => ", error);
        });
      };
    });
    addEventListener("setupSessionObject", (e2) => {
      this.session = e2.detail;
      this.connection = e2.detail.connection;
      this.session.on(`signal:${netConfig.sessionName}`, (e3) => {
        if (this.session.connection.connectionId == e3.from.connectionId) {
        } else {
          this.multiPlayer.update(e3);
        }
      });
      this.session.on(`signal:${netConfig.sessionName}-data`, (e3) => {
        if (this.session.connection.connectionId == e3.from.connectionId) {
          dispatchEvent(new CustomEvent("self-msg-data", { detail: e3 }));
        } else {
          dispatchEvent(new CustomEvent("only-data-receive", { detail: e3 }));
        }
      });
    });
    addEventListener("streamPlaying", (e2) => {
      console.log("streamPlaying from engine ", e2.detail);
      const isRemote = e2.detail.target.id.indexOf("remote-video") !== -1;
      const vr = e2.detail.target.videos[0].video;
      const streamId = e2.detail.target.id;
      if (isRemote) {
        StreamSlotManager.addRemote(vr, streamId);
      } else {
        StreamSlotManager.addLocal(vr);
      }
    });
    addEventListener("connectionDestroyed", (e2) => {
      const rc = byId2("video-container");
      if (!rc) return;
      rc.querySelectorAll("div:not(:has(*))").forEach((div) => div.remove());
    });
    this.joinSessionUI.addEventListener("click", () => {
      console.log(`%c JOIN SESSION [${netConfig.resolution}] `, REDLOG);
      joinSession({
        resolution: netConfig.resolution,
        isDataOnly: netConfig.isDataOnly
      });
    });
    this.joinSessionUI.style.zIndex = "10";
    this.buttonCloseSession.addEventListener("click", closeSession);
    this.buttonLeaveSession.addEventListener("click", () => {
      console.log(`%cLEAVE SESSION`, REDLOG);
      removeUser();
      leaveSession();
    });
    byId2("netHeaderTitle").style.position = "relative";
    byId2("netHeaderTitle").style.zIndex = "10";
    byId2("netHeaderTitle").addEventListener("click", this.domManipulation.hideNetPanel);
    setTimeout(() => dispatchEvent(new CustomEvent("net-ready", {})), 2500);
  }
  multiPlayer = {
    root: this,
    onFollowPath(e2) {
    },
    update(e2) {
      e2.data = JSON.parse(e2.data);
      try {
        if (e2.data.netPos) {
          app.getSceneObjectByName(e2.data.remoteName ? e2.data.remoteName : e2.data.sceneName).position.setPosition(e2.data.netPos.x, e2.data.netPos.y, e2.data.netPos.z);
        } else if (e2.data.netRotY || e2.data.netRotY == 0) {
          app.getSceneObjectByName(e2.data.remoteName ? e2.data.remoteName : e2.data.sceneName).rotation.y = e2.data.netRotY;
        } else if (e2.data.netRotX || e2.data.netRotX == 0) {
          app.getSceneObjectByName(e2.data.remoteName ? e2.data.remoteName : e2.data.sceneName).rotation.x = e2.data.netRotX;
        } else if (e2.data.netRotZ || e2.data.netRotZ == 0) {
          app.getSceneObjectByName(e2.data.remoteName ? e2.data.remoteName : e2.data.sceneName).rotation.z = e2.data.netRotZ;
        } else if (e2.data.animationIndex || e2.data.animationIndex == 0) {
          console.log(`play animation from net , e.data.sceneName:${e2.data.sceneName}  vs  e.data.remoteName: ${e2.data.remoteName}
               e.data.animationIndex ${e2.data.animationIndex}
            
            `);
          app.getSceneObjectByName(e2.data.remoteName ? e2.data.remoteName : e2.data.sceneName).playAnimationByIndex(e2.data.animationIndex);
        }
      } catch (err) {
        console.info("mmo-err:", err);
      }
    },
    leaveGamePlay() {
    }
  };
  domManipulation = {
    hideNetPanel: () => {
      if (byId2("matrix-net").classList.contains("hide-by-vertical")) {
        byId2("matrix-net").classList.remove("hide-by-vertical");
        byId2("matrix-net").classList.add("show-by-vertical");
        byId2("netHeaderTitle").innerText = "HIDE";
      } else {
        byId2("matrix-net").classList.remove("show-by-vertical");
        byId2("matrix-net").classList.add("hide-by-vertical");
        byId2("netHeaderTitle").innerText = "SHOW";
      }
    }
  };
};
var StreamSlotManager = {
  slots: [],
  _updateLayout() {
    const container = document.getElementById("video-container");
    const count = this.slots.length;
    if (!container || count === 0) return;
    const cols = count === 1 ? 1 : count <= 4 ? 2 : 3;
    const pct = (100 / cols).toFixed(2) + "%";
    this.slots.forEach((slot) => {
      slot.wrapper.style.width = `calc(${pct} - 4px)`;
    });
  },
  addRemote(videoEl, streamId) {
    const container = document.getElementById("video-container");
    const wrapper = document.createElement("div");
    wrapper.dataset.streamId = streamId;
    Object.assign(wrapper.style, {
      overflow: "hidden",
      background: "#000",
      aspectRatio: "16/9",
      transition: "width 0.3s ease"
    });
    videoEl.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
    wrapper.appendChild(videoEl);
    container.appendChild(wrapper);
    this.slots.push({ wrapper, streamId });
    this._updateLayout();
  },
  addLocal(videoEl) {
    videoEl.style.cssText = "position:fixed;bottom:16px;right:16px;width:180px;aspect-ratio:16/9;object-fit:cover;border-radius:8px;border:2px solid rgba(255,255,255,0.3);z-index:999;";
  },
  removeRemote(streamId) {
    const idx = this.slots.findIndex((s) => s.streamId === streamId);
    if (idx === -1) return;
    this.slots[idx].wrapper.remove();
    this.slots.splice(idx, 1);
    this._updateLayout();
  }
};

// android-tv-cast.js
var BeastCast = new MatrixStream({
  active: true,
  domain: "maximumroulette.com",
  port: 2020,
  sessionName: "tv-beast",
  resolution: "1920x1080",
  isDataOnly: false
});
addEventListener("net-ready", () => {
  byId2("caller-title").innerHTML = "Welcome to matrix-engine-wgpu remote render app";
  byId2("matrix-net").style.width = "100%";
  console.info("TEST TV READY");
  byId2("matrix-net").style.opacity = "0.75";
  byId2("sessionName").disabled = true;
  byId2("buttonCloseSession").remove();
});
addEventListener("connectionDestroyed", (e2) => {
});
addEventListener("onConnectionCreated", (e2) => {
  console.log("newconn : created ", e2.detail);
  if (BeastCast.session.connection.connectionId == e2.detail.connection.connectionId) {
    console.log("newconn : created [LOCAL] determinate team");
    document.title = BeastCast.session.connection.connectionId;
    if (BeastCast.session.connection != null) {
      BeastCast.sendOnlyData({ type: "chat" });
    }
  }
  console.info("onConnectionCreated - Test number of players ");
});
addEventListener("streamPlaying", (e2) => {
  console.log("streamPlaying >>>>> ", e2.detail);
  setTimeout(() => {
    if (e2.detail.target.id.indexOf("remote-video") !== -1) {
      let vr = e2.detail.target.videos[0].video;
      vr.style.position = "absolute";
      vr.style.left = "10%";
      vr.style.top = "5vh";
      vr.style.width = "80%";
      vr.style.height = "90vh";
    } else {
      let vr = e2.detail.target.videos[0].video;
      vr.style.position = "absolute";
      vr.style.left = "5%";
      vr.style.bottom = "5%";
      vr.style.height = window.innerHeight * 0.2 + "px";
    }
  }, 1e3);
});
addEventListener("videoElementCreated", (e2) => {
  console.log("videoElementCreated >>>>> ", e2.detail);
});
addEventListener("only-data-receive", (e2) => {
  let t2 = JSON.parse(e2.detail.data);
  console.log(`data-receive`, t2);
  if (t2) {
    if (t2.type == "team-notify") {
    } else if (t2.type == "chat") {
    }
  }
});
