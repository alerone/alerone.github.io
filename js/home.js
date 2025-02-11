import * as THREE from '../lib/three.module.js';

let renderer, scene, camera;

var vertexShader, fragmentShader;
var atmosphereVxShader, atmosphereFxShader;

var vertexPars, vertexMain;
var fragmentPars, fragmentMain;

let sphere, atmosphere;
let sphereMaterial;
let group;
let canvasContainer;
let loadManager, textureLoader;

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

    const progressBar = document.querySelector('#progress-bar');
    loadManager = new THREE.LoadingManager();

    const progressContainer = document.querySelector('#loading-screen');

    loadManager.onLoad = function () {
        console.log('loaded');
        progressContainer.style.display = 'none';
    };

    textureLoader = new THREE.TextureLoader(loadManager);

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

    atmosphereVxShader = loadShader('../shaders/vxAtmosphere.glsl');
    atmosphereFxShader = loadShader('../shaders/fsAtmosphere.glsl');

    if (Math.round(Math.random()) == 1) {
        document.querySelector('.progress-bar-container').style.display = 'none';
        vertexPars = loadShader('../shaders/morphVertex_pars.glsl');
        vertexMain = loadShader('../shaders/morphVertex_main.glsl');
        fragmentPars = loadShader('../shaders/morphFrag_pars.glsl');
        fragmentMain = loadShader('../shaders/morphFrag_main.glsl');
        sphereMaterial = loadBlackMatterMaterial();
    } else {
        vertexShader = loadShader('../shaders/vxEarth.glsl');
        fragmentShader = loadShader('../shaders/fsEarth.glsl');
        let currentTime = new Date();
        if (currentTime.getHours() < 7 || currentTime.getHours() >= 19) {
            sphereMaterial = loadEarthMaterial('../images/EarthNight.jpg', textureLoader);
        } else {
            sphereMaterial = loadEarthMaterial('../images/Earth.jpg', textureLoader);
        }
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

function loadEarthMaterial(textureURL, textureLoader) {
    let texture = textureLoader.load(textureURL);

    return new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            globeTexture: {
                value: texture,
            },
            uTime: { value: 0.0 },
        },
    });
}

function loadBlackMatterMaterial() {
    for (let i = 0; i < 100; i++) {
        const light = new THREE.PointLight(randomColor(), 1, 10);
        light.position.set(i * 5 - 5, 5, i);
        scene.add(light);
    }
    let result = new THREE.MeshStandardMaterial({
        onBeforeCompile: (shader) => {
            result.userData.shader = shader;
            shader.uniforms.uTime = { value: 0.0 };
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
            result.needsUpdate = true;
        },
    });
    return result;
}

function loadShader(url) {
    let shader;
    $.ajax({
        async: false,
        url: url,
        datatype: 'text',
        success: function (data) {
            shader = data;
        },
        error: function () {
            console.error('Error al cargar el shader');
        },
    });
    return shader;
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
