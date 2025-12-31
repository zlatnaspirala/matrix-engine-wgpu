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
    this.remoteName = null;
    this.netObject = null;
    this.toRemote = [];
    this.teams = [];

    this.netTolerance = 3;
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
    if(parseFloat(x) == this.targetX) return;
    this.inMove = true;
    this.targetX = parseFloat(x);
  };

  translateByY(y) {
    if(parseFloat(y) == this.targetY) return;
    this.inMove = true;
    this.targetY = parseFloat(y);
  }

  translateByZ(z) {
    if(parseFloat(z) == this.targetZ) return;
    this.inMove = true;
    this.targetZ = parseFloat(z);
  }

  translateByXY(x, y) {
    if(parseFloat(y) == this.targetY && parseFloat(x) == this.targetX) return;
    this.inMove = true;
    this.targetX = parseFloat(x);
    this.targetY = parseFloat(y);
  }

  translateByXZ(x, z) {
    if(parseFloat(z) == this.targetZ && parseFloat(x) == this.targetX) return;
    this.inMove = true;
    this.targetX = parseFloat(x);
    this.targetZ = parseFloat(z);
  }

  translateByYZ(y, z) {
    if(parseFloat(y) == this.targetY && parseFloat(z) == this.targetZ) return;
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

            if(this.teams.length == 0) {
              app.net.send({
                toRemote: this.toRemote, // default null
                remoteName: this.remoteName, // default null
                sceneName: this.netObject,
                netPos: {x: this.x, y: this.y, z: this.z},
              });
            } else {
              // logic is only for two team - index 0 is local !!!
              if(this.teams.length > 0) if(this.teams[0].length > 0) app.net.send({
                toRemote: this.teams[0], // default null remote conns
                sceneName: this.netObject, // origin scene name to receive
                netPos: {x: this.x, y: this.y, z: this.z},
              });
              // remove if (this.teams[1].length > 0)  after alll this is only for CASE OF SUM PLAYER 3 FOR TEST ONLY
              if(this.teams.length > 0) if(this.teams[1].length > 0) app.net.send({
                toRemote: this.teams[1], // default null remote conns
                remoteName: this.remoteName, // to enemy players
                sceneName: this.netObject, // now not important
                netPos: {x: this.x, y: this.y, z: this.z},
              });
            }
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

            // 
            if(this.teams.length == 0) {
              app.net.send({
                toRemote: this.toRemote, // default null
                remoteName: this.remoteName, // default null
                sceneName: this.netObject,
                netPos: {x: this.x, y: this.y, z: this.z},
              });
            } else {
              // logic is only for two team - index 0 is local !
              if(this.teams[0].length > 0) app.net.send({
                toRemote: this.teams[0],
                sceneName: this.netObject,
                netPos: {x: this.x, y: this.y, z: this.z},
              });
              if(this.teams[1].length > 0) app.net.send({
                // team: this.teams[1],
                toRemote: this.teams[1], // default null remote conns
                remoteName: this.remoteName, // to enemy players
                sceneName: this.netObject, // now not important
                netPos: {x: this.x, y: this.y, z: this.z},
              });
            }

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
    this.toRemote = [];
    this.teams = [];
    this.remoteName = null;
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

  setRotate = (x, y, z) => {
    this.rotationSpeed = {x: x, y: y, z: z};
  }

  setRotateX = (x) => {
    this.rotationSpeed.x = x;
  }

  setRotateY = (y) => {
    this.rotationSpeed.y = y;
  }

  setRotateZ = (z) => {
    this.rotationSpeed.z = z;
  }

  setRotation = (x, y, z) => {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  setRotationX = (x) => {
    this.x = x;
  }

  setRotationY = (y) => {
    this.y = y;
  }

  setRotationZ = (z) => {
    this.z = z;
  }

  toDegree = () => {
    /*
    heading = atan2(y * sin(angle)- x * z * (1 - cos(angle)) , 1 - (y2 + z2 ) * (1 - cos(angle)))
    attitude = asin(x * y * (1 - cos(angle)) + z * sin(angle))
    bank = atan2(x * sin(angle)-y * z * (1 - cos(angle)) , 1 - (x2 + z2) * (1 - cos(angle)))
    */
    return [radToDeg(this.axis.x), radToDeg(this.axis.y), radToDeg(this.axis.z)];
  }

  toDegreeX = () => {
    return Math.cos(radToDeg(this.axis.x) / 2)
  }

  toDegreeY = () => {
    return Math.cos(radToDeg(this.axis.z) / 2)
  }

  toDegreeZ = () => {
    return Math.cos(radToDeg(this.axis.y) / 2)
  }

  getRotX = () => {
    if(this.rotationSpeed.x == 0) {
      if(this.netx != this.x && this.emitX) {
        app.net.send({
          remoteName: this.remoteName,
          sceneName: this.emitX,
          netRotX: this.x
        })
      }
      this.netx = this.x;
      return degToRad(this.x);
    } else {
      this.x = this.x + this.rotationSpeed.x * 0.001;
      return degToRad(this.x);
    }
  }

  getRotY = () => {
    if(this.rotationSpeed.y == 0) {
      if(this.nety != this.y && this.emitY) {
        // ---------------------------------------
        if(this.teams.length == 0) {
          app.net.send({
            toRemote: this.toRemote,
            remoteName: this.remoteName,
            sceneName: this.emitY,
            netRotY: this.y
          });
          this.nety = this.y;
        } else {
          if(this.teams[0].length > 0) app.net.send({
            toRemote: this.teams[0],
            sceneName: this.emitY,
            netRotY: this.y
          });
          if(this.teams[1].length > 0) app.net.send({
            toRemote: this.teams[1],
            remoteName: this.remoteName,
            sceneName: this.emitY,
            netRotY: this.y
          });
          this.nety = this.y;
        }
      }
      return degToRad(this.y);
    } else {
      this.y = this.y + this.rotationSpeed.y * 0.001;
      return degToRad(this.y);
    }
  }

  getRotZ = () => {
    if(this.rotationSpeed.z == 0) {
      if(this.netz != this.z && this.emitZ) {
        app.net.send({
          remoteName: this.remoteName,
          sceneName: this.emitZ,
          netRotZ: this.z
        })
      }
      this.netz = this.z;
      return degToRad(this.z);
    } else {
      this.z = this.z + this.rotationSpeed.z * 0.001;
      return degToRad(this.z);
    }
  }

}
