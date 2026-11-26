3. Usage
Your uploaded JSON export can be loaded directly.

Kinematic mode
import { BlockLoader, CollisionSystem } from 'matrix-engine-wgpu';

app.collisionSystem = new CollisionSystem(app);

const loader = new BlockLoader(
  app,
  meshes.cube,
  app.collisionSystem
);

const response = await fetch('./test-export.json');
const mapData = await response.json();

loader.load(mapData, {
  mode: 'kinematic'
});


Real physics mode
import { BlockLoader } from 'matrix-engine-wgpu';

const loader = new BlockLoader(
  app,
  meshes.cube
);

loader.load(mapData, {
  mode: 'physics',
  mass: 0
});