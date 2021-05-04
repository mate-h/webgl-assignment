# webgl-assignment

## Demo
https://webgl-assignment.vercel.app/

## Description
1. Implement “Flat Shading”, “Gouraud Shading" and "Phong Shading” on top of vertexShader and fragmentShader with Phong reflection model

2. Enable multiple transformations (four fundamental transformations) on objects in a scene.

2. In drawScene(), add new items (this homework requires _at least_ 3 objects and 3 light sources) Add two or more objects showing on the canvas.

IMPORTANT NOTICE:
1. Most models have already been transformed into json format, each model has colours, position and normal information (Teapot.json stores extra texture coordinate information for when we want to do texture mapping.)
2. When doing flat shading, if need to use `dFdx`, have to first add `#extension GL_OES_standard_derivatives : enable` into fragment shader AND also in `initGL`, add the below code

```js
  if (!gl.getExtension('OES_standard_derivatives')){
    throw 'Extention not supported';
  }
```