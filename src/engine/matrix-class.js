import {degToRad, radToDeg} from "./utils";

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
    this.nameUniq = null; // not in use
    this.netObject = null;

    this.netTolerance = 1;
    this.netTolerance__ = 0;

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
    var tx = parseFloat(this.targetX) - parseFloat(this.x),
      ty = parseFloat(this.targetY) - parseFloat(this.y),
      tz = parseFloat(this.targetZ) - parseFloat(this.z),
      dist = Math.sqrt(tx * tx + ty * ty + tz * tz);
    this.velX = (tx / dist) * this.thrust;
    this.velY = (ty / dist) * this.thrust;
    this.velZ = (tz / dist) * this.thrust;
    if(this.inMove == true) {
      if(dist > this.thrust) {
        this.x += this.velX;
        this.y += this.velY;
        this.z += this.velZ;
        if(this.netObject != null) {
          if(this.netTolerance__ > this.netTolerance) {
            app.net.send({
              sceneName: this.netObject,
              netPos: {x: this.x, y: this.y, z: this.z},
            })
            this.netTolerance__ = 0;
          } else {
            this.netTolerance__++;
          }
        }
      } else {
        this.x = this.targetX;
        this.y = this.targetY;
        this.z = this.targetZ;
        this.inMove = false;
        this.onTargetPositionReach();
        if(this.netObject != null) {
          if(this.netTolerance__ > this.netTolerance) {
            app.net.send({
              sceneName: this.netObject,
              netPos: {x: this.x, y: this.y, z: this.z},
            })
            this.netTolerance__ = 0;
          } else {
            this.netTolerance__++;
          }
        }
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
  }

  SetY(newy, em) {
    this.y = newy;
    this.targetY = newy;
    this.inMove = false;
  }

  SetZ(newz, em) {
    this.z = newz;
    this.targetZ = newz;
    this.inMove = false;
  }

  get X() {
    return parseFloat(this.x)
  }

  get Y() {
    return parseFloat(this.y)
  }

  get Z() {
    return parseFloat(this.z)
  }

  setPosition(newx, newy, newz) {
    this.x = newx;
    this.y = newy;
    this.z = newz;
    this.targetX = newx;
    this.targetY = newy;
    this.targetZ = newz;
    this.inMove = false;
  }
}

export class Rotation {
  constructor(x, y, z) {
    // Not in use for nwo this is from matrix-engine project [nameUniq]
    this.nameUniq = null;
    this.emitX = null;
    this.emitY = null;
    this.emitZ = null;
    if(typeof x == 'undefined') x = 0;
    if(typeof y == 'undefined') y = 0;
    if(typeof z == 'undefined') z = 0;
    this.x = x;
    this.y = y;
    this.z = z;
    this.netx = x;
    this.nety = y;
    this.netz = z;
    this.rotationSpeed = {x: 0, y: 0, z: 0};
    this.angle = 0;
    this.axis = {x: 0, y: 0, z: 0};
    // not in use good for exstend logic
    this.matrixRotation = null;
  }

  toDegree() {

    /*
    heading = atan2(y * sin(angle)- x * z * (1 - cos(angle)) , 1 - (y2 + z2 ) * (1 - cos(angle)))
    attitude = asin(x * y * (1 - cos(angle)) + z * sin(angle))
    bank = atan2(x * sin(angle)-y * z * (1 - cos(angle)) , 1 - (x2 + z2) * (1 - cos(angle)))
    */
    return [radToDeg(this.axis.x), radToDeg(this.axis.y), radToDeg(this.axis.z)];
  }

  toDegreeX() {
    return Math.cos(radToDeg(this.axis.x) / 2)
  }

  toDegreeY() {
    return Math.cos(radToDeg(this.axis.z) / 2)
  }

  toDegreeZ() {
    return Math.cos(radToDeg(this.axis.y) / 2)
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
      if(this.nety != this.y && this.emitY) {
        app.net.send({
          sceneName: this.emitY,
          netRotY: this.y
        })
      }
      this.nety = this.y;
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
