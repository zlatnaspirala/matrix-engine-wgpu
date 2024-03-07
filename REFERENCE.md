
### Best solution for learning:

https://webgpufundamentals.org/webgpu/lessons/webgpu-from-webgl.html


###  I got answer from gman at stackoverflow.com :

https://stackoverflow.com/questions/78093302/webgpu-i-cant-draw-two-object-in-same-scene/78098135#78098135

Interest facts about webGPU tech:

```
You can have different pipelines if the things you want to draw actually need different pipelines but if possible you could try to have less pipelines than more. In the example above, if you cube had a different pipeline than the sphere you'd call setPipeline with the sphere's pipeline after drawing the cube and before drawing the sphere.
```

```
Let's assume you only have one pipeline and 2 things you want to draw with that pipeline, a cube, and a sphere. In pseudo code you might do something like this

at init time
create pipeline
create vertex buffers for cube
create uniform buffers for cube
create bindGroup for cube
create vertex buffers for sphere
create uniform buffers for sphere
create bindGroup for cube
at render time
create command buffer
begin render pass
set pipeline
set vertex buffers for cube
set bindGroups for cube
draw cube
set vertex buffers for sphere
set bindgroups for sphere
draw sphere
end render pass
finish command buffer
submit command buffer

Things to notice, there is only one command buffer. There is only 1 render pass.
```


```
For each render pass, you need to set loadOp and storeOp correctly. 
Most examples that have one render pass set loadOp: 'clear' but in the example above, if render pass 2 had loadOp: 'clear' it would erase the results from render pass 1. Instead it would need to be loadOp: 'load'.
```

YEs this is happening " would erase the results from render pass 1 "


