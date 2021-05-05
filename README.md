# webgl-assignment

## Demo
https://webgl-assignment.vercel.app/

## Description
1. Implement “Flat Shading”, “Gouraud Shading" and "Phong Shading” on top of vertexShader and fragmentShader with Phong reflection model

2. Enable multiple transformations (four fundamental transformations) on objects in a scene.

3. In drawScene(), add new items (this homework requires _at least_ 3 objects and 3 light sources) Add two or more objects showing on the canvas.

IMPORTANT NOTICE:
1. Most models have already been transformed into json format, each model has colours, position and normal information (Teapot.json stores extra texture coordinate information for when we want to do texture mapping.)
2. When doing flat shading, if need to use `dFdx`, have to first add `#extension GL_OES_standard_derivatives : enable` into fragment shader AND also in `initGL`, add the code below

```js
if (!gl.getExtension('OES_standard_derivatives')){
  throw 'Extention not supported';
}
```

## Cloning this repo
```
git clone https://github.com/mate-h/webgl-assignment
cd webgl-assignment
npm i
npm run dev
```

## Solutions

Flat shading  
https://stackoverflow.com/questions/40101023/flat-shading-in-webgl

Phong reflection model  
https://github.com/tparisi/webgl-lessons/tree/master/lesson14

Camera implementation  
https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html

Lighting struct uniform  
https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html