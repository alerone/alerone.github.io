import * as THREE from '../../lib/three.module.js'
import { TWEEN } from '../../lib/tween.module.min.js'
// Función para crear la explosión en una posición dada (THREE.Vector3)
export function createExplosion(position, scene) {
    const particleCount = 500
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const velocities = []

    // Inicializamos cada partícula en la posición de la explosión
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = position.x
        positions[i * 3 + 1] = position.y
        positions[i * 3 + 2] = position.z

        // Velocidad aleatoria para cada partícula
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        )
        velocities.push(velocity)

        const green = Math.floor(Math.random() * (255 - 165 + 1)) + 165
        colors[i * 3] = 1
        colors[i * 3 + 1] = green / 255
        colors[i * 3 + 2] = 0
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const material = new THREE.PointsMaterial({
        vertexColors: true,
        size: 0.3,
        transparent: true,
        opacity: 1,
    })
    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    // Creamos un objeto que contendrá el progreso de la explosión (de 0 a 1)
    const tweenObj = { progress: 0 }

    // Creamos el TWEEN para animar el progreso en 1000 ms
    new TWEEN.Tween(tweenObj)
        .to({ progress: 1 }, 2000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
            // Actualizamos la posición de cada partícula
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] = position.x + velocities[i].x * tweenObj.progress * 10
                positions[i * 3 + 1] = position.y + velocities[i].y * tweenObj.progress * 10
                positions[i * 3 + 2] = position.z + velocities[i].z * tweenObj.progress * 10
            }
            geometry.attributes.position.needsUpdate = true
            // Se desvanece la opacidad a medida que progresa la explosión
            material.opacity = 1 - tweenObj.progress
        })
        .onComplete(() => {
            // Al finalizar, removemos el sistema de partículas de la escena
            scene.remove(particles)
        })
        .start()
}
