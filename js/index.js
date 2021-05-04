// common variables
var gl;
var shaderProgram;

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

var teapotVertexPositionBuffer;
var teapotVertexNormalBuffer;
var teapotVertexFrontColorBuffer;

var teapotAngle = 180;
var lastTime = 0;

//parameters
const currentShader = "flat";

function initGL(canvas) {
  try {
    gl = canvas.getContext("webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {}

  if (!gl) {
    alert("Could not initialise WebGL, sorry :-(");
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

function initShaders() {
  // var fragmentShader = getShader(gl, "fragmentShader");
  // var vertexShader = getShader(gl, "vertexShader");

  const loadFragment = getShaderAsync(
    gl,
    `./shaders/${currentShader}/fragment.glsl`,
    gl.FRAGMENT_SHADER
  );
  const loadVertex = getShaderAsync(
    gl,
    `./shaders/${currentShader}/vertex.glsl`,
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

      shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
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
  mat4.toInverseMat3(mvMatrix, normalMatrix);
  mat3.transpose(normalMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function handleLoadedTeapot(teapotData) {
  teapotVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(teapotData.vertexPositions),
    gl.STATIC_DRAW
  );
  teapotVertexPositionBuffer.itemSize = 3;
  teapotVertexPositionBuffer.numItems = teapotData.vertexPositions.length / 3;

  teapotVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(teapotData.vertexNormals),
    gl.STATIC_DRAW
  );
  teapotVertexNormalBuffer.itemSize = 3;
  teapotVertexNormalBuffer.numItems = teapotData.vertexNormals.length / 3;

  teapotVertexFrontColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexFrontColorBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(teapotData.vertexFrontcolors),
    gl.STATIC_DRAW
  );
  teapotVertexFrontColorBuffer.itemSize = 3;
  teapotVertexFrontColorBuffer.numItems =
    teapotData.vertexFrontcolors.length / 3;
}

function loadTeapot() {
  var request = new XMLHttpRequest();
  request.open("GET", "./model/Teapot.json");
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      handleLoadedTeapot(JSON.parse(request.responseText));
    }
  };
  request.send();
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
    teapotVertexPositionBuffer == null ||
    teapotVertexNormalBuffer == null ||
    teapotVertexFrontColorBuffer == null
  ) {
    return;
  }

  // Setup Projection Matrix
  mat4.perspective(
    45,
    gl.viewportWidth / gl.viewportHeight,
    0.1,
    100.0,
    pMatrix
  );

  // Setup Model-View Matrix
  mat4.identity(mvMatrix);
  mat4.translate(mvMatrix, [0, 0, -40]);
  mat4.rotate(mvMatrix, degToRad(teapotAngle), [0, 1, 0]);

  setMatrixUniforms();

  // Setup teapot position data
  gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    teapotVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, teapotVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Setup teapot front color data
  gl.bindBuffer(gl.ARRAY_BUFFER, teapotVertexFrontColorBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexFrontColorAttribute,
    teapotVertexFrontColorBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.drawArrays(gl.TRIANGLES, 0, teapotVertexPositionBuffer.numItems);
}

function animate() {
  var timeNow = new Date().getTime();
  if (lastTime != 0) {
    var elapsed = timeNow - lastTime;
    teapotAngle += 0.03 * elapsed;
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
    loadTeapot();

    gl.clearColor(0.0, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);

    tick();
  });
}

document.body.onload = () => webGLStart();
