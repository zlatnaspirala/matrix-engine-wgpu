import {MobileDOM} from "./src/engine/cameras";
import {byId} from "./src/engine/networking/matrix-stream";
import {MatrixStream} from "./src/engine/networking/net";

/**
 * @description
 * Who to port render stream to the android TV
 * This is androidTV part of application.
 */

// MobileDOM.addButton("refresh", () => {
//   location.reload()
// })

const BeastCast = new MatrixStream({
  active: true,
  domain: 'maximumroulette.com',
  port: 2020,
  sessionName: 'tv-beast',
  resolution: '1920x1080',
  isDataOnly: false
});

addEventListener('net-ready', () => {
  byId('caller-title').innerHTML = 'Welcome to matrix-engine-wgpu remote render app';
  byId('matrix-net').style.width = '100%';
  console.info('TEST TV READY');
  byId('matrix-net').style.opacity = '0.75';
  byId("sessionName").disabled = true;
  byId("buttonCloseSession").remove();
  // setTimeout(() => {
  //   BeastCast.fetchInfo('tv-beast');
  //   BeastCast.sendmsg = (m) => {
  //     if(typeof m != 'string') return;
  //     if(m.length > 120) return;
  //     let username = checkUsername();
  //     if(username != 'nosession') app.net.sendOnlyData({type: "chat", msg: m, username: username});
  //   };
  // }, 1500);
});

addEventListener('connectionDestroyed', (e) => {
  // e.detail.connectionId}
});

addEventListener("onConnectionCreated", (e) => {
  console.log('newconn : created ', e.detail);
  if(BeastCast.session.connection.connectionId == e.detail.connection.connectionId) {
    console.log('newconn : created [LOCAL] determinate team');
    document.title = BeastCast.session.connection.connectionId;
    if(BeastCast.session.connection != null) {
      BeastCast.sendOnlyData({type: "chat"});
    }
  }
  console.info('onConnectionCreated - Test number of players ');
})

addEventListener("streamPlaying", (e) => {
  console.log('streamPlaying >>>>> ', e.detail);
  setTimeout(() => {
    if(e.detail.target.id.indexOf('remote-video') !== -1) {
      let vr = e.detail.target.videos[0].video;
      vr.style.position = 'absolute';
      // vr.style.left = 0;
      // vr.style.top = 0;
      // vr.style.width = "100%";
      // vr.style.height = '100vh';
      vr.style.left = '10%';
      vr.style.top = '5vh';
      vr.style.width = "80%";
      vr.style.height = '90vh';
    } else {
      let vr = e.detail.target.videos[0].video;
      vr.style.position = 'absolute';
      vr.style.left = '5%';
      vr.style.bottom = '5%';
      // vr.style.width = "10%";
      vr.style.height = window.innerHeight * 0.2 + 'px';
    }
  }, 1000)
});

addEventListener("videoElementCreated", (e) => {
  console.log('videoElementCreated >>>>> ', e.detail);
});

addEventListener('only-data-receive', (e) => {
  let t = JSON.parse(e.detail.data);
  console.log(`data-receive`, t)
  if(t) {
    if(t.type == 'team-notify') {
      //
    } else if(t.type == 'chat') {
      // if(t.msg.length > 120) {
      //   t.msg = '';
      //   return;
      // }
      // mb.show(`Msg from ${t.username}: ${t.msg}`);
    }
  }
})