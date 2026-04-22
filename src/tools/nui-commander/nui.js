import {indicatorsBlocks} from "./scripts/controls/main-function-menu";
import {interActionController} from "./scripts/controller";
import {NuiMsgBox} from "./scripts/controls/nui-msg-box";
import {NuiCursor, NuiFaceDetect, NuiMenu, NuiRadialMenu, NuiSlider, NuiToggle} from "./scripts/controls/controls";
import {CanvasEngine} from "./scripts/CanvasEngine";

// [WIP]

export let nuiCommander = {};
window.nuiCommander = nuiCommander;

export function loadNuiCommander() {
  nuiCommander.drawer = new CanvasEngine(interActionController);
  nuiCommander.drawer.draw();
  nuiCommander.indicatorsBlocks = indicatorsBlocks;
  nuiCommander.drawer.elements.push(nuiCommander.indicatorsBlocks);

  // nuiCommander.drawer.elements.push(
  //   new NuiMsgBox( "Do you love this project?", function ( answer ) {
  //     console.log( answer );
  //     nuiCommander.drawer.removeElementByName( "NuiMsgBox" );

  //     if ( answer == "yes" ) {
  //       console.log( "Good answer is yes." );

  //       setTimeout( () => {
  //         nuiCommander.drawer.elements.push(
  //           new NuiMsgBox(
  //             "Do you wanna to activate voice commander?",
  //             function ( answer ) {
  //               nuiCommander.drawer.removeElementByName( "NuiMsgBox" );
  //               if ( answer == "yes" ) {
  //                 // root.vc.run()
  //                 alert( "ok" );
  //               }
  //             }
  //           )
  //         );
  //       }, 800 );
  //     } else {
  //       console.log( "Ok good buy." );
  //       window.location.href = "https://google.com";
  //     }
  //   } )
  // );


  const cursor = new NuiCursor({color: "255, 80, 80"});
  const slider = new NuiSlider("Volume", {
    row: 6, value: 50, onChange: v => {
      console.log('test')
      document.body.style.backgroundColor = `rgb(40,40, ${v})`;
    }
  });

  const menu1 = new NuiRadialMenu([
    {label: "Play", action: () => play()},
    {label: "Stop", action: () => stop()},
  ], {dwellMs: 800});

  const muteToggle = new NuiToggle("Mute", {
    col: 3,
    row: 1,
    cols: 2, rows: 2,
    dwellMs: 600,
    onColor: "80, 220, 160",   // green when ON
    offColor: "200, 60, 80",    // red when OFF
    initial: false,
    onChange: (isOn) => {
      console.log("SWITC")
    }
  });

  const faceDetect = new NuiFaceDetect(document.getElementById("webcam"), {
    intervalMs: 200,          // detect every 200ms
    color: "0, 220, 180",
    showConf: true,
    onFace: (faces) => {
      console.log(faces.length, "faces detected");
    }
  });

  // const vk = new NuiVirtualKeyboard({
  //   onKey: (k) => console.log("key:", k)
  // })


  // const menu = new NuiRadialMenu([
  //   {label: "Play", action: () => play()},
  //   {label: "Stop", action: () => stop()},
  // ], {dwellMs: 800});

  const menu = new NuiMenu([
    {label: "Play", action: () => startGame()},
    {label: "Settings", action: () => openSettings()},
    {label: "Exit", action: () => quit()},
  ], {
    col: 0,
    cols: 3,
    startRow: 2,
    dwellMs: 700,
    color: "80, 160, 255",
    accentColor: "255, 80, 120",
    onSelect: (item, i) => console.log("selected:", item.label)
  });

  nuiCommander.drawer.elements.push(cursor, muteToggle, menu);
  console.info("nui-commander controls attached.");

  nuiCommander.indicatorsBlocks.icons = [];
  // for(var x = 0;x < 64;x++) {
  //   var commanderIconField = new Image();
  //   commanderIconField.src = "images/note1.png";
  //   commanderIconField.onload = function() {
  //     nuiCommander.indicatorsBlocks.icons.push(this);
  //   };
  // }
}

// loadNuiCommander();