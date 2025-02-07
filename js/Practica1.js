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
import { GLTFLoader } from '../lib/GLTFLoader.module.js'
import * as THREE from '../lib/three.module.js'
//import {GLTFLoader} from "../lib/GLTFLoader.module.js";

// Variables de consenso
let renderer, scene, camera

// Otras globales
/*******************
 * TO DO: Variables globales de la aplicacion
 *******************/
let pentagon
let groupFiguras = new THREE.Object3D()
let isGoingUp = false
let elevation = 0
let mixer, animations, activeAction

// Acciones
init()
loadScene()
render()

function init() {
    // Motor de render
    renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.getElementById('container').appendChild(renderer.domElement)

    // Escena
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0.5, 0.5, 0.5)

    // Camara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0.5, 5, 7)
    camera.lookAt(new THREE.Vector3(0, 1, 1))
}

function loadScene() {
    const ambientLight = new THREE.AmbientLight(0x404040, 6)
    scene.add(ambientLight)
    const material = new THREE.MeshNormalMaterial()
    const materialSuelo = new THREE.MeshBasicMaterial({ color: 'yellow', wireframe: true })
    const materialGeom = new THREE.MeshBasicMaterial({ color: 0x282740 })
    var textura = new THREE.TextureLoader().load('../images/Earth.jpg')
    console.log(textura)
    var earthMaterial = new THREE.MeshLambertMaterial({
        map: textura,
        side: THREE.DoubleSide,
    })
    const rotacion = -Math.PI / 2

    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), materialSuelo)
    suelo.rotation.x = rotacion
    scene.add(suelo)
    const glloader = new GLTFLoader()
    const figuras = [
        new THREE.OctahedronGeometry(0.7),
        new THREE.CylinderGeometry(0.5, 0.5, 1, 64),
        new THREE.ConeGeometry(1, 1, 64),
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.SphereGeometry(0.5, 20, 20),
    ]

    const radius = 3 // Reducido para que entren bien en la escena
    const angulos = [0, (2 * Math.PI) / 5, (4 * Math.PI) / 5, (6 * Math.PI) / 5, (8 * Math.PI) / 5]

    const pentagonoGeom = new THREE.CircleGeometry(radius, 5)
    pentagon = new THREE.Mesh(pentagonoGeom, materialGeom)
    pentagon.translateY = 0.5
    pentagon.rotation.x = rotacion
    pentagon.add(new THREE.AxesHelper(3))

    for (let i = 0; i < 5; i++) {
        const x = radius * Math.cos(angulos[i])
        const z = radius * Math.sin(angulos[i])
        let figura
        if (i < 4) {
            figura = new THREE.Mesh(figuras[i], material)
        } else {
            figura = new THREE.Mesh(figuras[i], earthMaterial)
        }
        figura.position.set(x, 1, z)
        figura.add(new THREE.AxesHelper(2))
        groupFiguras.add(figura)
    }
    /*******************
     * TO DO: Añadir a la escena un modelo importado en el centro del pentagono
     *******************/

    glloader.load(
        'models/giornoAnimations.glb',
        function(gltf) {
            //glloader.load( 'models/robota/scene.gltf', function ( gltf ) {
            scene.add(gltf.scene)
            console.log('giorno doing a backflip!')
            console.log(gltf)
            mixer = new THREE.AnimationMixer(gltf.scene)

            animations = gltf.animations
            if (animations.length > 0) {
                activeAction = mixer.clipAction(animations[1])

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
    const speed = 0.003
    pentagon.rotation.z += speed
    groupFiguras.rotation.y += speed
    let figs = groupFiguras.children

    for (let i = 0; i < figs.length; i++) {
        const fig = figs[i]
        if (isGoingUp) {
            fig.translateZ(speed)
            elevation += speed
            if (elevation >= 1) {
                isGoingUp = false
            }
        } else {
            fig.translateZ(-speed)
            elevation -= speed
            if (elevation >= 0) {
                isGoingUp = true
            }
        }
        fig.rotation.x += speed
    }
    //camera.translateY(0.0005)

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
