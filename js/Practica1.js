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
    camera.position.set(0.5, 10, 7)
    camera.lookAt(new THREE.Vector3(0, 1, 1))
}

function loadScene() {
    const material = new THREE.MeshNormalMaterial()
    const materialSuelo = new THREE.MeshBasicMaterial({ color: 'yellow', wireframe: true })
    const materialGeom = new THREE.MeshBasicMaterial({ color: 'blue', wireframe: true })

    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), materialSuelo)
    suelo.rotation.x = -Math.PI / 2
    scene.add(suelo)

    const figuras = [
        new THREE.RingGeometry(0.5, 1, 4),
        new THREE.CylinderGeometry(0.5, 0.5, 1, 32),
        new THREE.SphereGeometry(0.5, 20, 20),
        new THREE.ConeGeometry(2, 0.5, 0.5),
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
    ]

    const radius = 5
    const angulos = [0, Math.PI / 2.5, Math.PI, (3 * Math.PI) / 2.5, 2 * Math.PI]

    const pentagonoGeom = new THREE.CircleGeometry(radius, 5)
    const pentagon = new THREE.Mesh(pentagonoGeom, materialGeom)
    pentagon.translateY = 0.5
    pentagon.rotation.x = -Math.PI / 2
    scene.add(pentagon)

    for (let i = 0; i < 5; i++) {
        const x = radius * Math.cos(angulos[i])
        const z = radius * Math.sin(angulos[i])

        const figura = new THREE.Mesh(figuras[i], material)
        figura.position.set(x, 1, z)

        scene.add(figura)
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
}

function update() {
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
