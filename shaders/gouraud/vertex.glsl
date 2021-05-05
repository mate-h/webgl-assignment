attribute vec3 aVertexPosition;
attribute vec3 aFrontColor;
attribute vec3 aVertexNormal;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;

varying vec4 fragcolor;
varying vec3 vTransformedNormal;
varying vec4 vPosition;

// lighting
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

void main(void) {
  vPosition = uMVMatrix * vec4(aVertexPosition, 1.0);
  gl_Position = uPMatrix * vPosition;
  vTransformedNormal = uNMatrix * aVertexNormal;

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
  fragcolor = vec4(aFrontColor.rgb * lightWeighting.rgb, 1.0);
}