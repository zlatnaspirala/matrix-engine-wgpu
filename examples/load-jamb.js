import {loadJambApp} from "../main.js";

export var loadJamb = function() {
  console.log('Just loader for example page')
  window.app = loadJambApp();
}