attribute vec3 aVertexPosition;
attribute vec3 aFrontColor;
attribute vec3 aVertexNormal;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

varying vec4 fragcolor;
varying vec3 vTransformedNormal;
varying vec4 vPosition;

void main(void) {
  vPosition = uMVMatrix * vec4(aVertexPosition, 1.0);
  gl_Position = uPMatrix * vPosition;
  vTransformedNormal = uNMatrix * aVertexNormal;
  
  fragcolor = vec4(aFrontColor.rgb, 1.0);
}