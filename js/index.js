// imports
import { mat4, mat3 } from "gl-matrix";
import { parameters } from "./gui";

// common variables
export let gl;
var shaderProgram;

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

var currentAngle = 180;
var lastTime = 0;

// scene
let scene = [];

function initGL(canvas) {
  try {
    gl = canvas.getContext("webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {}

  if (!gl) {
    alert("Could not initialise WebGL, sorry :-(");
  }

  if (!gl.getExtension("OES_standard_derivatives")) {
    throw "Extention not supported";
  }
}

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
  const loadFragment = getShaderAsync(
    gl,
    `./shaders/${parameters.currentShader}/fragment.glsl`,
    gl.FRAGMENT_SHADER
  );
  const loadVertex = getShaderAsync(
    gl,
    `./shaders/${parameters.currentShader}/vertex.glsl`,
    gl.VERTEX_SHADER
  );
  return Promise.all([loadFragment, loadVertex]).then(
    ([fragmentShader, vertexShader]) => {
      shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vertexShader);
      gl.attachShader(shaderProgram, fragmentShader);
      gl.linkProgram(shaderProgram);

      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
      }

      gl.useProgram(shaderProgram);

      shaderProgram.vertexPositionAttribute = gl.getAttribLocation(
        shaderProgram,
        "aVertexPosition"
      );

      shaderProgram.vertexNormalAttribute = gl.getAttribLocation(
        shaderProgram,
        "aVertexNormal"
      );
      gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

      gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
      shaderProgram.vertexFrontColorAttribute = gl.getAttribLocation(
        shaderProgram,
        "aFrontColor"
      );
      gl.enableVertexAttribArray(shaderProgram.vertexFrontColorAttribute);

      shaderProgram.pMatrixUniform = gl.getUniformLocation(
        shaderProgram,
        "uPMatrix"
      );
      shaderProgram.mvMatrixUniform = gl.getUniformLocation(
        shaderProgram,
        "uMVMatrix"
      );
      shaderProgram.nMatrixUniform = gl.getUniformLocation(
        shaderProgram,
        "uNMatrix"
      );
    }
  );
}

function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

  var normalMatrix = mat3.create();
  mat3.normalFromMat4(normalMatrix, mvMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function handleLoadedModel(modelData) {
  var modelVertexPositionBuffer;
  var modelVertexNormalBuffer;
  var modelVertexFrontColorBuffer;

  modelVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexPositionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(modelData.vertexPositions),
    gl.STATIC_DRAW
  );
  modelVertexPositionBuffer.itemSize = 3;
  modelVertexPositionBuffer.numItems = modelData.vertexPositions.length / 3;

  modelVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexNormalBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(modelData.vertexNormals),
    gl.STATIC_DRAW
  );
  modelVertexNormalBuffer.itemSize = 3;
  modelVertexNormalBuffer.numItems = modelData.vertexNormals.length / 3;

  modelVertexFrontColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexFrontColorBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(modelData.vertexFrontcolors),
    gl.STATIC_DRAW
  );
  modelVertexFrontColorBuffer.itemSize = 3;
  modelVertexFrontColorBuffer.numItems = modelData.vertexFrontcolors.length / 3;

  return {
    modelVertexPositionBuffer,
    modelVertexNormalBuffer,
    modelVertexFrontColorBuffer,
  };
}

export function loadScene() {
  Promise.all(
    parameters.scene.map((obj) =>
      fetch(`./model/${obj.model}.json`).then((r) => r.json())
    )
  ).then((vals) => {
    scene = [];
    const buffers = vals.map(v => handleLoadedModel(v)).map((o,i) => ({
      ...o,
      object: parameters.scene[i]
    }));
    scene.push(...buffers);
  });
}

/*
    TODO HERE:
    add two or more objects showing on the canvas
    (it needs at least three objects showing at the same time)
*/
function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Setup Projection Matrix
  mat4.perspective(
    pMatrix,
    degToRad(parameters.camera.fov),
    gl.viewportWidth / gl.viewportHeight,
    0.1,
    100.0
  );

  // Compute a matrix for the camera
  let cameraMatrix = mat4.create();
  mat4.rotateY(cameraMatrix, cameraMatrix, degToRad(currentAngle));
  mat4.translate(cameraMatrix, cameraMatrix, parameters.camera.position);

  // Make a view matrix from the camera matrix
  let viewMatrix = mat4.create();
  mat4.invert(viewMatrix, cameraMatrix);

  scene.forEach(
    ({
      modelVertexPositionBuffer,
      modelVertexNormalBuffer,
      modelVertexFrontColorBuffer,
      object
    }) => {
      // Setup Model-View Matrix
      mat4.copy(mvMatrix, viewMatrix);
      mat4.translate(mvMatrix, mvMatrix, object.transform.translate);

      setMatrixUniforms();

      // Setup teapot position data
      gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexPositionBuffer);
      gl.vertexAttribPointer(
        shaderProgram.vertexPositionAttribute,
        modelVertexPositionBuffer.itemSize,
        gl.FLOAT,
        false,
        0,
        0
      );

      gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexNormalBuffer);
      gl.vertexAttribPointer(
        shaderProgram.vertexNormalAttribute,
        modelVertexNormalBuffer.itemSize,
        gl.FLOAT,
        false,
        0,
        0
      );

      // Setup teapot front color data
      gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexFrontColorBuffer);
      gl.vertexAttribPointer(
        shaderProgram.vertexFrontColorAttribute,
        modelVertexFrontColorBuffer.itemSize,
        gl.FLOAT,
        false,
        0,
        0
      );

      if (parameters.wireframe) {
        gl.drawArrays(gl.LINE_STRIP, 0, modelVertexPositionBuffer.numItems);
      } else {
        gl.drawArrays(gl.TRIANGLES, 0, modelVertexPositionBuffer.numItems);
      }
    }
  );

  gl.flush();
}

function animate() {
  var timeNow = new Date().getTime();
  if (lastTime != 0) {
    var elapsed = timeNow - lastTime;
    currentAngle += parameters.turnSpeed * elapsed;
  }

  lastTime = timeNow;
}

function tick() {
  requestAnimFrame(tick);
  drawScene();
  animate();
}

export function setBackground(color) {
  const bg = color.map(c => c/255)
  gl.clearColor(...bg, 1.0);
}

function webGLStart() {
  var canvas = document.getElementById("ICG-canvas");
  initGL(canvas);
  initShaders().then(() => {
    loadScene();

    const bg = parameters.background.map(c => c/255)
    gl.clearColor(...bg, 1.0);
    gl.enable(gl.DEPTH_TEST);

    tick();
  });
}

document.body.onload = () => webGLStart();
