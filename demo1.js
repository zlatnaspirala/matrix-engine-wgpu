/**
 * @examples
 * MATRIX_ENGINE_WGPU EXAMPLE WORKSPACE
 * 2026
 */


import {loadObjFile} from "./examples/load-obj-file.js";
import {byId, urlQuery} from "./src/engine/utils.js";

window.urlQ = urlQuery;

if('serviceWorker' in navigator) {
  if(location.hostname.indexOf('localhost') == -1) {
    navigator.serviceWorker.register('cache.js');
  }
}

const switchDemo = (id) => {
  const url = new URL(window.location.href);
  url.searchParams.set('demo', id);
  window.location.href = url.toString();
};

loadObjFile();


