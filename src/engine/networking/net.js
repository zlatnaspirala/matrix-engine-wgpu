import {scriptManager, htmlHeader} from "../utils";
import {BIGLOG, byId, closeSession, joinSession, leaveSession, netConfig, REDLOG, removeUser} from "./matrix-stream";

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
        console.log('[CHANNEL]' + this.sessionName.value)
        this.attachEvents()
        console.log(`%c MatrixStream constructed.`, BIGLOG)
      });
  }

  attachEvents() {
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
      console.log("setupSessionObject=>", e.detail);
      this.session = e.detail;
      this.connection = e.detail.connection;
      this.session.on(`signal:${netConfig.sessionName}`, (e) => {
        console.log("SIGBAL SYS RECEIVE=>", e);
        if(this.connection.connectionId == e.from.connectionId) {
          // avoid - option
          dispatchEvent(new CustomEvent('self-msg', {detail: e}));
        } else {
          this.multiPlayer.update(e);
        }
      });
      this.session.on(`signal:${netConfig.sessionName}-data`, (e) => {
        // console.log("SIGBAL DATA RECEIVE=>", e);
        console.log("SIGBAL DATA RECEIVE LOW LEVEL TEST OWN MESG =>", e);
        if(this.connection.connectionId == e.from.connectionId) {
          dispatchEvent(new CustomEvent('self-msg-data', {detail: e}));
        } else {
          dispatchEvent(new CustomEvent('only-data-receive', {detail: e}))
        }
      });
    })

    this.joinSessionUI.addEventListener('click', () => {
      console.log(`%c JOIN SESSION [${netConfig.resolution}] `, REDLOG)
      joinSession({
        resolution: netConfig.resolution,
        isDataOnly: netConfig.isDataOnly
      })
    })

    this.buttonCloseSession.remove();
    // this.buttonCloseSession.addEventListener('click', closeSession);

    this.buttonLeaveSession.addEventListener('click', () => {
      console.log(`%c LEAVE SESSION`, REDLOG)
      removeUser()
      leaveSession()
    })

    byId('netHeaderTitle').addEventListener('click', this.domManipulation.hideNetPanel)
    setTimeout(() => dispatchEvent(new CustomEvent('net-ready', {})), 100)
  }

  multiPlayer = {
    root: this,
    init(rtcEvent) {
      console.log("rtcEvent add new net object -> ", rtcEvent);
      dispatchEvent(new CustomEvent('net-new-user', {detail: {data: rtcEvent}}))
    },
    update(e) {
      e.data = JSON.parse(e.data);
      // dispatchEvent(new CustomEvent('network-data', {detail: e.data}))
      console.log('REMOTE UPDATE::::', e);
      if(e.data.netPos) {
        if(App.scene[e.data.netObjId]) {
          // if(e.data.netPos.x) App.scene[e.data.netObjId].position.SetX(e.data.netPos.x, 'noemit');
          // if(e.data.netPos.y) App.scene[e.data.netObjId].position.SetY(e.data.netPos.y, 'noemit');
          // if(e.data.netPos.z) App.scene[e.data.netObjId].position.SetZ(e.data.netPos.z, 'noemit');
        }
      } else if(e.data.netRot) {
        // console.log('ROT INFO UPDATE', e);
        // if(e.data.netRot.x) App.scene[e.data.netObjId].rotation.rotx = e.data.netRot.x;
        // if(e.data.netRot.y) App.scene[e.data.netObjId].rotation.roty = e.data.netRot.y;
        // if(e.data.netRot.z) App.scene[e.data.netObjId].rotation.rotz = e.data.netRot.z;
      } else if(e.data.netScale) {
        // console.log('netScale INFO UPDATE', e);
        // if(e.data.netScale.x) App.scene[e.data.netObjId].geometry.setScaleByX(e.data.netScale.x, 'noemit');
        // if(e.data.netScale.y) App.scene[e.data.netObjId].geometry.setScaleByY(e.data.netScale.y, 'noemit');
        // if(e.data.netScale.z) App.scene[e.data.netObjId].geometry.setScaleByZ(e.data.netScale.z, 'noemit');
        // if(e.data.netScale.scale) App.scene[e.data.netObjId].geometry.setScale(e.data.netScale.scale, 'noemit');
      }
    },
    /**
     * If someone leaves all client actions is here
     * - remove from scene
     * - clear object from netObject_x
     */
    leaveGamePlay(rtcEvent) {
      console.info("rtcEvent LEAVE GAME: ", rtcEvent.userid);
      dispatchEvent(new CustomEvent('net.remove-user', {detail: {data: rtcEvent}}))
    }
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

  addEventListener(`onTitle`, (e) => {
    document.title = e.detail;
  })
};
