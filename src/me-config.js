/**
 * @examples
 * MATRIX_ENGINE_WGPU CONFIG EXAMPLE WORKSPACE
 * APP can be controlled from url params in any domain/context.
 * 
 * Configure full render from url params - optimise render or any other stuff...
 * DONE:
 *  - shadowSize
 *  - fs
 *  - PHYSICS_GROUND_Y
 */
import {FullScreenManagerElement, isMobile, LOG_FUNNY_ARCADE, urlQuery} from "./engine/utils.js";
window.urlQ = urlQuery;

export const MEConfig = {
  fsManager: new FullScreenManagerElement(),
  SHADOW_RES: isMobile() == true ? 128.0 : 512.0,
  MAX_BONES: isMobile() == true ? 80 : 100,
  MAX_LIGHTS: isMobile() == true ? 20 : 40,

  PHYSICS_GROUND_Y: -4,

  construct: function() {
    if(urlQ['shadowSize']) {
      this.SHADOW_RES = parseInt(urlQ['shadowSize']);
      console.log(`%cShadowSize : ${this.SHADOW_RES}`, LOG_FUNNY_ARCADE);
    }
    if(urlQ['maxLights']) {
      this.MAX_LIGHTS = parseInt(urlQ['maxLights']);
      console.log(`%cmaxLights : ${this.MAX_LIGHTS}`, LOG_FUNNY_ARCADE);
    }
    if(urlQ['fs']) {
      this.FORCE_FULL_SCREEN = Boolean(urlQ['fs']);
      console.log(`%cForce fullScreen : ${this.FORCE_FULL_SCREEN}`, LOG_FUNNY_ARCADE);
      this.fsManager.request();
      this._fs = () => {
        this.fsManager.request();
        window.removeEventListener('click', this._fs);
      }
      window.addEventListener('click', this._fs);
    }
    if(urlQ['PHYSICS_GROUND_Y']) {
      this.PHYSICS_GROUND_Y = parseFloat(urlQ['PHYSICS_GROUND_Y']);
      console.log(`%cPHYSICS_GROUND_Y : ${this.PHYSICS_GROUND_Y}`, LOG_FUNNY_ARCADE);
    }
  },

  checkOffScreen: function() {
    if('OffscreenCanvas' in window) {
      console.log(`$cOffscreenCanvas is supported`, LOG_FUNNY_ARCADE);
    } else {
      console.log(`%cOffscreenCanvas is NOT supported.`, LOG_FUNNY_ARCADE);
    }
  }
}
