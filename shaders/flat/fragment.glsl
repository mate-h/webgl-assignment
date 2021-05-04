#extension GL_OES_standard_derivatives : enable

precision mediump float;

varying vec4 fragcolor;
varying vec4 vPosition;

void main(void) {
  vec3 U = dFdx(vPosition.xyz);
  vec3 V = dFdy(vPosition.xyz);
  vec3 normal = normalize(cross(U,V));
  vec3 pointLightingLocation = vec3(-10.0,4.0,-16.0);
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
  float specularLightIntensity = 0.2;
  vec4 specularLightColor = vec4(specularLightWeighting * specularLightIntensity);

  vec4 lightWeighting = ambientLightColor + diffuseLightColor + specularLightColor;
  gl_FragColor = fragcolor * vec4(lightWeighting.rgb, 1.0);
}