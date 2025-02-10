
    vec3 coords = normal;
    coords.y += uTime;
    vec3 noisePattern = vec3(noise(coords));
    float pattern = wave(noisePattern);

    // varyings
    vDisplacement = pattern;

    float displacement = vDisplacement / 5.;
    
    transformed += normalize(objectNormal) * displacement;

