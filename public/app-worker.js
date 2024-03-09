(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

var canvas = document.createElement('canvas')
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.append(canvas)
 
// The web worker is created by passing a path to the worker's source file, which will then be
// executed on a separate thread.
const worker = new Worker('app.js');

// The primary way to communicate with the worker is to send and receive messages.
worker.addEventListener('message', (ev) => {
  // The format of the message can be whatever you'd like, but it's helpful to decide on a
  // consistent convention so that you can tell the message types apart as your apps grow in
  // complexity. Here we establish a convention that all messages to and from the worker will
  // have a `type` field that we can use to determine the content of the message.
  switch (ev.data.type) {
    default: {
      console.error(`Unknown Message Type: ${ev.data.type}`);
    }
  }
});

try {
  // In order for the worker to display anything on the page, an OffscreenCanvas must be used.
  // Here we can create one from our normal canvas by calling transferControlToOffscreen().
  // Anything drawn to the OffscreenCanvas that call returns will automatically be displayed on
  // the source canvas on the page.
  const offscreenCanvas = canvas.transferControlToOffscreen();
  const devicePixelRatio = window.devicePixelRatio;
  offscreenCanvas.width = canvas.clientWidth * devicePixelRatio;
  offscreenCanvas.height = canvas.clientHeight * devicePixelRatio;

  // Send a message to the worker telling it to initialize WebGPU with the OffscreenCanvas. The
  // array passed as the second argument here indicates that the OffscreenCanvas is to be
  // transferred to the worker, meaning this main thread will lose access to it and it will be
  // fully owned by the worker.
  worker.postMessage({ type: 'init', offscreenCanvas, devicePixelRatio: devicePixelRatio }, [offscreenCanvas]);
} catch (err) {
  // TODO: This catch is added here because React will call init twice with the same canvas, and
  // the second time will fail the transferControlToOffscreen() because it's already been
  // transferred. I'd love to know how to get around that.
  console.warn(err.message);
  worker.terminate();
}
},{}]},{},[1]);
