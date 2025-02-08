/**
 *
 * Escena.js
 *
 * Practica AGM #1. Escena basica en three.js
 * Seis objetos organizados en un grafo de escena con
 * transformaciones, animacion basica y modelos importados
 *
 * @author
 *
 */

// Modulos necesarios
import { GUI } from 'https://unpkg.com/dat.gui@0.7.9/build/dat.gui.module.js'
import { GLTFLoader } from '../lib/GLTFLoader.module.js'
import * as THREE from '../lib/three.module.js'
import { OrbitControls } from '../lib/OrbitControls.module.js'

// Shaders
// Jquery está instalado en el HTML
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
// Variables de consenso
let renderer, scene, camera

// Otras globales
/*******************
 * TO DO: Variables globales de la aplicacion
 *******************/
let pentagon
let groupFiguras = new THREE.Object3D()
let mixer, animations, activeAction
let step = 0
let options

// Acciones
init()
loadScene()
render()

function init() {
    // Motor de render
    renderer = new THREE.WebGLRenderer({
        antialias: true,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    document.getElementById('container').appendChild(renderer.domElement)

    // Escena
    scene = new THREE.Scene()
    scene.background = new THREE.Color('black')

    // GUI controls

    const gui = new GUI()
    options = {
        speed: 0.007,
        wireframe: false,
    }

    gui.add(options, 'speed', 0, 0.1)
    gui.add(options, 'wireframe').onChange(function (e) {
        groupFiguras.children.forEach((fig) => {
            fig.material.wireframe = e
        })
    })

    // Camara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

    // Orbit controls para mover la camara con el mouse
    const orbit = new OrbitControls(camera, renderer.domElement)

    camera.position.set(0.5, 5, 7)
    orbit.update()
    camera.lookAt(new THREE.Vector3(0, 1, 1))
}

function loadScene() {
    // Rotación para que los elementos se encuentren en el eje zx
    const rotacion = -Math.PI / 2
    // Lighting the scene
    const ambientLight = new THREE.AmbientLight(0x404040, 6)
    scene.add(ambientLight)

    // Material que da color según la normal
    const material = new THREE.MeshNormalMaterial()

    // Material para el suelo
    const materialSuelo = new THREE.MeshBasicMaterial({ color: 'yellow', wireframe: true })

    // Material para el pentagono
    const materialGeom = new THREE.MeshBasicMaterial({ color: 0x282740 })

    // Material para el globo terráqueo
    var earthMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            globeTexture: {
                value: new THREE.TextureLoader().load('../images/Earth.jpg'),
            },
        },
    })

    var atmosphereMaterial = new THREE.ShaderMaterial({
        vertexShader: atmosphereVxShader,
        fragmentShader: atmosphereFxShader,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
    })

    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), materialSuelo)
    suelo.rotation.x = rotacion
    scene.add(suelo)

    // Cargador de modelos GLTF
    const glloader = new GLTFLoader()
    // Figuras que se añaden encima del pentágono
    const figuras = [
        new THREE.OctahedronGeometry(0.7),
        new THREE.CylinderGeometry(0.5, 0.5, 1, 64),
        new THREE.ConeGeometry(1, 1, 64),
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.SphereGeometry(0.5, 40, 40),
    ]

    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(0.5, 40, 40), atmosphereMaterial)

    atmosphere.scale.set(1.05, 1.05, 1.05)
    const globe = new THREE.Object3D()

    const starVertices = []
    const starGeometry = new THREE.BufferGeometry()
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff })

    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000
        const y = (Math.random() - 0.5) * 2000
        const z = (Math.random() - 0.5) * 2000
        starVertices.push(x, y, z)
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3))

    const stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)

    const radio = 3 // Reducido para que entren bien en la escena
    const angulos = [0, (2 * Math.PI) / 5, (4 * Math.PI) / 5, (6 * Math.PI) / 5, (8 * Math.PI) / 5]

    // Un pentágono no es más que un círculo con pocos 5 polígonos
    const pentagonoGeom = new THREE.CircleGeometry(radio, 5)
    pentagon = new THREE.Mesh(pentagonoGeom, materialGeom)
    pentagon.translateY = 0.5
    pentagon.rotation.x = rotacion
    pentagon.add(new THREE.AxesHelper(3))

    // Bucle que itera sobre las figuras para añadir las coordenadas e instanciarlas en el FigureGroup
    for (let i = 0; i < 5; i++) {
        const x = radio * Math.cos(angulos[i])
        const z = radio * Math.sin(angulos[i])
        let figura
        if (i < 4) {
            figura = new THREE.Mesh(figuras[i], material)
            figura.position.set(x, 1, z)
            figura.add(new THREE.AxesHelper(2))
            groupFiguras.add(figura)
        } else {
            figura = new THREE.Mesh(figuras[i], earthMaterial)
            globe.add(figura)
            globe.add(atmosphere)
            globe.position.set(x, 1, z)
            figura.add(new THREE.AxesHelper(2))
            groupFiguras.add(globe)
        }
    }

    // Utilizamos el glloader para cargar el giorno bailarín
    glloader.load(
        'models/giornoAnimations.glb',
        function (gltf) {
            scene.add(gltf.scene)
            console.log('giorno doing a backflip!')
            console.log(gltf)
            mixer = new THREE.AnimationMixer(gltf.scene)

            animations = gltf.animations
            // Si el modelo tiene animaciones, animala
            if (animations.length > 0) {
                activeAction = mixer.clipAction(animations[1])

                // Cuando una animación termina, ejecuta la siguiente
                mixer.addEventListener('finished', (e) => {
                    const nextAnimIndex =
                        (animations.indexOf(e.action._clip) + 1) % animations.length
                    changeAnimation(nextAnimIndex)
                })
                activeAction.setLoop(THREE.LoopOnce)
                activeAction.play()
            }
        },
        undefined,
        function (error) {
            console.error(error)
        }
    )

    /*******************
     * TO DO: Añadir a la escena unos ejes
     *******************/

    scene.add(pentagon)
    scene.add(groupFiguras)
}

// Helper para cambiar entre las animaciones en base al índice en la lista animations
function changeAnimation(animationIndex) {
    if (!animations || animations.length == 0) return
    if (activeAction) {
        activeAction.fadeOut(0.5)
    }

    activeAction = mixer.clipAction(animations[animationIndex])
    activeAction.setLoop(THREE.LoopOnce)
    activeAction.reset().fadeIn(0.5)
    activeAction.play()
}

function update() {
    pentagon.rotation.z += options.speed
    groupFiguras.rotation.y += options.speed
    let figs = groupFiguras.children
    step += options.speed

    for (let i = 0; i < figs.length; i++) {
        const fig = figs[i]
        // Mueve los objetos de arriba a abajo
        fig.position.y = 0.5 + 1 * Math.abs(Math.sin(step))
        fig.rotation.x += options.speed
    }
    if (mixer) {
        mixer.update(0.007)
    }

    /*******************
     * TO DO: Modificar el angulo de giro de cada objeto sobre si mismo
     * y del conjunto pentagonal sobre el objeto importado
     *******************/
}

function render() {
    requestAnimationFrame(render)
    update()
    renderer.render(scene, camera)
}
