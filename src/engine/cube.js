import {UNLIT_SHADER} from "../shaders/shaders";
import {mat4, vec3} from 'wgpu-matrix';
import {Position, Rotation} from "./matrix-class";
import {createInputHandler} from "./engine";

var SphereLayout = {
	vertexStride: 8 * 4,
	positionsOffset: 0,
	normalOffset: 3 * 4,
	uvOffset: 6 * 4,
};

export default class MECube {

	constructor(canvas, device, context, o) {
		this.device = device;
		this.context = context;
		this.entityArgPass = o.entityArgPass;
		this.inputHandler = createInputHandler(window, canvas);
		this.cameras = o.cameras;
		console.log('passed : o.mainCameraParams.responseCoef ', o.mainCameraParams.responseCoef)
		this.mainCameraParams = {
			type: o.mainCameraParams.type,
			responseCoef: o.mainCameraParams.responseCoef
		} // |  WASD 'arcball' };

		this.lastFrameMS = 0;
		this.shaderModule = device.createShaderModule({
			code: UNLIT_SHADER,
		});

		this.texturesPaths = [];

		if(typeof o.raycast === 'undefined') {
			this.raycast = {
				enabled: false,
				radius: 2
			};
		} else {
			this.raycast = o.raycast;
		}

		// useUVShema4x2 pass this from top !

		o.texturesPaths.forEach((t) => {
			this.texturesPaths.push(t)
		})

		this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
		this.position = new Position(o.position.x, o.position.y, o.position.z);
		console.log('cube added on pos : ', this.position)
		this.rotation = new Rotation(o.rotation.x, o.rotation.y, o.rotation.z);
		this.rotation.rotationSpeed.x = o.rotationSpeed.x;
		this.rotation.rotationSpeed.y = o.rotationSpeed.y;
		this.rotation.rotationSpeed.z = o.rotationSpeed.z;

		this.scale = o.scale;
		this.pipeline = device.createRenderPipeline({
			layout: 'auto',
			vertex: {
				module: this.shaderModule,
				entryPoint: 'vertexMain',
				buffers: [
					{
						arrayStride: SphereLayout.vertexStride,
						attributes: [
							// position
							{shaderLocation: 0, offset: SphereLayout.positionsOffset, format: 'float32x3'},
							// normal
							{shaderLocation: 1, offset: SphereLayout.normalOffset, format: 'float32x3'},
							// uv
							{shaderLocation: 2, offset: SphereLayout.uvOffset, format: 'float32x2', },
						],
					},
				],
			},
			fragment: {
				module: this.shaderModule,
				entryPoint: 'fragmentMain',
				targets: [{format: this.presentationFormat, },],
			},
			primitive: {
				topology: 'triangle-list',
				// Backface culling since the sphere is solid piece of geometry.
				// Faces pointing away from the camera will be occluded by faces
				// pointing toward the camera.
				cullMode: 'back',
			},
			// Enable depth testing so that the fragment closest to the camera
			// is rendered in front.
			depthStencil: {
				depthWriteEnabled: true,
				depthCompare: 'less',
				format: 'depth24plus',
			},
		});

		this.depthTexture = device.createTexture({
			size: [canvas.width, canvas.height],
			format: 'depth24plus',
			usage: GPUTextureUsage.RENDER_ATTACHMENT,
		});

		this.uniformBufferSize = 4 * 16; // 4x4 matrix
		this.uniformBuffer = device.createBuffer({
			size: this.uniformBufferSize,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
		});

		// Fetch the images and upload them into a GPUTexture.
		this.texture0 = null;
		this.moonTexture = null;

		this.settings = {
			useRenderBundles: true,
			asteroidCount: 15,
		};

		this.loadTex0(this.texturesPaths, device).then(() => {
			this.loadTex1(this.texturesPaths, device).then(() => {

				this.sampler = device.createSampler({
					magFilter: 'linear',
					minFilter: 'linear',
				});

				this.transform = mat4.create();
				mat4.identity(this.transform);

				this.planet = this.createGeometry({
					scale: this.scale,
					useUVShema4x2: false
				});
				this.planet.bindGroup = this.createSphereBindGroup(this.texture0, this.transform);

				// can be used like instance draws
				var asteroids = [
					// this.createGeometry(0.2, 8, 6, 0.15),
				];

				this.renderables = [this.planet];
				// this.ensureEnoughAsteroids(asteroids, this.transform);
				this.renderPassDescriptor = {
					colorAttachments: [
						{
							view: undefined,
							clearValue: {r: 0.0, g: 0.0, b: 0.0, a: 1.0},
							loadOp: this.entityArgPass.loadOp,
							storeOp: this.entityArgPass.storeOp,
						},
					],
					depthStencilAttachment: {
						view: this.depthTexture.createView(),
						depthClearValue: 1.0,
						depthLoadOp: this.entityArgPass.depthLoadOp,
						depthStoreOp: this.entityArgPass.depthStoreOp,
					},
				};

				const aspect = canvas.width / canvas.height;
				this.projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 1000.0);
				this.modelViewProjectionMatrix = mat4.create();

				this.frameBindGroup = device.createBindGroup({
					layout: this.pipeline.getBindGroupLayout(0),
					entries: [
						{
							binding: 0,
							resource: {buffer: this.uniformBuffer, },
						},
					],
				});

				// The render bundle can be encoded once and re-used as many times as needed.
				// Because it encodes all of the commands needed to render at the GPU level,
				// those commands will not need to execute the associated JavaScript code upon
				// execution or be re-validated, which can represent a significant time savings.
				//
				// However, because render bundles are immutable once created, they are only
				// appropriate for rendering content where the same commands will be executed
				// every time, with the only changes being the contents of the buffers and
				// textures used. Cases where the executed commands differ from frame-to-frame,
				// such as when using frustrum or occlusion culling, will not benefit from
				// using render bundles as much.
				this.renderBundle;
				this.updateRenderBundle();
			})
		})
	}

	ensureEnoughAsteroids(asteroids, transform) {
		for(let i = this.renderables.length;i <= this.settings.asteroidCount;++i) {
			// Place copies of the asteroid in a ring.
			const radius = Math.random() * 1.7 + 1.25;
			const angle = Math.random() * Math.PI * 2;
			const x = Math.sin(angle) * radius;
			const y = (Math.random() - 0.5) * 0.015;
			const z = Math.cos(angle) * radius;

			mat4.identity(transform);
			mat4.translate(transform, [x, y, z], transform);
			mat4.rotateX(transform, Math.random() * Math.PI, transform);
			mat4.rotateY(transform, Math.random() * Math.PI, transform);
			this.renderables.push({
				...asteroids[i % asteroids.length],
				bindGroup: this.createSphereBindGroup(this.moonTexture, transform),
			});
		}
	}

	updateRenderBundle() {
		console.log('[CUBE] updateRenderBundle')
		const renderBundleEncoder = this.device.createRenderBundleEncoder({
			colorFormats: [this.presentationFormat],
			depthStencilFormat: 'depth24plus',
		});
		this.renderScene(renderBundleEncoder);
		this.renderBundle = renderBundleEncoder.finish();
	}

	createGeometry(options) {
		const mesh = this.createCubeVertices(options);
		// Create a vertex buffer from the sphere data.
		const vertices = this.device.createBuffer({
			size: mesh.vertices.byteLength,
			usage: GPUBufferUsage.VERTEX,
			mappedAtCreation: true,
		});
		new Float32Array(vertices.getMappedRange()).set(mesh.vertices);
		vertices.unmap();

		const indices = this.device.createBuffer({
			size: mesh.indices.byteLength,
			usage: GPUBufferUsage.INDEX,
			mappedAtCreation: true,
		});
		new Uint16Array(indices.getMappedRange()).set(mesh.indices);
		indices.unmap();

		return {
			vertices,
			indices,
			indexCount: mesh.indices.length,
		};
	}

	createSphereBindGroup(texture, transform) {

		const uniformBufferSize = 4 * 16; // 4x4 matrix
		const uniformBuffer = this.device.createBuffer({
			size: uniformBufferSize,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
			mappedAtCreation: true,
		});
		new Float32Array(uniformBuffer.getMappedRange()).set(transform);
		uniformBuffer.unmap();

		const bindGroup = this.device.createBindGroup({
			layout: this.pipeline.getBindGroupLayout(1),
			entries: [
				{
					binding: 0,
					resource: {
						buffer: uniformBuffer,
					},
				},
				{
					binding: 1,
					resource: this.sampler,
				},
				{
					binding: 2,
					resource: texture.createView(),
				},
			],
		});

		return bindGroup;
	}


	// TEST 
	getViewMatrix() {
		const camera = this.cameras[this.mainCameraParams.type];
		const viewMatrix = camera.update(deltaTime, this.inputHandler());
		return viewMatrix;
	}

	getTransformationMatrix(pos) {
		const now = Date.now();
		const deltaTime = (now - this.lastFrameMS) / this.mainCameraParams.responseCoef;
		this.lastFrameMS = now;

		// const viewMatrix = mat4.identity(); ORI
		const camera = this.cameras[this.mainCameraParams.type];
		const viewMatrix = camera.update(deltaTime, this.inputHandler());

		mat4.translate(viewMatrix, vec3.fromValues(pos.x, pos.y, pos.z), viewMatrix);
		mat4.rotateX(viewMatrix, Math.PI * this.rotation.getRotX(), viewMatrix);
		mat4.rotateY(viewMatrix, Math.PI * this.rotation.getRotY(), viewMatrix);
		mat4.rotateZ(viewMatrix, Math.PI * this.rotation.getRotZ(), viewMatrix);
		mat4.multiply(this.projectionMatrix, viewMatrix, this.modelViewProjectionMatrix);

		return this.modelViewProjectionMatrix;
	}

	async loadTex1(textPath, device) {
		return new Promise(async (resolve) => {
			const response = await fetch(textPath[0]);
			const imageBitmap = await createImageBitmap(await response.blob());
			this.moonTexture = device.createTexture({
				size: [imageBitmap.width, imageBitmap.height, 1],
				format: 'rgba8unorm',
				usage:
					GPUTextureUsage.TEXTURE_BINDING |
					GPUTextureUsage.COPY_DST |
					GPUTextureUsage.RENDER_ATTACHMENT,
			});
			var moonTexture = this.moonTexture
			device.queue.copyExternalImageToTexture(
				{source: imageBitmap},
				{texture: moonTexture},
				[imageBitmap.width, imageBitmap.height]
			);
			resolve()
		})
	}

	async loadTex0(texturesPaths, device) {
		return new Promise(async (resolve) => {
			const response = await fetch(texturesPaths[0]);
			const imageBitmap = await createImageBitmap(await response.blob());
			console.log('WHAT IS THIS ', this)
			this.texture0 = device.createTexture({
				size: [imageBitmap.width, imageBitmap.height, 1],
				format: 'rgba8unorm',
				usage:
					GPUTextureUsage.TEXTURE_BINDING |
					GPUTextureUsage.COPY_DST |
					GPUTextureUsage.RENDER_ATTACHMENT,
			});
			var texture0 = this.texture0
			device.queue.copyExternalImageToTexture(
				{source: imageBitmap},
				{texture: texture0},
				[imageBitmap.width, imageBitmap.height]
			);
			resolve()
		})

	}


	// Render bundles function as partial, limited render passes, so we can use the
	// same code both to render the scene normally and to build the render bundle.
	renderScene(passEncoder) {

		if(typeof this.renderables === 'undefined') return;
		passEncoder.setPipeline(this.pipeline);
		passEncoder.setBindGroup(0, this.frameBindGroup);

		// Loop through every renderable object and draw them individually.
		// (Because many of these meshes are repeated, with only the transforms
		// differing, instancing would be highly effective here. This sample
		// intentionally avoids using instancing in order to emulate a more complex
		// scene, which helps demonstrate the potential time savings a render bundle
		// can provide.)
		let count = 0;
		for(const renderable of this.renderables) {
			passEncoder.setBindGroup(1, renderable.bindGroup);
			passEncoder.setVertexBuffer(0, renderable.vertices);
			passEncoder.setIndexBuffer(renderable.indices, 'uint16');
			passEncoder.drawIndexed(renderable.indexCount);
			if(++count > this.settings.asteroidCount) {
				break;
			}
		}
	}

	createCubeVertices(options) {
		if(typeof options === 'undefined') {
			var options = {
				scale: 1,
				useUVShema4x2: false
			}
		}
		if(typeof options.scale === 'undefined') options.scale = 1;

		let vertices;
		if(options.useUVShema4x2 == true) {
			vertices = new Float32Array([
				//  position   |  texture coordinate
				//-------------+----------------------
				// front face     select the top left image  1, 0.5,   
				-1, 1, 1, 1, 0, 0, 0, 0,
				-1, -1, 1, 1, 0, 0, 0, 0.5,
				1, 1, 1, 1, 0, 0, 0.25, 0,
				1, -1, 1, 1, 0, 0, 0.25, 0.5,
				// right face     select the top middle image
				1, 1, -1, 1, 0, 0, 0.25, 0,
				1, 1, 1, 1, 0, 0, 0.5, 0,
				1, -1, -1, 1, 0, 0, 0.25, 0.5,
				1, -1, 1, 1, 0, 0, 0.5, 0.5,
				// back face      select to top right image
				1, 1, -1, 1, 0, 0, 0.5, 0,
				1, -1, -1, 1, 0, 0, 0.5, 0.5,
				-1, 1, -1, 1, 0, 0, 0.75, 0,
				-1, -1, -1, 1, 0, 0, 0.75, 0.5,
				// left face       select the bottom left image
				-1, 1, 1, 1, 0, 0, 0, 0.5,
				-1, 1, -1, 1, 0, 0, 0.25, 0.5,
				-1, -1, 1, 1, 0, 0, 0, 1,
				-1, -1, -1, 1, 0, 0, 0.25, 1,
				// bottom face     select the bottom middle image
				1, -1, 1, 1, 0, 0, 0.25, 0.5,
				-1, -1, 1, 1, 0, 0, 0.5, 0.5,
				1, -1, -1, 1, 0, 0, 0.25, 1,
				-1, -1, -1, 1, 0, 0, 0.5, 1,
				// top face        select the bottom right image
				-1, 1, 1, 1, 0, 0, 0.5, 0.5,
				1, 1, 1, 1, 0, 0, 0.75, 0.5,
				-1, 1, -1, 1, 0, 0, 0.5, 1,
				1, 1, -1, 1, 0, 0, 0.75, 1,
			]);
		} else {
			vertices = new Float32Array([
				//  position                                                   |  texture coordinate
				//-------------                                              +----------------------
				// front face     select the top left image  1, 0.5,   
				-1 * options.scale, 1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 0,
				-1 * options.scale, -1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 1,
				1 * options.scale, 1 * options.scale, 1 * options.scale, 1, 0, 0, 1, 0,
				1 * options.scale, -1 * options.scale, 1 * options.scale, 1, 0, 0, 1, 1,
				// right face     select the top middle image
				1 * options.scale, 1 * options.scale, -1 * options.scale, 1, 0, 0, 0, 0,
				1 * options.scale, 1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 1,
				1 * options.scale, -1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 0,
				1 * options.scale, -1 * options.scale, 1 * options.scale, 1, 0, 0, 1, 1,
				// back face      select to top right image
				1 * options.scale, 1 * options.scale, -1 * options.scale, 1, 0, 0, 0, 0,
				1 * options.scale, -1 * options.scale, -1 * options.scale, 1, 0, 0, 0, 1,
				-1 * options.scale, 1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 0,
				-1 * options.scale, -1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 1,
				// left face       select the bottom left image
				-1 * options.scale, 1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 0,
				-1 * options.scale, 1 * options.scale, -1 * options.scale, 1, 0, 0, 0, 1,
				-1 * options.scale, -1 * options.scale, 1 * options.scale, 1, 0, 0, 1, 0,
				-1 * options.scale, -1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 1,
				// bottom face     select the bottom middle image
				1 * options.scale, -1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 0,
				-1 * options.scale, -1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 1,
				1 * options.scale, -1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 0,
				-1 * options.scale, -1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 1,
				// top face        select the bottom right image
				-1 * options.scale, 1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 0,
				1 * options.scale, 1 * options.scale, 1 * options.scale, 1, 0, 0, 0, 1,
				-1 * options.scale, 1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 0,
				1 * options.scale, 1 * options.scale, -1 * options.scale, 1, 0, 0, 1, 1,
			])
		}


		const indices = new Uint16Array([
			0, 1, 2, 2, 1, 3,  // front
			4, 5, 6, 6, 5, 7,  // right
			8, 9, 10, 10, 9, 11,  // back
			12, 13, 14, 14, 13, 15,  // left
			16, 17, 18, 18, 17, 19,  // bottom
			20, 21, 22, 22, 21, 23,  // top
		]);

		return {
			vertices,
			indices,
			numVertices: indices.length,
		};
	}

	draw = () => {
		if(this.moonTexture == null) {
			// console.log('not ready')
			return;
		}
		const transformationMatrix = this.getTransformationMatrix(this.position);
		this.device.queue.writeBuffer(
			this.uniformBuffer,
			0,
			transformationMatrix.buffer,
			transformationMatrix.byteOffset,
			transformationMatrix.byteLength
		);
		this.renderPassDescriptor.colorAttachments[0].view = this.context
			.getCurrentTexture()
			.createView();
	}
}