import {OSCILLATOR} from "./utils";

/**
 * @description
 * Can be reuse for any other tasks.
 * @author Nikola Lukic
 */

export default class Behavior {

  status = "Only oscillator";

  constructor() {
    this.osc0 = new OSCILLATOR(0, 5, 0.01);
  }

  setOsc0(min,max, step){
    this.osc0.min =min;
    this.osc0.max =max;
    this.osc0.step =step;
  }

  // apend - keep init origin
  addPath(NUMBER) {
    let inc = this.osc0.UPDATE();
     console.log('test inc' ,inc)
    console.log('test inc + number' ,(NUMBER + inc))
    return (inc + NUMBER);
  }

  setPath0() {
    return this.osc0.UPDATE();
  }

}