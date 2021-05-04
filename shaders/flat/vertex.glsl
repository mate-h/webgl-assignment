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

  vec3 pointLightingLocation = vec3(-10.0,4.0,-16.0);
  vec3 lightDirection = normalize(pointLightingLocation - vPosition.xyz);
  vec3 normal = normalize(vTransformedNormal);
  float diffuseLightWeight = max(dot(normal, lightDirection), 0.0);
  float diffuseLightIntensity = 1.0;
  vec4 diffuseLightColor = vec4(1.0,1.0,1.0,1.0) * diffuseLightIntensity;
  float ambientLightIntensity = 0.2;
  vec4 ambientLightColor = vec4(1.0,1.0,1.0,1.0) * ambientLightIntensity;
  vec4 lightWeighting = ambientLightColor + diffuseLightColor * diffuseLightWeight;
  fragcolor = vec4(aFrontColor.rgb * lightWeighting.rgb, 1.0);
}