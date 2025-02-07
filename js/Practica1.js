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
    const material = new THREE.MeshNormalMaterial()
    const materialSuelo = new THREE.MeshBasicMaterial({ color: 'yellow', wireframe: true })
    const materialGeom = new THREE.MeshBasicMaterial({ color: 0x282740 })
    const rotacion = -Math.PI / 2

    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), materialSuelo)
    suelo.rotation.x = rotacion
    scene.add(suelo)

    const figuras = [
        new THREE.OctahedronGeometry(0.7),
        new THREE.CylinderGeometry(0.5, 0.5, 1, 64),
        new THREE.SphereGeometry(0.5, 20, 20),
        new THREE.ConeGeometry(1, 1, 64),
        new THREE.BoxGeometry(1, 1, 1),
    ]

    const radius = 3; // Reducido para que entren bien en la escena
    const angulos = [0, (2 * Math.PI) / 5, (4 * Math.PI) / 5, (6 * Math.PI) / 5, (8 * Math.PI) / 5];

    const pentagonoGeom = new THREE.CircleGeometry(radius, 5)
    pentagon = new THREE.Mesh(pentagonoGeom, materialGeom)
    pentagon.translateY = 0.5
    pentagon.rotation.x = rotacion
    scene.add(pentagon)


    for (let i = 0; i < 5; i++) {
        const x = radius * Math.cos(angulos[i])
        const z = radius * Math.sin(angulos[i])

        const figura = new THREE.Mesh(figuras[i], material)
        figura.position.set(x, 1, z)

        groupFiguras.add(figura)
    }
    /*******************
     * TO DO: Construir una escena con 5 figuras diferentes posicionadas
     * en los cinco vertices de un pentagono regular alredor del origen
     *******************/
    /*******************
     * TO DO: Añadir a la escena un modelo importado en el centro del pentagono
     *******************/
    /*******************
     * TO DO: Añadir a la escena unos ejes
     *******************/
    scene.add(groupFiguras)
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
