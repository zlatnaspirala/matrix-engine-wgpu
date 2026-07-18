import {scriptManager, htmlHeader} from "../utils";
import {BIGLOG, byId, closeSession, fetchInfo, joinSession, leaveSession, netConfig, REDLOG, removeUser} from "./matrix-stream";

/**
 * Main instance for matrix-stream
 * Same logic like all others implementation
 * with openvidu/kurento server.
 * 
 * You can use old networking if you wanna 
 * full control (MultiRtc3 like in matrix-engine old versions)
 */
export class MatrixStream {

  connection = null;
  session = null;

  constructor(arg) {
    if(typeof arg === 'undefined') {
      throw console.error('MatrixStream constructor must have argument : { domain: <DOMAIN_NAME> , port: <NUMBER> }');
    }
    netConfig.NETWORKING_DOMAIN = arg.domain;
    netConfig.NETWORKING_PORT = arg.port;
    netConfig.sessionName = arg.sessionName;
    netConfig.resolution = arg.resolution;
    netConfig.isDataOnly = arg.isDataOnly;
    netConfig.streamRender = arg.streamRender;
    if(arg.customData) netConfig.customData = arg.customData;
    scriptManager.LOAD('./networking/openvidu-browser-2.20.0.js', undefined, undefined, undefined, () => {
      setTimeout(() => {this.loadNetHTML()}, 2500)
    });

    // addEventListener("onConnectionCreated", (e) => {console.log('newconn:created', e.detail);})
  }

  loadNetHTML() {
    fetch("./networking/broadcaster2.html", {headers: htmlHeader}).then((res) => {return res.text()})
      .then((html) => {
        var popupUI = byId("matrix-net");
        popupUI.style = 'display: block;';
        popupUI.innerHTML = html;
        this.joinSessionUI = byId("join-btn");
        this.buttonCloseSession = byId('buttonCloseSession');
        this.buttonLeaveSession = byId('buttonLeaveSession');
        byId("sessionName").value = netConfig.sessionName;
        this.sessionName = byId("sessionName");
        console.log('[CHANNEL]' + this.sessionName.value);
        this.attachEvents();
        this.closeSession = closeSession;
        console.log(`%cMatrixStream constructed.`, BIGLOG);
      });
  }

  attachEvents() {
    this.fetchInfo = fetchInfo;
    // just for data only test 
    this.sendOnlyData = (netArg) => {
      this.session.signal({
        data: JSON.stringify(netArg),
        to: [],
        type: netConfig.sessionName + "-data"
      }).then(() => {
        // console.log('emit all successfully');
      }).catch(error => {
        console.error("Erro signal => ", error);
      });
    }

    this.send = (netArg) => {
      const to = (netArg.toRemote ? netArg.toRemote : []);
      netArg.toRemote = 'null';
      this.session.signal({
        data: JSON.stringify(netArg),
        to: to,
        type: netConfig.sessionName
      }).then(() => {
        // console.log('netArg.toRemote:' , netArg.toRemote);
      }).catch(error => {
        console.error("Erro signal => ", error);
      });
    }

    addEventListener(`LOCAL-STREAM-READY`, (e) => {
      console.log('LOCAL-STREAM-READY ', e.detail.connection)
      this.connection = e.detail.connection;
      var CHANNEL = netConfig.sessionName
      // console.log("ONLY ONES CHANNEL =>", CHANNEL);
      this.connection.send = (netArg) => {
        this.session.signal({
          data: JSON.stringify(netArg),
          to: [],
          type: CHANNEL
        }).then(() => {
          // console.log('emit all successfully');
        }).catch(error => {
          console.error("Erro signal => ", error);
        });
      }
    })

    addEventListener('setupSessionObject', (e) => {
      // console.log("setupSessionObject=>", e.detail);
      this.session = e.detail;
      this.connection = e.detail.connection;
      this.session.on(`signal:${netConfig.sessionName}`, (e) => {
        // console.log("SIGBAL SYS RECEIVE=>", e);
        if(this.session.connection.connectionId == e.from.connectionId) {
          // avoid - option
          // dispatchEvent(new CustomEvent('self-msg', {detail: e}));
        } else {
          this.multiPlayer.update(e);
        }
      });
      this.session.on(`signal:${netConfig.sessionName}-data`, (e) => {
        // console.log("SIGBAL DATA RECEIVE LOW LEVEL TEST OWN MESG =>", e);
        if(this.session.connection.connectionId == e.from.connectionId) {
          dispatchEvent(new CustomEvent('self-msg-data', {detail: e}));
        } else {
          dispatchEvent(new CustomEvent('only-data-receive', {detail: e}))
        }
      });
    })

    addEventListener("streamPlaying", (e) => {
      console.log('streamPlaying from engine ', e.detail);
      const isRemote = e.detail.target.id.indexOf('remote-video') !== -1;
      const vr = e.detail.target.videos[0].video;
      const streamId = e.detail.target.id;
      if(isRemote) {
        StreamSlotManager.addRemote(vr, streamId);
      } else {
        StreamSlotManager.addLocal(vr);
      }
    });

    addEventListener("connectionDestroyed", (e) => {
      // console.log('connectionDestroyed from engine ', e.detail);
      const rc = byId('video-container');
      if(!rc) return;
        rc.querySelectorAll('div:not(:has(*))').forEach(div => div.remove());
    });

    this.joinSessionUI.addEventListener('click', () => {
      console.log(`%c JOIN SESSION [${netConfig.resolution}] `, REDLOG);
      console.log(`%c JOIN isDataOnly [${netConfig.isDataOnly}] `, REDLOG);
      joinSession({
        resolution: netConfig.resolution,
        isDataOnly: netConfig.isDataOnly
      })
    })

    this.joinSessionUI.style.zIndex = '10';

    // this.buttonCloseSession.remove();
    this.buttonCloseSession.addEventListener('click', closeSession);

    this.buttonLeaveSession.addEventListener('click', () => {
      console.log(`%cLEAVE SESSION`, REDLOG)
      removeUser();
      leaveSession();
    })

    byId('netHeaderTitle').style.position = 'relative';
    byId('netHeaderTitle').style.zIndex = '10';
    byId('netHeaderTitle').addEventListener('click', this.domManipulation.hideNetPanel)

    setTimeout(() => dispatchEvent(new CustomEvent('net-ready', {})), 2500)
  }

  multiPlayer = {
    root: this,
    onFollowPath(e) {},
    update(e) {
      e.data = JSON.parse(e.data);
      try {
        if(e.data.netPos) {
          // console.log(app.getSceneObjectByName(e.data.sceneName) + ">>>>><<<<<<<><><><><><<>" )
          app.getSceneObjectByName(e.data.remoteName ? e.data.remoteName : e.data.sceneName).position.setPosition(e.data.netPos.x, e.data.netPos.y, e.data.netPos.z);
        } else if(e.data.netRotY || e.data.netRotY == 0) {
          app.getSceneObjectByName(e.data.remoteName ? e.data.remoteName : e.data.sceneName).rotation.y = e.data.netRotY;
        } else if(e.data.netRotX || e.data.netRotX == 0) {
          app.getSceneObjectByName(e.data.remoteName ? e.data.remoteName : e.data.sceneName).rotation.x = e.data.netRotX;
        } else if(e.data.netRotZ || e.data.netRotZ == 0) {
          app.getSceneObjectByName(e.data.remoteName ? e.data.remoteName : e.data.sceneName).rotation.z = e.data.netRotZ;
        } else if(e.data.animationIndex || e.data.animationIndex == 0) {
          console.log(`play animation from net , e.data.sceneName:${e.data.sceneName}  vs  e.data.remoteName: ${e.data.remoteName}
               e.data.animationIndex ${e.data.animationIndex}
            
            `)
          app.getSceneObjectByName(e.data.remoteName ? e.data.remoteName : e.data.sceneName).playAnimationByIndex(e.data.animationIndex);
        }
      } catch(err) {
        console.info('mmo-err:', err);
      }
    },
    leaveGamePlay() {}
  };

  domManipulation = {
    hideNetPanel: () => {
      if(byId('matrix-net').classList.contains('hide-by-vertical')) {
        byId('matrix-net').classList.remove('hide-by-vertical')
        byId('matrix-net').classList.add('show-by-vertical')
        byId('netHeaderTitle').innerText = 'HIDE';
      } else {
        byId('matrix-net').classList.remove('show-by-vertical')
        byId('matrix-net').classList.add('hide-by-vertical')
        byId('netHeaderTitle').innerText = 'SHOW';
      }
    }
  }
}

export let activateNet2 = (sessionOption) => {

  console.info(`%cNetworking2 [openvidu/kurento server] params: ${sessionOption}`, CS3);
  // -----------------------
  // Make run
  // -----------------------
  if(typeof sessionOption === 'undefined') {
    var sessionOption = {};
    sessionOption.sessionName = 'matrix-engine-random';
    sessionOption.resolution = '160x240';
    sessionOption.active = true;
    sessionOption.domain = 'maximumroulette.com';
    sessionOption.port = 2020;
  }
  net = new MatrixStream({
    domain: t.networking2.domain,
    port: t.networking2.port,
    sessionName: sessionOption.sessionName,
    resolution: sessionOption.resolution
  })

  addEventListener(`setTitle`, (e) => {
    document.title = e.detail;
  })
};

const StreamSlotManager = {
  slots: [],

  _updateLayout() {
    const container = document.getElementById('video-container');
    const count = this.slots.length;
    if(!container || count === 0) return;

    const cols = count === 1 ? 1 : count <= 4 ? 2 : 3;
    const pct = (100 / cols).toFixed(2) + '%';

    this.slots.forEach(slot => {
      slot.wrapper.style.width = `calc(${pct} - 4px)`;
    });
  },

  addRemote(videoEl, streamId) {
    const container = document.getElementById('video-container');
    const wrapper = document.createElement('div');
    wrapper.dataset.streamId = streamId;
    Object.assign(wrapper.style, {
      overflow: 'hidden',
      background: '#000',
      aspectRatio: '16/9',
      transition: 'width 0.3s ease',
    });

    videoEl.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    wrapper.appendChild(videoEl);
    container.appendChild(wrapper);
    this.slots.push({wrapper, streamId});
    this._updateLayout();
  },

  addLocal(videoEl) {
    // local PiP stays in corner, outside the grid
    videoEl.style.cssText = 'position:fixed;bottom:16px;right:16px;width:180px;aspect-ratio:16/9;object-fit:cover;border-radius:8px;border:2px solid rgba(255,255,255,0.3);z-index:999;';
  },

  removeRemote(streamId) {
    const idx = this.slots.findIndex(s => s.streamId === streamId);
    if(idx === -1) return;
    this.slots[idx].wrapper.remove();
    this.slots.splice(idx, 1);
    this._updateLayout();
  },
};