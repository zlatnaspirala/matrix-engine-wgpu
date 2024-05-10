import {degToRad} from "./utils";

/**
 * @description 
 * Sub classes for matrix-wgpu
 * Base class
 * Position { x, y, z }
 */

export class Position {
  constructor(x, y, z) {
    // console.log('TEST TYTPOF ', x)
    // Not in use for nwo this is from matrix-engine project [nameUniq]
    this.nameUniq = null;

    if(typeof x == 'undefined') x = 0;
    if(typeof y == 'undefined') y = 0;
    if(typeof z == 'undefined') z = 0;

    this.x = parseFloat(x);
    this.y = parseFloat(y);
    this.z = parseFloat(z);

    this.velY = 0;
    this.velX = 0;
    this.velZ = 0;
    this.inMove = false;
    this.targetX = parseFloat(x);
    this.targetY = parseFloat(y);
    this.targetZ = parseFloat(z);
    this.thrust = 0.01;

    return this;
  }

  setSpeed(n) {
    if(typeof n === 'number') {
      this.thrust = n;
    } else {
      console.log('Description: arguments (w, h) must be type of number.');
    }
  }

  translateByX(x) {
    this.inMove = true;
    this.targetX = parseFloat(x);
  };

  translateByY(y) {
    this.inMove = true;
    this.targetY = parseFloat(y);
  }

  translateByZ(z) {
    this.inMove = true;
    this.targetZ = parseFloat(z);
  }

  translateByXY(x, y) {
    this.inMove = true;
    this.targetX = parseFloat(x);
    this.targetY = parseFloat(y);
  }

  translateByXZ(x, z) {
    this.inMove = true;
    this.targetX = parseFloat(x);
    this.targetZ = parseFloat(z);
  }

  translateByYZ(y, z) {
    this.inMove = true;
    this.targetY = parseFloat(y);
    this.targetZ = parseFloat(z);
  }

  onTargetPositionReach() {}

  update() {
    var tx = this.targetX - this.x,
      ty = this.targetY - this.y,
      tz = this.targetZ - this.z,
      dist = Math.sqrt(tx * tx + ty * ty + tz * tz);
    this.velX = (tx / dist) * this.thrust;
    this.velY = (ty / dist) * this.thrust;
    this.velZ = (tz / dist) * this.thrust;
    if(this.inMove == true) {
      if(dist > this.thrust) {
        this.x += this.velX;
        this.y += this.velY;
        this.z += this.velZ;

        // // from me
        // if(net && net.connection && typeof em === 'undefined' && App.scene[this.nameUniq].net.enable == true) net.connection.send({
        //   netPos: {x: this.x, y: this.y, z: this.z},
        //   netObjId: this.nameUniq,
        // });

      } else {
        this.x = this.targetX;
        this.y = this.targetY;
        this.z = this.targetZ;
        this.inMove = false;
        this.onTargetPositionReach();

        // // from me
        // if(net && net.connection && typeof em === 'undefined' && App.scene[this.nameUniq].net.enable == true) net.connection.send({
        //   netPos: {x: this.x, y: this.y, z: this.z},
        //   netObjId: this.nameUniq,
        // });
      }
    }
  }

  get worldLocation() {
    return [parseFloat(this.x), parseFloat(this.y), parseFloat(this.z)];
  }

  SetX(newx, em) {
    this.x = newx;
    this.targetX = newx;
    this.inMove = false;

    // if(net && net.connection && typeof em === 'undefined' &&
    //   App.scene[this.nameUniq].net && App.scene[this.nameUniq].net.enable == true) {
    //   net.connection.send({
    //     netPos: {x: this.x, y: this.y, z: this.z},
    //     netObjId: this.nameUniq,
    //   });
    // }
  }

  SetY(newy, em) {
    this.y = newy;
    this.targetY = newy;
    this.inMove = false;
    // if(net && net.connection && typeof em === 'undefined' &&
    //   App.scene[this.nameUniq].net && App.scene[this.nameUniq].net.enable == true) net.connection.send({
    //     netPos: {x: this.x, y: this.y, z: this.z},
    //     netObjId: this.nameUniq,
    //   });
  }

  SetZ(newz, em) {
    this.z = newz;
    this.targetZ = newz;
    this.inMove = false;
    // if(net && net.connection && typeof em === 'undefined' &&
    //   App.scene[this.nameUniq].net && App.scene[this.nameUniq].net.enable == true) net.connection.send({
    //     netPos: {x: this.x, y: this.y, z: this.z},
    //     netObjId: this.nameUniq,
    //   });
  }

  setPosition(newx, newy, newz) {
    this.x = newx;
    this.y = newy;
    this.z = newz;
    this.targetX = newx;
    this.targetY = newy;
    this.targetZ = newz;
    this.inMove = false;

    // from me
    // if(App.scene[this.nameUniq] && net && net.connection && typeof em === 'undefined' &&
    //   App.scene[this.nameUniq].net && App.scene[this.nameUniq].net.enable == true) net.connection.send({
    //     netPos: {x: this.x, y: this.y, z: this.z},
    //     netObjId: this.nameUniq,
    //   });
  }
}

export class Rotation {

  constructor(x, y, z) {
    // Not in use for nwo this is from matrix-engine project [nameUniq]
    this.nameUniq = null;
    if(typeof x == 'undefined') x = 0;
    if(typeof y == 'undefined') y = 0;
    if(typeof z == 'undefined') z = 0;
    this.x = x;
    this.y = y;
    this.z = z;
    this.rotationSpeed = {x: 0, y: 0, z: 0};
    this.angle = 0;
    this.axis = {x: 0, y: 0, z: 0};
    // not in use good for exstend logic
    this.matrixRotation = null;
  }

  getRotX() {
    if(this.rotationSpeed.x == 0) {
      return degToRad(this.x);
    } else {
      this.x = this.x + this.rotationSpeed.x * 0.001;
      return degToRad(this.x);
    }
  }

  getRotY() {
    if(this.rotationSpeed.y == 0) {
      return degToRad(this.y);
    } else {
      this.y = this.y + this.rotationSpeed.y * 0.001;
      return degToRad(this.y);
    }
  }

  getRotZ() {
    if(this.rotationSpeed.z == 0) {
      return degToRad(this.z);
    } else {
      this.z = this.z + this.rotationSpeed.z * 0.001;
      return degToRad(this.z);
    }
  }

}
