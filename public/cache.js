'use strict';

/**
 * @description cacheVersion
 * This is not fiction. When you have your own already
 * production running and you need to update frontend
 * code. You will need only to change this number
 * increment 1 for example old 1 replace with `2` 
 * for `cacheVersion`.
 * 
 * From socound refresh new update will come in right pass(load from worker)
 * For DEV regime (when debugger is opened) use CTRL+F5
 * @param cacheVersion
 * 
 * Upgrade - multi endpoint cache.
 * But resouces must be shared if both on same domain.
 */

var cacheVersion = 184;
var prefix = 'matrix-engine-examples';
var cacheName = prefix + cacheVersion;

try {
  for(var j = 0;j < cacheVersion;j++) {
    var oldCacheName = prefix + j;
    caches.delete(oldCacheName);
  }
  for(var j = 200;j > cacheVersion;j--) {
    var oldCacheName = prefix + j;
    caches.delete(oldCacheName);
  }
} catch(e) {}

const ENGINE_PACK = [
  '/apps/webgpu/examples.html',
  '/apps/webgpu/examples.js',
  '/apps/webgpu/manifest.web',
  '/apps/webgpu/offline.html',
  '/apps/webgpu/res/fonts/stormfaze.ttf',
  '/apps/webgpu/res/icons/512.png',
  '/apps/webgpu/res/icons/512.webp',
  '/apps/webgpu/res/icons/default.png',
  '/apps/webgpu/res/meshes/blender/cube.obj',
  '/apps/webgpu/res/meshes/blender/sphepe-mob.obj',
  '/apps/webgpu/res/meshes/glb/zombi-cap.webp',
  '/apps/webgpu/res/meshes/glb/zombi-crawl1.glb',
  '/apps/webgpu/res/meshes/glb/zombie-cap.glb',
  '/apps/webgpu/res/meshes/obj/ammo.obj',
  '/apps/webgpu/res/meshes/obj/armor.obj',
  '/apps/webgpu/res/meshes/obj/armor.webp',
  '/apps/webgpu/res/meshes/obj/energy-cube.obj',
  '/apps/webgpu/res/meshes/obj/modelpack19/hang2/512/hang2.webp',
  '/apps/webgpu/res/meshes/obj/modelpack19/hang2/hang2.obj',
  '/apps/webgpu/res/multilang/en.json',
  '/apps/webgpu/res/textures/blankgray2.webp',
  '/apps/webgpu/res/textures/default.png',
  '/apps/webgpu/res/textures/metal/metal1.webp',
  '/apps/webgpu/res/textures/shooter/metal-block.webp',
  '/apps/webgpu/res/textures/shooter/s.webp'
];

const MOBA_PACK = [];
self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(MOBA_PACK);
    })
  );
});

self.addEventListener('fetch', function(event) {
  if(event.request.method === 'POST') {
    return;
  }
  event.respondWith(
    caches.open(cacheName).then(function(cache) {
      return cache.match(event.request).then(function(response) {
        return (
          response ||
          fetch(event.request).then(function(response) {
            if(response.status == 206) {
              // statusText: "Partial Content"
              return response;
            } else {
              cache.put(event.request, response.clone());
            }
            return response;
          })
        );
      });
    })
  );
});

const fireAddToHomeScreenImpression = (event) => {
  fireTracking('Add to homescreen shown');
  // will not work for chrome, untill fixed
  event.userChoice.then((choiceResult) => {
    fireTracking(`User clicked ${choiceResult}`);
  });
  // This is to prevent `beforeinstallprompt` event that triggers again on `Add` or `Cancel` click
  self.removeEventListener('beforeinstallprompt', fireAddToHomeScreenImpression);
};
self.addEventListener('beforeinstallprompt', fireAddToHomeScreenImpression);

//Track from where your web app has been opened/browsed
self.addEventListener('load', () => {
  let trackText;
  if(navigator && navigator.standalone) {
    trackText = 'Launched: Installed (iOS)';
  } else if(matchMedia('(display-mode: standalone)').matches) {
    trackText = 'Launched: Installed';
  } else {
    trackText = 'Launched: Browser Tab';
  }
  fireTracking(track);
});
