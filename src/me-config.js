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
 *  - MAX_SPOTLIGHTS
 *  - LOAD_AFTER_CLICK_MOBILE
 */
import {FullScreenManagerElement, isMobile, LOG_FUNNY_ARCADE, urlQuery} from "./engine/utils.js";
window.urlQ = urlQuery;

export const MEConfig = {

  fsManager: new FullScreenManagerElement(),
  SHADOW_RES: isMobile() == true ? 128.0 : 512.0,
  MAX_BONES: isMobile() == true ? 80 : 100,
  MAX_SPOTLIGHTS: isMobile() == true ? 18 : 40,
  PHYSICS_GROUND_Y: -1,
  PHYSICS_GROUND_BYX: 100,
  PHYSICS_GROUND_BYZ: 100,
  GRAVITY_Y_AXIS: -10,
  LOAD_AFTER_CLICK_MOBILE: false,
  FORCE_FULL_SCREEN: false,
  SINGLE_CAMERA: true,

  construct: function(options = {}) {
    if(urlQ['GRAVITY_Y_AXIS']) {
      this.GRAVITY_Y_AXIS = parseInt(urlQ['GRAVITY_Y_AXIS']);
      console.log(`%cGRAVITY_Y_AXIS : ${this.GRAVITY_Y_AXIS}`, LOG_FUNNY_ARCADE);
    }
    if(urlQ['PHYSICS_GROUND_BYX']) {
      this.PHYSICS_GROUND_BYX = parseInt(urlQ['PHYSICS_GROUND_BYX']);
      console.log(`%cPHYSICS_GROUND_BYX : ${this.PHYSICS_GROUND_BYX}`, LOG_FUNNY_ARCADE);
    }
    if(urlQ['PHYSICS_GROUND_BYZ']) {
      this.PHYSICS_GROUND_BYZ = parseInt(urlQ['PHYSICS_GROUND_BYZ']);
      console.log(`%cPHYSICS_GROUND_BYZ : ${this.PHYSICS_GROUND_BYZ}`, LOG_FUNNY_ARCADE);
    }
    if(urlQ['SHADOW_RES']) {
      this.SHADOW_RES = parseInt(urlQ['SHADOW_RES']);
      console.log(`%cSHADOW_RES : ${this.SHADOW_RES}`, LOG_FUNNY_ARCADE);
    }
    if(urlQ['MAX_SPOTLIGHTS']) {
      this.MAX_SPOTLIGHTS = parseInt(urlQ['MAX_SPOTLIGHTS']);
    }
    if(options.MAX_SPOTLIGHTS) {
      this.MAX_SPOTLIGHTS = options.MAX_SPOTLIGHTS;
    }
    console.log(`%cMAX_SPOTLIGHTS : ${this.MAX_SPOTLIGHTS}`, LOG_FUNNY_ARCADE);
    if(urlQ['MAX_BONES']) {
      this.MAX_BONES = parseInt(urlQ['MAX_BONES']);
    }
    if(options.MAX_BONES) {
      this.MAX_BONES = options.MAX_BONES;
    }
    console.log(`%cMAX_BONES : ${this.MAX_BONES}`, LOG_FUNNY_ARCADE);
    if(urlQ['LOAD_AFTER_CLICK_MOBILE']) {
      this.LOAD_AFTER_CLICK_MOBILE = urlQ['LOAD_AFTER_CLICK_MOBILE'];
    }
    if(urlQ['fs'] || isMobile()) {
      this.FORCE_FULL_SCREEN = Boolean(urlQ['fs']);
      console.log(`%cForce fullScreen : ${this.FORCE_FULL_SCREEN}`, LOG_FUNNY_ARCADE);
      this.fsManager.request();
      this._fs = () => {
        this.fsManager.request();
        setTimeout(() => {dispatchEvent(new CustomEvent('run_mobile_fs', {}))}, 300)
        window.removeEventListener('click', this._fs);
      }
      window.addEventListener('click', this._fs);
    }
    if(urlQ['PHYSICS_GROUND_Y'] != null) {
      this.PHYSICS_GROUND_Y = parseFloat(urlQ['PHYSICS_GROUND_Y']);
      console.log(`%cPHYSICS_GROUND_Y : ${this.PHYSICS_GROUND_Y}`, LOG_FUNNY_ARCADE);
    }
  },

  checkOffScreen: function() {
    if('OffscreenCanvas' in window) {
      console.log(`$cOffscreenCanvas is supported`, LOG_FUNNY_ARCADE);
      return true;
    } else {
      console.log(`%cOffscreenCanvas is NOT supported.`, LOG_FUNNY_ARCADE);
      return false;
    }
  }
}