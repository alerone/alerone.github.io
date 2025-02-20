/**
 * EscenaAnimada.js
 *
 * Practica AGM #2. Escena basica con interfaz y animacion
 * Se trata de añadir un interfaz de usuario que permita
 * disparar animaciones sobre los objetos de la escena con Tween
 *
 * @author
 *
 */

// Modulos necesarios
/*******************
 * TO DO: Cargar los modulos necesarios
 *******************/
import { GUI } from '../lib/lil-gui.module.min.js'
import { GLTFLoader } from '../lib/GLTFLoader.module.js'
import * as THREE from '../lib/three.module.js'
import { OrbitControls } from '../lib/OrbitControls.module.js'
import { TWEEN } from '../lib/tween.module.min.js'

// Variables de consenso
let renderer, scene, camera

// Otras globales
/*******************
 * TO DO: Variables globales de la aplicacion
 *******************/

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

let pentagon
let groupFiguras = new THREE.Object3D()
const angulos = [0, (2 * Math.PI) / 5, (4 * Math.PI) / 5, (6 * Math.PI) / 5, (8 * Math.PI) / 5]
let gui
let options
let figuras
let material, materialGeom, materialSuelo

// Acciones
init()
loadScene()
loadGUI()
render()

function init() {
    // Motor de render
    renderer = new THREE.WebGLRenderer({
        antialias: true,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    /*******************
     * TO DO: Completar el motor de render y el canvas
     *******************/
    renderer.setPixelRatio(window.devicePixelRatio)
    document.getElementById('container').appendChild(renderer.domElement)

    // Escena
    scene = new THREE.Scene()

    // Camara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0.5, 2, 7)
    /*******************
     * TO DO: Añadir manejador de camara (OrbitControls)
     *******************/
    const orbit = new OrbitControls(camera, renderer.domElement)
    orbit.update()
    camera.lookAt(new THREE.Vector3(0, 1, 0))
}

function loadScene() {
    // Rotación para que los elementos se encuentren en el eje zx
    const rotacion = -Math.PI / 2
    // Lighting the scene
    const ambientLight = new THREE.AmbientLight(0x404040, 6)
    scene.add(ambientLight)

    // Material que da color según la normal
    material = new THREE.MeshNormalMaterial()

    // Material para el suelo
    materialSuelo = new THREE.MeshBasicMaterial({ color: 'yellow', wireframe: true })

    // Material para el pentagono
    materialGeom = new THREE.MeshBasicMaterial({ color: 0x282740 })

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
    figuras = [
        new THREE.OctahedronGeometry(0.7),
        new THREE.CylinderGeometry(0.5, 0.5, 1, 64),
        new THREE.TorusKnotGeometry(10, 3, 64, 8, 15, 3),
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

    // Un pentágono no es más que un círculo con pocos 5 polígonos
    const pentagonoGeom = new THREE.CircleGeometry(radio, 5)
    pentagon = new THREE.Mesh(pentagonoGeom, materialGeom)
    pentagon.translateY = 0.5
    pentagon.rotation.x = rotacion
    pentagon.add(new THREE.AxesHelper(3))
    pentagon.name = 'pentagon'

    // Bucle que itera sobre las figuras para añadir las coordenadas e instanciarlas en el FigureGroup
    for (let i = 0; i < 5; i++) {
        const x = radio * Math.cos(angulos[i])
        const z = radio * Math.sin(angulos[i])
        let figura
        if (i < 4) {
            figura = new THREE.Mesh(figuras[i], material)
            if (i == 2) figura.scale.set(0.05, 0.05, 0.05)
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
        function(gltf) {
            scene.add(gltf.scene)
        },
        undefined,
        function(error) {
            console.error(error)
        }
    )

    /*******************
     * TO DO: Añadir a la escena unos ejes
     *******************/

    scene.add(pentagon)
    scene.add(groupFiguras)
}

function moveFigures() {
    // Bucle que itera sobre las figuras para añadir las coordenadas e instanciarlas en el FigureGroup
    const radio = options.radio
    for (let i = 0; i < 5; i++) {
        const x = radio * Math.cos(angulos[i])
        const z = radio * Math.sin(angulos[i])
        let figura = groupFiguras.children[i]

        figura.position.set(x, 1, z)
    }
    scene.remove(scene.getObjectByName('pentagon'))
    const pentagonoGeom = new THREE.CircleGeometry(radio, 5)
    pentagon = new THREE.Mesh(pentagonoGeom, materialGeom)
    pentagon.translateY = 0.5
    pentagon.rotation.x = -Math.PI / 2
    pentagon.add(new THREE.AxesHelper(3))
    pentagon.name = 'pentagon'
    scene.add(pentagon)
}

function animateFigures() {
    groupFiguras.children.forEach((figura) => {
        const figx = figura.position.x
        const figy = figura.position.y
        const figz = figura.position.z
        new TWEEN.Tween(figura.position)
            .to({ x: [figx, figx], y: [3, figy], z: [figz, figz] }, 2000)
            .interpolation(TWEEN.Interpolation.Bezier)
            .easing(TWEEN.Easing.Bounce.Out)
            .start()
    })
}

// Helper para cambiar entre las animaciones en base al índice en la lista animations
function loadGUI() {
    // Interfaz de usuario
    /*******************
     * TO DO: Crear la interfaz de usuario con la libreria lil-gui.js
     * - Funcion de disparo de animaciones. Las animaciones deben ir
     *   encadenadas
     * - Slider de control de radio del pentagono
     * - Checkbox para alambrico/solido
     *******************/
    gui = new GUI()
    options = {
        mensaje: 'Soy un mensaje',
        radio: 3.0,
        animate: animateFigures,
        speed: 25.0,
        wireframe: false,
    }

    const folder = gui.addFolder('Opciones Rechulonas')
    folder.add(options, 'mensaje').name('Aplicacion')
    folder.add(options, 'radio', 1, 5, 0.1).onChange(moveFigures)
    folder.add(options, 'wireframe').onChange(function(e) {
        groupFiguras.children.forEach((fig) => {
            if (fig.material) fig.material.wireframe = e
        })
    })
    folder.add(options, 'animate')
}

function update(delta) {
    /*******************
     * TO DO: Actualizar tween
     *******************/
    TWEEN.update(delta)
}

function render(delta) {
    requestAnimationFrame(render)
    update(delta)
    renderer.render(scene, camera)
}
