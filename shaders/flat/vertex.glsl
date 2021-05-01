in vec3 aVertexPosition;
in vec3 aVertexNormal;
in vec3 aFrontColor;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

out vec4 fragcolor;
flat out vec3 v_normal;

void main(void) {
  // v_normal = normalize((mvNormal * vec4(aVertexNormal, 0)).xyz);
  vec3 transformedNormal = uNMatrix * aVertexNormal;
  float directionalLightWeighting = max(dot(transformedNormal, uLightingDirection), 0.0);
  vLightWeighting = uAmbientColor + uDirectionalColor * directionalLightWeighting;
  fragcolor = vec4(aFrontColor.rgb * vLightWeighting, 1.0);

  gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}