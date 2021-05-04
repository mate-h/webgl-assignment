#extension GL_OES_standard_derivatives : enable

precision mediump float;

varying vec4 fragcolor;
varying vec4 vPosition;

void main(void) {
  vec3 U = dFdx(vPosition.xyz);
  vec3 V = dFdy(vPosition.xyz);
  vec3 N = normalize(cross(U,V));
  gl_FragColor = fragcolor * vec4(N, 1.0);
}