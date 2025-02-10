varying vec3 vertexNormal;

uniform float uTime;

vec3 colorOverTime(float time){
    // Función que cambia el color dependiendo del tiempo
    float red = sin(time) * 0.5 + 0.5; // Oscilación de rojo entre 0 y 1
    float green = cos(time * 0.5) * 0.5 + 0.5; // Oscilación de verde
    float blue = sin(time * 0.3) * 0.5 + 0.5; // Oscilación de azul
    
    return vec3(red, green, blue); // Devolver el color como vec3
}

void main() {
    float intensity = pow(0.8 - dot(vertexNormal, vec3(0, 0, 1.0)), 2.0);
    vec3 dynamicColor = colorOverTime(uTime);
    gl_FragColor = vec4(dynamicColor, 1.0) * intensity;
}
