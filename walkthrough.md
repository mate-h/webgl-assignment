# Walkthrough
## Development environment
Alacritty terminal, Fish shell, VSCode IDE  

## Steps
1. Received the assignment, extracted the zip file, created repository and published it to GitHub.
```bash
mkdir webgl-assignment
cd webgl-assignment
git init
git add .
git commit -m "Initial commit"
git remote add origin git@github.com:mate-h/webgl-assignment.git
git push origin master
```

2. Converted the source to NPM package, added dependencies.  
Package dependencies:
- [`dat.gui`](https://github.com/dataarts/dat.gui) for the debug panel on the right
- [`gl-matrix`](https://glmatrix.net/) for matrix math, already in the original code. Updated to latest version.
- [`snowpack`](https://www.snowpack.dev/) CLI for linking the dependencies as ES6 modules, build script
- [`vercel`](https://vercel.com/) CLI for deployment  

```bash
npm init
npm i -D snowpack vercel
npm i dat.gui gl-matrix
```

3. Modularized code by moving inline script to [`js/index.js`](./js/index.js). Removed old script tags. Updated mat4 operations to latest version by referring to documentation at https://glmatrix.net/docs/. 

Changed in [`index.html`](./index.html)
```html
+ <script type="module" src="./js/index.js"></script>
- <script type="text/javascript">
-   ...
- </script>
- <script type="text/javascript" src="./js/glMatrix-0.9.5.min.js"></script>
- <script type="text/javascript" src="./js/webgl-utils.js"></script>
```

Changed in [`js/index.js`](./js/index.js)  
```javascript
+ // imports
+ import { mat4, mat3 } from "gl-matrix";

...
function tick() {
-   requestAnimFrame(tick);
+   requestAnimationFrame(tick);
...
```

4. Installed GLSL VSCode extension. Added [`shaders`](./shaders) folder. Implemented asynchronous function to load shaders from static files.  
```js
/**
 * Loads a shader through the network asynchronously
 */
function getShaderAsync(gl, path, type = gl.FRAGMENT_SHADER) {
  return fetch(path)
    .then((r) => r.text())
    .then((source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
      }

      return shader;
    });
}
export function initShaders() {
  const loadFragment = getShaderAsync(gl, `./shaders/${parameters.currentShader}/fragment.glsl`, gl.FRAGMENT_SHADER);
  const loadVertex = getShaderAsync(gl, `./shaders/${parameters.currentShader}/vertex.glsl`, gl.VERTEX_SHADER);
  return Promise.all([loadFragment, loadVertex]).then(
    ([fragmentShader, vertexShader]) => {
        /* ... */
    });
}
```

5. Added GUI to control parameters in [`js/gui.js`](./js/gui.js). Followed documentation from https://github.com/dataarts/dat.gui/blob/master/API.md. First I added a dropdown for picking a shader from three options:

```js
gui
  .add(parameters, "currentShader")
  .options("flat", "gouraud", "phong", "main")
  .name("Shader")
  .onChange((a) => {
    initShaders();
  });
```
Then, as I was working on the code, when I wanted to expose a new parameter from [`js/index.js`](./js/index.js), I added it to [`js/gui.js`](./js/gui.js). Always making sure to handle the "on change, refresh" logic. 

6. The **vertex normal attribute buffer** needs to be exposed to the GLSL shaders in order to calculate lighting.  
In [`initShaders()`](./js/index.js#L54) function
```js
shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
```
In [`drawScene()`](./js/index.js#L239) function
```js
gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexNormalBuffer);
gl.vertexAttribPointer(
  shaderProgram.vertexNormalAttribute,
  modelVertexNormalBuffer.itemSize,
  gl.FLOAT,
  false,
  0,
  0
);
```
In [`handleLoadedModel()`](./js/index.js#L174) function
```js
modelVertexNormalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexNormalBuffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array(modelData.vertexNormals),
  gl.STATIC_DRAW
);
modelVertexNormalBuffer.itemSize = 3;
modelVertexNormalBuffer.numItems = modelData.vertexNormals.length / 3;
```

7. Calculate normal matrix from model view matrix, bind the uniform to the shader program

In [`initShaders()`](./js/index.js#L54) function
```js
shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
```
In [`setMatrixUniforms()`](./js/index.js#L124) function  
```js
var normalMatrix = mat3.create();
mat3.normalFromMat4(normalMatrix, mvMatrix);
gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
```
[`shaders/phong/vertex.glsl`](./shaders/phong/vertex.glsl)  
```cpp
uniform mat3 uNMatrix;
```

8. Next, we need to define a light to calculate the lighting information in the shaders.
```js
let parameters = {
  ambientLight: {
    color: [173, 212, 255],
    intensity: 0.3,
  },
  scene:[{
    type: "light",
    color: [76, 130, 39],
    intensity: 0.5,
    on: true,
    transform: {
      translate: [60, 20, 0],
    },
  }]
```

9. Bind the light attributes to the shader using a uniform type of `PointLight[]`.  
[`shaders/phong/fragment.glsl`](./shaders/phong/fragment.glsl#L4)
```cpp
struct PointLight
{
  vec3 position;
  vec3 color;
  float intensity;
};
const int maxLightCount = 128;
uniform int uPointLightCount;
uniform PointLight uPointLights[maxLightCount];
uniform vec3 uAmbientLightColor;
uniform float uAmbientLightIntensity;
```

In [`setMatrixUniforms()`](./js/index.js#L124) function  
```js
// Lighting
gl.uniform3fv(shaderProgram.ambientLightColorUniform, parameters.ambientLight.color.map((c) => c / 255));
gl.uniform1f(shaderProgram.ambientLightIntensityUniform, parameters.ambientLight.intensity);
const lights = parameters.scene.filter(
  (o) => o.type === "light" && o.on === true
);
const lightCount = lights.length;
gl.uniform1i(shaderProgram.pointLightCountUniform, lightCount);
lights.forEach((l, i) => {
  const lightTranslate = gl.getUniformLocation(shaderProgram, `uPointLights[${i}].position`);
  gl.uniform3fv(lightTranslate, l.transform.translate);

  const lightColor = gl.getUniformLocation(shaderProgram, `uPointLights[${i}].color`);
  gl.uniform3fv(lightColor, l.color.map((c) => c / 255));

  const lightIntensity = gl.getUniformLocation(shaderProgram, `uPointLights[${i}].intensity`);
  gl.uniform1f(lightIntensity, l.intensity);
});
```

10. Implement the three different shading models.
The approach for all shaders is very similar. Starting with **phong shading**.
In the vertex shader, calculate the transformed normal using the normal matrix uniform and the vertex normal attribute.
```cpp
void main(void) {
  vPosition = uMVMatrix * vec4(aVertexPosition, 1.0);
  gl_Position = uPMatrix * vPosition;
  vTransformedNormal = uNMatrix * aVertexNormal;
  
  fragcolor = vec4(aFrontColor.rgb, 1.0);
}
```
In the fragment shader, calculate `gl_FragColor` based on phong reflection model. Code is based on  
https://github.com/tparisi/webgl-lessons/tree/master/lesson14

It is quite easy to expose new parameters from this shader code such as `materialShininess` using uniform shader bindings. 

```cpp
void main(void) {
  vec3 normal = normalize(vTransformedNormal);
  vec3 ambientLightColor = uAmbientLightColor * vec3(uAmbientLightIntensity);
  vec3 lightWeighting = ambientLightColor;
  for(int i = 0; i < maxLightCount; i++) {
    if (i >= uPointLightCount) {
      break;
    }
    PointLight l = uPointLights[i];
    vec3 pointLightingLocation = l.position;
    vec3 lightDirection = normalize(pointLightingLocation - vPosition.xyz);
    float diffuseLightWeight = max(dot(normal, lightDirection), 0.0);
    float diffuseLightIntensity = 1.0 * l.intensity;
    vec3 diffuseLightColor = l.color * vec3(diffuseLightIntensity * diffuseLightWeight);

    float materialShininess = 1.0;
    float specularLightWeighting = 0.0;
    vec3 eyeDirection = normalize(-vPosition.xyz);
    vec3 reflectionDirection = reflect(-lightDirection, normal);

    specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirection), 0.0), materialShininess);
    float specularLightIntensity = 0.4 * l.intensity;
    vec3 specularLightColor = vec3(specularLightWeighting * specularLightIntensity);

    lightWeighting += diffuseLightColor + specularLightColor;
  }
  gl_FragColor = fragcolor * vec4(lightWeighting.rgb, 1.0);
}
```

For **flat shading**, the code is almost the same except the way that the surface normal is calculated.
```cpp
void main(void) {
  vec3 U = dFdx(vPosition.xyz);
  vec3 V = dFdy(vPosition.xyz);
  vec3 normal = normalize(cross(U,V));
  // ...
}
```

For **gouraud shading**, moved the shader code from the fragment shader to the vertex shader to achieve "per-vertex" shading. The fragment shader can be kept the same as the original simple shader code provided with the assignment.

11. Define list of objects in the scene and their transformations.
```js
let parameters = {
  scene: [{
    type: "mesh",
    model: "Teapot",
    transform: {
      translate: [0, 3, 1],
      scale: 0.1,
      rotate: [16, 3, -24],
      shear: 85,
    },
  }]
}
```

12. Loop through scene objects and load their vertices with their attributes in the `loadScene()` and `handleLoadedModel()` functions.

13. Calculate projection matrix, camera matrix, and view matrix
[`drawScene()`](./js/index.js#L239) function
```js
// Setup Projection Matrix
mat4.perspective(pMatrix, degToRad(parameters.camera.fov), gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

// Compute a matrix for the camera
let cameraMatrix = mat4.create();
mat4.rotateY(cameraMatrix, cameraMatrix, degToRad(currentAngle));
mat4.translate(cameraMatrix, cameraMatrix, parameters.camera.position);

// Make a view matrix from the camera matrix
let viewMatrix = mat4.create();
mat4.invert(viewMatrix, cameraMatrix);
```

14. Loop through scene objects in [`drawScene()`](./js/index.js#L239) function and calculate the model-view matrices for each object individually. Then, bind the uniforms and vertex attributes to the shader program, and finally, draw the triangles (and lines for wireframe) from the buffer.
```js
scene.forEach(
  ({
    modelVertexPositionBuffer,
    modelVertexNormalBuffer,
    modelVertexFrontColorBuffer,
    object,
  }) => {
    // Setup Model-View Matrix
    mat4.copy(mvMatrix, viewMatrix);
    mat4.translate(mvMatrix, mvMatrix, object.transform.translate);
    const s = object.transform.scale;
    mat4.scale(mvMatrix, mvMatrix, [s, s, s]);
    object.transform.rotate.forEach((v, i) => {
      const lookup = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];
      mat4.rotate(mvMatrix, mvMatrix, degToRad(v), lookup[i]);
    });
    const phi = object.transform.shear;
    const cot = (x) => 1 / Math.tan(x);
    const shearMatrix = mat4.create();
    shearMatrix.set([
      1, cot(degToRad(phi)), 0, 0, 
      0, 1, 0, 0, 
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]);
    mat4.multiply(mvMatrix, mvMatrix, shearMatrix);
    /* ... */
  })
```

15. Now we see that the objects in the scene are rendered on the canvas.