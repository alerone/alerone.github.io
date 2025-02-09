import * as THREE from '../lib/three.module.js'

let renderer, scene, camera

var vertexShader = $.ajax({
    async: false,
    url: '../shaders/vxEarth.glsl',
    dataType: 'xml',
}).responseText

var fragmentShader = $.ajax({
    async: false,
    url: '../shaders/fsEarth.glsl',
    dataType: 'xml',
}).responseText

var atmosphereVxShader = $.ajax({
    async: false,
    url: '../shaders/vxAtmosphere.glsl',
    dataType: 'xml',
}).responseText

var atmosphereFxShader = $.ajax({
    async: false,
    url: '../shaders/fsAtmosphere.glsl',
    dataType: 'xml',
}).responseText

let sphere
let group

const mouse = {
    x: undefined,
    y: undefined,
}

init()
loadScene()
render()

addEventListener('mousemove', (e) => {
    mouse.x = e.clientX / innerWidth
    mouse.y = e.clientY / innerHeight
})

function init() {
    // Creamos el renderer y ajustamos el mismo al ancho y largo de la pantalla
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: document.querySelector('canvas'),
    })
    const canvasContainer = document.querySelector('#canvasContainer')
    renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight)
    renderer.setPixelRatio(devicePixelRatio)

    scene = new THREE.Scene()
    scene.background = new THREE.Color('black')

    camera = new THREE.PerspectiveCamera(
        75,
        canvasContainer.offsetWidth / canvasContainer.offsetHeight,
        0.01,
        1000
    )
    camera.position.z = 15
}

function loadScene() {
    let earthTexture = new THREE.TextureLoader().load('../images/Earth.jpg')
    let currentTime = new Date()
    if (currentTime.getHours() < 7 || currentTime.getHours() >= 19) {
        earthTexture = new THREE.TextureLoader().load('../images/EarthNight.jpg')
    }
    sphere = new THREE.Mesh(
        new THREE.SphereGeometry(5, 50, 50),
        new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                globeTexture: {
                    value: earthTexture,
                },
            },
        })
    )
    sphere.rotation.y = 5

    const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(5, 50, 50),
        new THREE.ShaderMaterial({
            vertexShader: atmosphereVxShader,
            fragmentShader: atmosphereFxShader,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
        })
    )

    atmosphere.scale.set(1.1, 1.1, 1.1)

    const starVertices = []
    const starGeometry = new THREE.BufferGeometry()
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff })

    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000
        const y = (Math.random() - 0.5) * 2000
        const z = -Math.random() * 2000 - 150
        starVertices.push(x, y, z)
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3))

    const stars = new THREE.Points(starGeometry, starMaterial)

    group = new THREE.Group()
    scene.add(sphere)
    scene.add(atmosphere)
    scene.add(stars)
    group.add(sphere)

    scene.add(group)
}

function update() {
    sphere.rotation.y += 0.001
    gsap.to(group.rotation, {
        x: mouse.y * 0.3,
        y: mouse.x * 0.5,
        duration: 2,
    })
}

function render() {
    requestAnimationFrame(render)
    update()
    renderer.render(scene, camera)
}
