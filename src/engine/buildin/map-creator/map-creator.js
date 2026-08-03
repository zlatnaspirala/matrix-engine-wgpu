import {mapParams} from "../../../../examples/games/first-person-shooter/table-params";
import {FlameEffect, FlamePresets} from "../../effects/flame";
import {FlameEmitter} from "../../effects/flame-emmiter";
import {geometryTypes, isMobile, MeshType, randomIntFromTo} from "../../utils";

/**
 * MapCreator — Map generator for matrix-engine-wgpu (the beast)
 * @description
 * Claude assist. Adapted for MEGPU engine.
 * 
 * Architecture primitives:
 *   createRoom(opts)         — box room with optional ceiling, N door openings
 *   createTunnel(opts)       — corridor between two points
 *   createStairs(opts)       — stair run connecting two Y levels
 *   createFightArena(opts)   — open combat area with pillars + cover blocks
 *   createMazeLayer(opts)    — DFS maze on a horizontal plane at given Y
 *   createMultiLevelMaze(opts) — stacked maze layers connected by stairs
 *
 * All geometry registers walls/floors into CollisionSystem automatically.
 * Shared cube mesh is passed once; everything reuses it (draw-call friendly).
 *
 * Usage:
 *   const mc = new MapCreator(mazeInstance, cubeMesh, collisionSystem);
 *   mc.createRoom({ origin: {x:0,y:0,z:0}, width:10, depth:10, height:4, doors:['+x','-z'] });
 *   mc.createTunnel({ from:{x:10,y:0,z:0}, to:{x:20,y:0,z:0}, width:2, height:3 });
 *   mc.createMultiLevelMaze({ origin:{x:0,y:0,z:0}, levels:3, mazeSize:15, spacing:2 });
 */
export class MapCreator {
  /**
   * @param {object} engine   — MatrixEngineWGPU instance
   * @param {object} mesh     — pre-loaded cube OBJ mesh (m.cube)
   * @param {object} collision — CollisionSystem instance
   * @param {object} [opts]
   * @param {string} [opts.wallTexture]   — path to wall texture
   * @param {string} [opts.floorTexture]  — path to floor texture
   * @param {string} [opts.ceilTexture]   — path to ceiling texture
   */
  constructor(engine, m, collision, opts = {}) {
    this.engine = engine;
    this.meshes = m;
    this.collision = collision;
    this._wallTex = opts.wallTexture || './res/textures/blankgray2.webp';
    this._floorTex = opts.floorTexture || './res/textures/blankgray2.webp';
    this._ceilTex = opts.ceilTexture || './res/textures/blankgray2.webp';
    this._pillarDecorationTex = './res/meshes/obj/modelpack19/hang2/512/hang2.webp';
    this._pDecorationEnabled = opts.pillarDecoration || false;
    this.pillarsFlame = opts.pillarsFlame || false;
    this.shadowsCast = opts.shadowsCast || true;
    this._uid = 0;

    this.addMapItems();
  }

  _id(prefix) {return `${prefix}_${this._uid++}`;}

  _floor(name, pos, width, depth, uvShema = false) {
    return this._block(name, pos, [width, 0.2, depth], this._floorTex, 'standard', true, 0.1, 'floor', uvShema);
  }

  _ceil(name, pos, width, depth) {
    return this._block(name, pos, [width, 0.2, depth], this._ceilTex, 'standard', false, 0, 'floor');
  }

  _block(name, pos, scale, tex, mat = 'standard', registerCollision = true, collisionRadius = 1.0, group = 'walls', uvShema = false, effects = false) {
    const meshScale = 2; // nativly from core blender cube is 2 unit bound.
    const obj = this.engine.addMeshObj({
      shadowsCast: this.shadowsCast,
      material: {type: mat, shared: true},
      position: pos,
      scale: [scale[0] / meshScale, scale[1] / meshScale, scale[2] / meshScale],
      texturesPaths: [tex],
      name,
      mesh: this.meshes.cube,
      physics: {enabled: false, mass: 0, geometry: 'Cube'},
      raycast: {enabled: true, radius: 1},
      pointerEffect: {
        enabled: effects
      }
    });
    if(uvShema !== false) {obj.setUVScale(uvShema[0], uvShema[1])}
    if(effects === true) {
      setTimeout(() => {
        if(!obj.effects) obj.effects = {};
        obj.effects.flameEmitter = new FlameEmitter(app.device, "rgba16float", 20, app.cameraBuffer);
        obj.effects.flameEmitter.recreateVertexDataFromData([
          -2.5825, 0.2112, 0.4249,
          0.4724, 2.38, 3.01, -2.379, -3.46]);
      }, 250)
    }

    if(registerCollision) {
      // always derive half-extents from actual scale — never from collisionRadius
      this.collision.registerStatic(name, pos, collisionRadius, group, {
        x: scale[0] / 2,
        y: scale[1] / 2,
        z: scale[2] / 2
      });
    }
    return obj;
  }

  _pillarDecoration(name, pos, scale, tex, mat = 'standard', registerCollision = true, collisionRadius = 1.0, group = 'walls', uvShema = false, effects = false) {
    const meshScale = 2;
    const obj = this.engine.addMeshObj({
      shadowsCast: this.shadowsCast,
      material: {type: mat, shared: true},
      position: pos,
      scale: [scale[0] / meshScale, scale[1] / meshScale, scale[2] / meshScale],
      texturesPaths: [this._pillarDecorationTex],
      name,
      mesh: this.meshes.hang2,
      physics: {enabled: false, mass: 0, geometry: 'Cube'},
      raycast: {enabled: false, radius: 1},
      pointerEffect: {
        enabled: effects
      }
    });
    if(uvShema !== false) {obj.setUVScale(uvShema[0], uvShema[1])}
    if(effects === true) {
      setTimeout(() => {
        if(!obj.effects) obj.effects = {};
        obj.effects.flameEmitter = new FlameEmitter(app.device, "rgba16float", 20, app.cameraBuffer);
        // obj.effects.flameEmitter.recreateVertexDataFromData([
        //   -2.5825, 0.2112, 0.4249,
        //   0.4724, 2.38, 3.01, -2.379, -3.46]);
        obj.effects.flameEmitter.recreateVertexDataCrazzy(1);
        obj.effects.flameEmitter.rotSpeed = 0.1;
        obj.effects.flameEmitter.setIntensity(randomIntFromTo(5, 10));
        obj.effects.flameEmitter.instanceTargets.forEach((e) => {
          e.currentScale = [0.5, 4, 0.5]
        })
        // obj.setAmbient(4, 1, 0.5);
        obj.effects.flameEmitter.instanceTargets.forEach((p, i, array) => {
          array[i].color = [randomIntFromTo(7, 20), randomIntFromTo(0, 2), randomIntFromTo(0, 2), 1];
        })
      }, 250)
    }

    // if(registerCollision) {
    //   // always derive half-extents from actual scale — never from collisionRadius
    //   this.collision.registerStatic(name, pos, collisionRadius, group, {
    //     x: scale[0] / 2,
    //     y: scale[1] / 2,
    //     z: scale[2] / 2
    //   });
    // }
    return obj;
  }

  /**
   * Create a box room.
   *
   * @param {object} opts
   * @param {{x,y,z}} opts.origin   — bottom-center of the room
   * @param {number}  opts.width    — X extent
   * @param {number}  opts.depth    — Z extent
   * @param {number}  opts.height   — wall height
   * @param {number}  [opts.wallThickness=0.4]
   * @param {boolean} [opts.roof=true]
   * @param {boolean} [opts.floor=true]
   * @param {string[]} [opts.doors=[]]  — sides with door openings: '+x'|'-x'|'+z'|'-z'
   * @param {number}  [opts.doorWidth=2]
   * @param {string}  [opts.tag='room']
   * @returns {{ walls: object[], floor: object|null, ceil: object|null }}
   */
  createRoom(opts) {
    const {
      origin, width, depth, height,
      wallThickness = 0.4,
      roof = true,
      floor = true,
      doors = [],
      doorWidth = 2,
      tag = 'room'
    } = opts;

    let {uvShema = false} = opts;

    const {x, y, z} = origin;
    const hw = width / 2;
    const hd = depth / 2;
    const wy = y + height / 2;
    const t = wallThickness;

    const results = {walls: [], doors: [], floor: null, ceil: null};
    const hasDoor = (side) => doors.includes(side);
    const xWallDepth = depth - t * 2;   // trimmed
    const zWallWidth = width - t * 2;   // trimmed
    // 4 corner blocks — each is t × height × t
    const corners = [
      {x: x + hw - t / 2, z: z + hd - t / 2},
      {x: x + hw - t / 2, z: z - hd + t / 2},
      {x: x - hw + t / 2, z: z + hd - t / 2},
      {x: x - hw + t / 2, z: z - hd + t / 2},
    ];
    for(const c of corners) {
      results.walls.push(this._block(
        this._id(`${tag}_corner`),
        {x: c.x, y: wy, z: c.z},
        [t, height, t],
        this._wallTex, 'standard', true, t
      ));
    }
    // +X wall — trimmed
    {
      const wx = x + hw - t / 2;
      if(hasDoor('+x')) {
        this._dooredWall(tag, wx, wy, z, 'x', xWallDepth, height, doorWidth, t, results.walls);
      } else {
        results.walls.push(this._block(this._id(`${tag}_wall+x`), {x: wx, y: wy, z}, [t, height, xWallDepth], this._wallTex, 'standard', true, t));
      }
    }

    // -X wall — trimmed
    {
      const wx = x - hw + t / 2;
      if(hasDoor('-x')) {
        this._dooredWall(tag, wx, wy, z, 'x', xWallDepth, height, doorWidth, t, results.walls);
      } else {
        results.walls.push(this._block(this._id(`${tag}_wall-x`), {x: wx, y: wy, z}, [t, height, xWallDepth], this._wallTex, 'standard', true, t));
      }
    }

    // +Z wall — trimmed
    {
      const wz = z + hd - t / 2;
      if(hasDoor('+z')) {
        this._dooredWall(tag, x, wy, wz, 'z', zWallWidth, height, doorWidth, t, results.walls);
      } else {
        results.walls.push(this._block(this._id(`${tag}_wall+z`), {x, y: wy, z: wz}, [zWallWidth, height, t], this._wallTex, 'standard', true, t));
      }
    }

    // -Z wall — trimmed
    {
      const wz = z - hd + t / 2;
      if(hasDoor('-z')) {
        this._dooredWall(tag, x, wy, wz, 'z', zWallWidth, height, doorWidth, t, results.walls);
      } else {
        results.walls.push(this._block(this._id(`${tag}_wall-z`), {x, y: wy, z: wz}, [zWallWidth, height, t], this._wallTex, 'standard', true, t));
      }
    }
    if(floor) {
      results.floor = this._floor(this._id(`${tag}_floor`), {x, y, z}, width, depth, uvShema);
    }
    if(roof) {
      results.ceil = this._ceil(this._id(`${tag}_ceil`), {x, y: y + height, z}, width, depth, uvShema = false);
    }

    return results;
  }

  /**
   * Internal: build a wall face with a centred door opening.
   *
   * Produces:
   *   - left wall segment   (static collision)
   *   - right wall segment  (static collision)
   *   - lintel above gap    (static collision)
   *   - door panel          (static collision, named `<tag>_door_<uid>`)
   *                          Translate/remove it from code to open/close.
   *
   * @returns {{ door: object, lintel: object }}  named refs for runtime control
   */
  _dooredWall(tag, cx, cy, cz, axis, wallLen, wallH, doorW, wallT, outArr) {
    const doorH = Math.min(wallH * 0.75, wallH - 0.4);
    const lintelH = wallH - doorH;
    const halfLen = wallLen / 2;
    const leftLen = halfLen - doorW / 2;
    const rightLen = halfLen - doorW / 2;

    const makePos = (along, perp) => axis === 'x'
      ? {x: cx, y: perp, z: along}
      : {x: along, y: perp, z: cz};

    const makeScale = (len, h) => axis === 'x'
      ? [wallT, h, len]
      : [len, h, wallT];

    const doorMidH = cy - wallH / 2 + doorH / 2;
    const lintelY = cy + wallH / 2 - lintelH / 2;
    const leftCenter = (axis === 'x' ? cz : cx) - halfLen + leftLen / 2;
    const rightCenter = (axis === 'x' ? cz : cx) + halfLen - rightLen / 2;
    const doorCenter = axis === 'x' ? cz : cx;

    // left segment
    if(leftLen > 0.01) {
      outArr.push(this._block(
        this._id(`${tag}_wl`), makePos(leftCenter, doorMidH),
        makeScale(leftLen, doorH), this._wallTex, 'standard', true, wallT
      ));
    }
    // right segment
    if(rightLen > 0.01) {
      outArr.push(this._block(
        this._id(`${tag}_wr`), makePos(rightCenter, doorMidH),
        makeScale(rightLen, doorH), this._wallTex, 'standard', true, wallT
      ));
    }
    // lintel above gap
    outArr.push(this._block(
      this._id(`${tag}_lintel`), makePos(doorCenter, lintelY),
      makeScale(wallLen, lintelH), this._wallTex, 'standard', false, wallT
    ));
    // ← NO door panel, NO registration, just empty space in the gap
    return {};
  }

  /**
   * Create a straight tunnel between two points (axis-aligned only).
   * For diagonal tunnels, chain two calls with a corner room.
   *
   * @param {object} opts
   * @param {{x,y,z}} opts.from
   * @param {{x,y,z}} opts.to
   * @param {number}  opts.width   — tunnel inner width (the non-travel axis)
   * @param {number}  opts.height  — tunnel inner height
   * @param {boolean} [opts.roof=true]
   * @param {string}  [opts.tag='tunnel']
   * @returns {{ walls: object[] }}
   */
  createTunnel(opts) {
    const {from, to, width, height, roof = true, tag = 'tunnel'} = opts;

    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const dy = to.y - from.y;   // non-zero means sloped tunnel

    // Dominant travel axis
    const alongX = Math.abs(dx) >= Math.abs(dz);
    const len = alongX ? Math.abs(dx) : Math.abs(dz);

    const cx = (from.x + to.x) / 2;
    const cy = (from.y + to.y) / 2;
    const cz = (from.z + to.z) / 2;
    const mh = height / 2;
    const hw = width / 2;
    const results = {walls: []};

    if(alongX) {
      // Travel = X axis → side walls along Z, end caps at X
      const wallY = cy + mh;
      results.walls.push(this._block(this._id(`${tag}_s1`), {x: cx, y: wallY, z: cz - hw}, [len, height, 0.3], this._wallTex));
      results.walls.push(this._block(this._id(`${tag}_s2`), {x: cx, y: wallY, z: cz + hw}, [len, height, 0.3], this._wallTex));
      if(roof) {
        results.walls.push(this._ceil(
          this._id(`${tag}_roof`),
          {x: cx, y: from.y + height, z: cz},  // ← from.y + height, not cy + height
          len, width
        ));
      }
      results.walls.push(this._floor(this._id(`${tag}_floor`), {x: cx, y: cy, z: cz}, len, width));
    } else {
      // Travel = Z axis → side walls along X
      const wallY = cy + mh;
      results.walls.push(this._block(this._id(`${tag}_s1`), {x: cx - hw, y: wallY, z: cz}, [0.3, height, len], this._wallTex));
      results.walls.push(this._block(this._id(`${tag}_s2`), {x: cx + hw, y: wallY, z: cz}, [0.3, height, len], this._wallTex));
      if(roof) {
        results.walls.push(this._ceil(
          this._id(`${tag}_roof`),
          {x: cx, y: from.y + height, z: cz},  // ← from.y + height, not cy + height
          len, width
        ));
      }
      results.walls.push(this._floor(this._id(`${tag}_floor`), {x: cx, y: cy, z: cz}, width, len));
    }

    return results;
  }

  /**
   * Create a stair run connecting two Y levels.
   * Stairs travel along X or Z. Each step is one cube-block.
   *
   * @param {object} opts
   * @param {{x,y,z}} opts.origin    — bottom-start corner
   * @param {'x'|'z'} [opts.axis='x'] — travel direction
   * @param {number}  opts.steps     — number of steps
   * @param {number}  [opts.stepW=1.5] — step width (perpendicular)
   * @param {number}  [opts.stepH=0.4] — riser height
   * @param {number}  [opts.stepD=0.8] — tread depth
   * @param {boolean} [opts.walls=true] — side walls
   * @param {boolean} [opts.roof=false]
   * @param {string}  [opts.tag='stair']
   * @returns {{ steps: object[], walls: object[] }}
   */
  createStairs(opts) {
    const {
      origin, steps, axis = 'x',
      stepW = 1.5, stepH = 0.4, stepD = 0.8,
      walls = true, roof = false, tag = 'stair'
    } = opts;
    let {uvShema = false} = opts;

    const results = {steps: [], walls: []};
    let {x, y, z} = origin;

    for(let i = 0;i < steps;i++) {
      const stepY = y + i * stepH + stepH / 2;
      const stepCx = axis === 'x' ? x + i * stepD + stepD / 2 : x;
      const stepCz = axis === 'z' ? z + i * stepD + stepD / 2 : z;
      const scaleX = axis === 'x' ? stepD : stepW;
      const scaleZ = axis === 'z' ? stepD : stepW;

      const s = this._block(
        this._id(`${tag}_step`),
        {x: stepCx, y: stepY, z: stepCz},
        [scaleX, stepH, scaleZ],
        this._wallTex, 'standard', true, 0.5, undefined, uvShema
      );
      results.steps.push(s);
    }
    // Side walls flanking the stairwell
    if(walls) {
      const totalLen = steps * stepD;
      const totalH = steps * stepH;
      const wallY = y + totalH / 2;
      const midAlong = (axis === 'x' ? x : z) + totalLen / 2;
      const hw = stepW / 2;
      if(axis === 'x') {
        results.walls.push(this._block(
          this._id(`${tag}_sw1`), {x: midAlong, y: wallY, z: z - hw - 0.2}, [totalLen, totalH + stepH, 0.3], this._wallTex, undefined, undefined, undefined, undefined, uvShema));
        results.walls.push(this._block(this._id(`${tag}_sw2`), {x: midAlong, y: wallY, z: z + hw + 0.2}, [totalLen, totalH + stepH, 0.3], this._wallTex, undefined, undefined, undefined, undefined, uvShema));
      } else {
        results.walls.push(this._block(this._id(`${tag}_sw1`), {x: x - hw - 0.2, y: wallY, z: midAlong}, [0.3, totalH + stepH, totalLen], this._wallTex, undefined, undefined, undefined, undefined, uvShema));
        results.walls.push(this._block(this._id(`${tag}_sw2`), {x: x + hw + 0.2, y: wallY, z: midAlong}, [0.3, totalH + stepH, totalLen], this._wallTex, undefined, undefined, undefined, undefined, uvShema));
      }
    }
    return results;
  }

  /**
   * random pillar cover, and optional crates/blocks.
   *
   * @param {object} opts
   * @param {{x,y,z}} opts.origin
   * @param {number}  opts.width
   * @param {number}  opts.depth
   * @param {number}  [opts.wallHeight=2]
   * @param {number}  [opts.pillars=6]     — number of interior pillars
   * @param {number}  [opts.pillarH=3]     — pillar height
   * @param {number}  [opts.covers=4]      — low cover blocks
   * @param {boolean} [opts.roof=false]
   * @param {string[]} [opts.doors=['+x','-x','+z','-z']]
   * @param {string}  [opts.tag='arena']
   */
  createFightArena(opts) {
    const {
      origin, width, depth,
      wallHeight = 2,
      pillars = 6, pillarH = 3, pillarMargin = 4,
      covers = 4,
      roof = false,
      doors = ['+x', '-z'],
      tag = 'arena'
    } = opts;
    let {uvShema = false} = opts;

    const roomResult = this.createRoom({
      origin, width, depth,
      height: wallHeight,
      roof,
      doors,
      doorWidth: 3.5,
      uvShema: uvShema,
      tag
    });

    const {x, y, z} = origin;
    const results = {...roomResult, pillars: [], covers: []};

    const pillarsPerSide = Math.round(Math.sqrt(pillars)); // e.g. 16 → 4x4, 9 → 3x3
    const marginX = (width - 2 * pillarMargin) / (pillarsPerSide - 1);
    const marginZ = (depth - 2 * pillarMargin) / (pillarsPerSide - 1);

    let _MAX = isMobile() === true ? 1 : 5;
    for(let row = 0;row < pillarsPerSide;row++) {
      for(let col = 0;col < pillarsPerSide;col++) {
        const px = x - width / 2 + pillarMargin + col * marginX;
        const pz = z - depth / 2 + pillarMargin + row * marginZ;
        results.pillars.push(this._block(
          this._id(`${tag}_pillar`),
          {x: px, y: y + pillarH / 2, z: pz},
          [0.6, pillarH, 0.6],
          this._wallTex, 'standard', true, undefined, undefined, undefined, this.pillarsFlame
        ));
        if(this._pDecorationEnabled === true && randomIntFromTo(0, 10) < _MAX) results.pillars.push(this._pillarDecoration(
          this._id(`${tag}_pillarDec`),
          {x: px, y: y + 2.6, z: pz + 0.4},
          [0.6, 0.6, 0.6],
          this._wallTex, 'standard', true, undefined, undefined, undefined, true
        ));
      }
    }

    // covers only
    for(let i = 0;i < covers;i++) {
      const t = ((i * 0.31 + 0.15) % 1);
      const t2 = ((i * 0.67 + 0.40) % 1);
      const cx = x + (t - 0.5) * (width - 4);
      const cz = z + (t2 - 0.5) * (depth - 4);
      results.covers.push(this._block(
        this._id(`${tag}_cover`),
        {x: cx, y: y + 0.6, z: cz},
        [1.5, 1.2, 1.5],
        this._floorTex, 'standard', true
      ));
    }
    return results;
  }
  /**
   * Create a 2-D maze on a horizontal plane at a given Y level.
   * Uses recursive DFS — same algorithm as the original example.
   *
   * @param {object} opts
   * @param {{x,y,z}} opts.origin    — bottom-left world position
   * @param {number}  opts.mazeSize  — grid cells (forced odd)
   * @param {number}  [opts.spacing=2]
   * @param {number}  [opts.wallHeight=3]
   * @param {boolean} [opts.roof=false]
   * @param {string}  [opts.tag='maze']
   * @returns {{ walls: object[], entrance: {x,z}, exit: {x,z} }}
   */
  createMazeLayer(opts) {
    let {
      origin, mazeSize,
      spacing = 2,
      wallHeight = 3,
      roof = false,
      tag = 'maze'
    } = opts;
    if(mazeSize % 2 === 0) mazeSize += 1;
    const {x: ox, y: oy, z: oz} = origin;
    const grid = Array(mazeSize).fill(null).map(() => Array(mazeSize).fill(0));
    // DFS carve
    const walk = (x, y) => {
      grid[y][x] = 1;
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]].sort(() => Math.random() - 0.5);
      for(const [dx, dy] of dirs) {
        const nx = x + dx * 2, ny = y + dy * 2;
        if(nx >= 0 && nx < mazeSize && ny >= 0 && ny < mazeSize && grid[ny][nx] === 0) {
          grid[y + dy][x + dx] = 1;
          walk(nx, ny);
        }
      }
    };
    walk(1, 1);
    // Seal perimeter
    for(let i = 0;i < mazeSize;i++) {
      grid[0][i] = grid[mazeSize - 1][i] = grid[i][0] = grid[i][mazeSize - 1] = 0;
    }
    // Entrance / exit
    grid[1][0] = 1;
    grid[mazeSize - 2][mazeSize - 1] = 1;

    const results = {walls: []};
    const wallY = oy + wallHeight / 2;

    for(let gy = 0;gy < mazeSize;gy++) {
      for(let gx = 0;gx < mazeSize;gx++) {
        if(grid[gy][gx] === 0) {
          const wx = ox + gx * spacing;
          const wz = oz + gy * spacing;
          const w = this._block(
            this._id(`${tag}_w`),
            {x: wx, y: wallY, z: wz},
            [1, wallHeight, 1],
            this._wallTex, 'standard', true, 1.1
          );
          results.walls.push(w);
        }
      }
    }

    // Floor slab
    const totalW = mazeSize * spacing;
    this._floor(
      this._id(`${tag}_floor`),
      {x: ox + totalW / 2 - spacing / 2, y: oy, z: oz + totalW / 2 - spacing / 2},
      totalW, totalW
    );

    // Optional roof
    if(roof) {
      this._ceil(
        this._id(`${tag}_ceil`),
        {x: ox + totalW / 2 - spacing / 2, y: oy + wallHeight, z: oz + totalW / 2 - spacing / 2},
        totalW, totalW
      );
    }

    results.entrance = {
      x: ox,
      z: oz + 1 * spacing
    };
    results.exit = {
      x: ox + (mazeSize - 1) * spacing,
      z: oz + (mazeSize - 2) * spacing
    };

    return results;
  }

  /**
   * Create multiple stacked maze levels connected by stair runs.
   * Each level is a full DFS maze. Stairs are placed at the exit
   * of each layer connecting it to the entrance of the next.
   *
   * @param {object} opts
   * @param {{x,y,z}} opts.origin
   * @param {number}  opts.levels         — number of floors
   * @param {number}  opts.mazeSize       — grid cells per layer
   * @param {number}  [opts.spacing=2]    — cell world-space spacing
   * @param {number}  [opts.wallHeight=3] — height of each layer's walls
   * @param {number}  [opts.levelGap=1]   — extra gap between floor ceiling and next floor
   * @param {number}  [opts.stairSteps=6] — steps per stairwell
   * @param {boolean} [opts.roofLevels=false] — put a ceiling on each level except top
   * @returns {{ layers: object[], stairs: object[] }}
   */
  createMultiLevelMaze(opts) {
    const {
      origin,
      levels = 3,
      mazeSize = 15,
      spacing = 1,
      wallHeight = 3,
      levelGap = 1,
      stairSteps = 6,
      roofLevels = false
    } = opts;

    const results = {layers: [], stairs: []};
    const stepH = 0.4;
    const layerH = wallHeight + levelGap;

    for(let lvl = 0;lvl < levels;lvl++) {
      const y = origin.y + lvl * layerH;

      const layer = this.createMazeLayer({
        origin: {x: origin.x, y, z: origin.z},
        mazeSize,
        spacing,
        wallHeight,
        roof: roofLevels && lvl < levels - 1,
        tag: `lvl${lvl}_maze`
      });
      results.layers.push(layer);

      // Connect this level to the next via stairs at exit point
      if(lvl < levels - 1) {
        const stairOrigin = {
          x: layer.exit.x + spacing - 1,
          y,
          z: layer.exit.z
        };
        const stair = this.createStairs({
          origin: stairOrigin,
          axis: 'x',
          steps: stairSteps,
          stepW: 2.5,
          stepH,
          stepD: 0.8,
          walls: true,
          roof: false,
          uvShema: [6, 3],
          tag: `stair_lvl${lvl}`
        });
        results.stairs.push(stair);
      }
    }
    return results;
  }

  /**
   * Layout:
   *   entrance tunnel → fight arena → maze layer → (optional) multi-level maze
   *
   * @param {object} opts
   * @param {{x,y,z}} [opts.origin={x:0,y:0,z:0}]
   * @param {boolean} [opts.multiLevel=true]
   * @param {number}  [opts.mazeLevels=2]
   * @param {number}  [opts.mazeSize=19]
   * @returns {object}  all created geometry groups
   */
  createFPSMapCompound(opts = {}) {
    const {
      origin = {x: 0, y: 0, z: 0},
      multiLevel = true,
      mazeLevels = 2,
      mazeSize = 19
    } = opts;

    const all = {};

    // 1. Entrance tunnel (player spawns in front of it)
    all.entranceTunnel = this.createTunnel({
      from: {x: origin.x - 10, y: origin.y, z: origin.z},
      to: {x: origin.x, y: origin.y, z: origin.z},
      width: 2.5, height: 3.5, tag: 'entry_tunnel'
    });

    // 2. Fight arena after tunnel
    all.arena = this.createFightArena({
      origin: {x: origin.x + 15, y: origin.y, z: origin.z},
      width: 20, depth: 20,
      wallHeight: 2.5,
      pillars: 8, pillarH: 4,
      covers: 5,
      doors: ['-x', '+z'],
      tag: 'main_arena'
    });

    // Short linking tunnel: arena → maze
    all.linkTunnel = this.createTunnel({
      from: {x: origin.x + 25, y: origin.y, z: origin.z + 10},
      to: {x: origin.x + 25, y: origin.y, z: origin.z + 20},
      width: 2, height: 3, tag: 'link_tunnel'
    });

    // 3. Maze section
    if(multiLevel) {
      all.mazeSection = this.createMultiLevelMaze({
        origin: {x: origin.x + 10, y: origin.y, z: origin.z + 22},
        levels: mazeLevels,
        mazeSize,
        spacing: 2,
        wallHeight: 3,
        levelGap: 1,
        stairSteps: 8,
        roofLevels: true
      });
    } else {
      all.mazeSection = this.createMazeLayer({
        origin: {x: origin.x + 10, y: origin.y, z: origin.z + 22},
        mazeSize,
        spacing: 2,
        wallHeight: 3
      });
    }

    return all;
  }

  addMapItems() {
    mapParams.collectItems.forEach((item) => {
      if(item.type === 'energy') {
        const meshScale = 2;
        const nName = item.type + item.id;
        const obj = app.addMeshObj({
          shadowsCast: true,
          material: {type: 'standard', shared: false},
          position: item.position,
          rotationSpeed: {x: 0, y: 1, z: 0},
          scale: [item.scale[0] / meshScale, item.scale[1] / meshScale, item.scale[2] / meshScale],
          texturesPaths: [item.tex],
          name: nName,
          mesh: this.meshes.energyItem,
          physics: {enabled: false, mass: 0, geometry: 'Cube'},
          raycast: {enabled: true, radius: 1},
          pointerEffect: {enabled: true}
        });
        app.collisionSystem.registerPickup(nName, item.position, item.radius, item.type, item.amount);
        setTimeout(() => {
          obj.setBlend(0.85);
          obj.setupMaterialPBR([12, 4, 1], 2, .1, 0.1)
          if(!obj.effects) obj.effects = {};
          obj.effects.kaleBullet1 = new FlameEffect(app.device, 'rgba16float', 'rgba16float', FlamePresets.bonfire, app.cameraBuffer)
          obj.effects.kaleBullet1.setGeometry(geometryTypes.ring, 2)
          obj.effects.kaleBullet1.speed = 5;
          obj.effects.kaleBullet1.intensity = 40;
        }, 350);
      } else if(item.type === 'ammo') {
        const meshScale = 2 + 1;
        const nName = item.type + item.id;
        const obj_ = app.addMeshObj({
          shadowsCast: true,
          material: {type: 'standard', shared: false},
          position: item.position,
          rotationSpeed: {x: 0, y: 1, z: 0},
          rotation: {x: 0, y: 0, z: 0},
          scale: [item.scale[0] / meshScale, item.scale[1] / meshScale, item.scale[2] / meshScale],
          texturesPaths: [item.tex],
          useBlend: true,
          name: nName,
          mesh: this.meshes.ammo,
          physics: {enabled: false, mass: 0, geometry: 'Cube'},
          raycast: {enabled: true, radius: 1},
          pointerEffect: {enabled: true}
        });
        app.collisionSystem.registerPickup(nName, item.position, item.radius, item.type, item.amount);
      } else if(item.type === 'armor') {
        const meshScale = 2;
        const nName = item.type + item.id;
        const obj_ = app.addMeshObj({
          shadowsCast: true,
          material: {type: 'standard', shared: false},
          position: item.position,
          rotationSpeed: {x: 0, y: 2, z: 0},
          scale: [item.scale[0] / meshScale, item.scale[1] / meshScale, item.scale[2] / meshScale],
          texturesPaths: [item.tex],
          useBlend: true,
          name: nName,
          mesh: this.meshes.armor,
          physics: {enabled: false, mass: 0, geometry: 'Cube'},
          raycast: {enabled: true, radius: 1},
          pointerEffect: {enabled: true}
        });
        app.collisionSystem.registerPickup(nName, item.position, item.radius, item.type, item.amount);
        setTimeout(() => {
          obj_.setBlend(0.5);
          if(!obj_.effects) obj_.effects = {};
          obj_.effects.kaleBullet1 = new FlameEffect(app.device, 'rgba16float', 'rgba16float', FlamePresets.torch, app.cameraBuffer)
          obj_.effects.kaleBullet1.setScale(0.5);
          obj_.effects.kaleBullet1.speed = 5;
          obj_.effects.kaleBullet1.intensity = 40;
        }, 350);
      }
    })
  }

  respawnMapItem(type, id) {
    mapParams.collectItems.forEach((item) => {
      if(item.type === 'energy' && type === 'energy') {
        const nName = item.type + item.id;
        if(id !== nName) return;
        const meshScale = 2;
        const obj = app.addMeshObj({
          shadowsCast: true,
          material: {type: 'standard', shared: false},
          position: item.position,
          rotationSpeed: {x: 0, y: 1, z: 0},
          scale: [item.scale[0] / meshScale, item.scale[1] / meshScale, item.scale[2] / meshScale],
          texturesPaths: [item.tex],
          name: nName,
          mesh: this.meshes.energyItem,
          physics: {enabled: false, mass: 0, geometry: 'Cube'},
          raycast: {enabled: true, radius: 1},
          pointerEffect: {enabled: true}
        });
        app.collisionSystem.registerPickup(nName, item.position, item.radius, item.type, item.amount);
        setTimeout(() => {
          obj.setBlend(0.85);
          obj.setupMaterialPBR([12, 4, 1], 2, .1, 0.1)
          if(!obj.effects) obj.effects = {};
          obj.effects.kaleBullet1 = new FlameEffect(app.device, 'rgba16float', 'rgba16float', FlamePresets.bonfire, app.cameraBuffer)
          obj.effects.kaleBullet1.setGeometry(geometryTypes.ring, 2)
          obj.effects.kaleBullet1.speed = 5;
          obj.effects.kaleBullet1.intensity = 40;
          // console.log(obj.effects.kaleBullet)
        }, 350);
      } else if(item.type === 'ammo' && type === 'ammo') {
        const nName = item.type + item.id;
        if(id !== nName) return;
        const meshScale = 2 + 1;
        const obj_ = app.addMeshObj({
          shadowsCast: true,
          material: {type: 'standard', shared: false},
          position: item.position,
          rotationSpeed: {x: 0, y: 1, z: 0},
          rotation: {x: 0, y: 0, z: 0},
          scale: [item.scale[0] / meshScale, item.scale[1] / meshScale, item.scale[2] / meshScale],
          texturesPaths: [item.tex],
          useBlend: true,
          name: nName,
          mesh: this.meshes.ammo,
          physics: {enabled: false, mass: 0, geometry: 'Cube'},
          raycast: {enabled: true, radius: 1},
          pointerEffect: {enabled: true}
        });
        app.collisionSystem.registerPickup(nName, item.position, item.radius, item.type, item.amount);
      } else if(item.type === 'armor' && type === 'armor') {
        const nName = item.type + item.id;
        if(id !== nName) return;
        const meshScale = 2;
        const obj_ = app.addMeshObj({
          shadowsCast: true,
          material: {type: 'standard', shared: false},
          position: item.position,
          rotationSpeed: {x: 0, y: 2, z: 0},
          scale: [item.scale[0] / meshScale, item.scale[1] / meshScale, item.scale[2] / meshScale],
          texturesPaths: [item.tex],
          useBlend: true,
          name: nName,
          mesh: this.meshes.armor,
          physics: {enabled: false, mass: 0, geometry: 'Cube'},
          raycast: {enabled: true, radius: 1},
          pointerEffect: {enabled: true}
        });
        app.collisionSystem.registerPickup(nName, item.position, item.radius, item.type, item.amount);
        setTimeout(() => {
          obj_.setBlend(0.5);
          if(!obj_.effects) obj_.effects = {};
          obj_.effects.kaleBullet1 = new FlameEffect(app.device, 'rgba16float', 'rgba16float', FlamePresets.torch, app.cameraBuffer)
          obj_.effects.kaleBullet1.setScale(0.5);
          obj_.effects.kaleBullet1.speed = 5;
          obj_.effects.kaleBullet1.intensity = 40;
          // console.log(">>>>>>>>>>>>>>>>>>>>>>>>>" + obj_.effects.kaleBullet1)
        }, 350);
      }
    })
  }
}