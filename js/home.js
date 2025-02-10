import * as THREE from '../lib/three.module.js';

let renderer, scene, camera;

var vertexShader = $.ajax({
    async: false,
    url: '../shaders/vxEarth.glsl',
    dataType: 'xml',
}).responseText;

var fragmentShader = $.ajax({
    async: false,
    url: '../shaders/fsEarth.glsl',
    dataType: 'xml',
}).responseText;

var atmosphereVxShader = $.ajax({
    async: false,
    url: '../shaders/vxAtmosphere.glsl',
    dataType: 'xml',
}).responseText;

var atmosphereFxShader = $.ajax({
    async: false,
    url: '../shaders/fsAtmosphere.glsl',
    dataType: 'xml',
}).responseText;

var morphFShader = $.ajax({
    async: false,
    url: '../shaders/fsMorph.glsl',
    dataType: 'xml',
}).responseText;

var morphVxShader = $.ajax({
    async: false,
    url: '../shaders/vxMorph.glsl',
    dataType: 'xml',
}).responseText;

var vertexPars = $.ajax({
    async: false,
    url: '../shaders/morphVertex_pars.glsl',
    dataType: 'xml',
}).responseText;

var vertexMain = $.ajax({
    async: false,
    url: '../shaders/morphVertex_main.glsl',
    dataType: 'xml',
}).responseText;

var fragmentMain = $.ajax({
    async: false,
    url: '../shaders/morphFrag_main.glsl',
    dataType: 'xml',
}).responseText;

var fragmentPars = $.ajax({
    async: false,
    url: '../shaders/morphFrag_pars.glsl',
    dataType: 'xml',
}).responseText;

let sphere, atmosphere;
let sphereMaterial;
let group;
let canvasContainer;

const mouse = {
    x: undefined,
    y: undefined,
};

const clock = new THREE.Clock();

init();
loadScene();
render();

addEventListener('mousemove', (e) => {
    mouse.x = e.clientX / innerWidth;
    mouse.y = e.clientY / innerHeight;
});

addEventListener('resize', () => {
    renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
    //camera.aspect = canvasContainer.offsetWidth / canvasContainer.offsetHeight;
});

function init() {
    // Creamos el renderer y ajustamos el mismo al ancho y largo de la pantalla
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: document.querySelector('canvas'),
    });

    let canvasContainer = document.querySelector('#canvasContainer');
    renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
    renderer.setPixelRatio(devicePixelRatio);

    scene = new THREE.Scene();
    scene.background = new THREE.Color('black');

    camera = new THREE.PerspectiveCamera(
        75,
        canvasContainer.offsetWidth / canvasContainer.offsetHeight,
        0.01,
        1000
    );

    camera.position.z = 15;
}

function loadScene() {
    // Crear la luz direccional

    const ambientLight = new THREE.DirectionalLight(0x0404040, 0.3);
    ambientLight.position.set(7, 7, 7);
    scene.add(ambientLight);

    let atmosphereColor = new THREE.Color(0.3, 0.6, 0.9);

    let earthTexture = new THREE.TextureLoader().load('../images/Earth.jpg');
    let currentTime = new Date();
    if (currentTime.getHours() < 7 || currentTime.getHours() >= 19) {
        earthTexture = new THREE.TextureLoader().load('../images/EarthNight.jpg');
    }

    sphereMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            globeTexture: {
                value: new THREE.TextureLoader().load('../images/Earth.jpg'),
            },
            uTime: { value: 0.0 },
        },
    });

    if (Math.round(Math.random()) == 1) {
        for (let i = 0; i < 100; i++) {
            const light = new THREE.PointLight(randomColor(), 1, 10);
            light.position.set(i * 5 - 5, 5, i);
            scene.add(light);
        }
        sphereMaterial = new THREE.MeshStandardMaterial({
            onBeforeCompile: (shader) => {
                sphereMaterial.userData.shader = shader;
                shader.uniforms.uTime = { value: 0.0 };
                shader.uniforms.globeTexture = { value: earthTexture };
                const parseVertexString = `#include <displacementmap_pars_vertex>`;
                shader.vertexShader = shader.vertexShader.replace(
                    parseVertexString,
                    parseVertexString + vertexPars
                );

                const mainVertexString = `#include <displacementmap_vertex>`;
                shader.vertexShader = shader.vertexShader.replace(
                    mainVertexString,
                    mainVertexString + vertexMain
                );

                const mainFragmentString = `#include <normal_fragment_maps>`;
                shader.fragmentShader = shader.fragmentShader.replace(
                    mainFragmentString,
                    mainFragmentString + fragmentMain
                );
                const parsFragmentString = `#include <bumpmap_pars_fragment>`;
                shader.fragmentShader = shader.fragmentShader.replace(
                    parsFragmentString,
                    parsFragmentString + fragmentPars
                );
                console.log(shader.fragmentShader);
                sphereMaterial.needsUpdate = true;
            },
        });
        atmosphereColor = randomColor();
    }
    sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(5, 300), sphereMaterial);
    sphere.rotation.x = 5;

    atmosphere = new THREE.Mesh(
        new THREE.IcosahedronGeometry(5, 50),
        new THREE.ShaderMaterial({
            vertexShader: atmosphereVxShader,
            fragmentShader: atmosphereFxShader,
            uniforms: {
                uTime: { value: 0.0 },
            },
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
        })
    );

    atmosphere.scale.set(1.1, 1.1, 1.1);

    const starVertices = [];
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
    });

    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = -Math.random() * 2000 - 150;
        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

    const stars = new THREE.Points(starGeometry, starMaterial);

    group = new THREE.Group();
    scene.add(sphere);
    scene.add(atmosphere);
    scene.add(stars);
    group.add(sphere);
    scene.add(group);
}

function randomColor() {
    return new THREE.Color(Math.random(), Math.random(), Math.random());
}

function update() {
    if (sphere) {
        sphere.rotation.y += 0.001;
        if (sphereMaterial.userData.shader && sphereMaterial.userData.shader.uniforms)
            sphereMaterial.userData.shader.uniforms.uTime.value = clock.getElapsedTime() * 0.07;
        if (atmosphere.material) atmosphere.material.uniforms.uTime.value = clock.getElapsedTime();
    }
    gsap.to(group.rotation, {
        x: mouse.y * 0.3,
        y: mouse.x * 0.5,
        duration: 2,
    });
}

function render() {
    requestAnimationFrame(render);
    update();
    renderer.render(scene, camera);
}
