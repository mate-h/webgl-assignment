#extension GL_OES_standard_derivatives : enable

precision mediump float;

// lighting
struct PointLight
{
  vec3 position;
  vec4 color;
};
const int maxLightCount = 128;
uniform int uPointLightCount;
uniform PointLight uPointLights[maxLightCount];

varying vec4 fragcolor;
varying vec3 vTransformedNormal;
varying vec4 vPosition;

void main(void) {
  vec3 normal = normalize(vTransformedNormal);
  vec4 lightWeighting = vec4(0.0);
  for(int i = 0; i < maxLightCount; i++) {
    if (i >= uPointLightCount) {
      break;
    }
    PointLight l = uPointLights[i];
    vec3 pointLightingLocation = l.position;
    vec3 lightDirection = normalize(pointLightingLocation - vPosition.xyz);
    float diffuseLightWeight = max(dot(normal, lightDirection), 0.0);
    float diffuseLightIntensity = 1.0;
    vec4 diffuseLightColor = vec4(diffuseLightIntensity * diffuseLightWeight);
    float ambientLightIntensity = 0.1;
    vec4 ambientLightColor = vec4(ambientLightIntensity);

    float materialShininess = 1.0;
    float specularLightWeighting = 0.0;
    vec3 eyeDirection = normalize(-vPosition.xyz);
    vec3 reflectionDirection = reflect(-lightDirection, normal);

    specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirection), 0.0), materialShininess);
    float specularLightIntensity = 0.4;
    vec4 specularLightColor = vec4(specularLightWeighting * specularLightIntensity);

    lightWeighting += ambientLightColor + diffuseLightColor + specularLightColor;
  }
  gl_FragColor = fragcolor * vec4(lightWeighting.rgb, 1.0);
}