// imports
import { mat4, mat3 } from "gl-matrix";
import { parameters } from "./gui";

// common variables
export let gl;
var shaderProgram;

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

var modelVertexPositionBuffer;
var modelVertexNormalBuffer;
var modelVertexFrontColorBuffer;

var currentAngle = 180;
var lastTime = 0;

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

function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  if (!shaderScript) {
    return null;
  }

  var shaderSource = "";
  var k = shaderScript.firstChild;
  while (k) {
    if (k.nodeType == 3) {
      shaderSource += k.textContent;
    }

    k = k.nextSibling;
  }

  var shader;
  if (shaderScript.type == "fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
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
  // var fragmentShader = getShader(gl, "fragmentShader");
  // var vertexShader = getShader(gl, "vertexShader");

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

function handleLoadedModel(teapotData) {
  modelVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexPositionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(teapotData.vertexPositions),
    gl.STATIC_DRAW
  );
  modelVertexPositionBuffer.itemSize = 3;
  modelVertexPositionBuffer.numItems = teapotData.vertexPositions.length / 3;

  modelVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexNormalBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(teapotData.vertexNormals),
    gl.STATIC_DRAW
  );
  modelVertexNormalBuffer.itemSize = 3;
  modelVertexNormalBuffer.numItems = teapotData.vertexNormals.length / 3;

  modelVertexFrontColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexFrontColorBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(teapotData.vertexFrontcolors),
    gl.STATIC_DRAW
  );
  modelVertexFrontColorBuffer.itemSize = 3;
  modelVertexFrontColorBuffer.numItems =
    teapotData.vertexFrontcolors.length / 3;
}

export function loadModel() {
  fetch(`./model/${parameters.currentModel}.json`)
    .then((r) => r.json())
    .then((r) => {
      handleLoadedModel(r);
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

  if (
    modelVertexPositionBuffer == null ||
    modelVertexNormalBuffer == null ||
    modelVertexFrontColorBuffer == null
  ) {
    return;
  }

  // Setup Projection Matrix
  mat4.perspective(
    pMatrix,
    degToRad(parameters.camera.fov),
    gl.viewportWidth / gl.viewportHeight,
    0.1,
    100.0
  );

  // Setup Model-View Matrix
  mat4.identity(mvMatrix);
  mat4.translate(mvMatrix, mvMatrix, parameters.camera.position);
  const lookup = {
    x: [1, 0, 0],
    y: [0, 1, 0],
    z: [0, 0, 1],
  };
  mat4.rotate(
    mvMatrix,
    mvMatrix,
    degToRad(currentAngle),
    lookup[parameters.turnAxis]
  );

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

  gl.drawArrays(gl.TRIANGLES, 0, modelVertexPositionBuffer.numItems);
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

function webGLStart() {
  var canvas = document.getElementById("ICG-canvas");
  initGL(canvas);
  initShaders().then(() => {
    loadModel();

    gl.clearColor(0.0, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);

    tick();
  });
}

document.body.onload = () => webGLStart();
