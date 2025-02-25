import { GUI } from '../../lib/lil-gui.module.min.js'
import { FontLoader } from '../../lib/FontLoader.module.js'
import { TextGeometry } from '../../lib/TextGeometry.module.js'
import { GLTFLoader } from '../../lib/GLTFLoader.module.js'
import { Board } from './board.js'
import * as THREE from '../../lib/three.module.js'
import * as SkeletonUtils from '../../lib/SkeletonUtils.min.js'
import { OrbitControls } from '../../lib/OrbitControls.module.js'
import { TWEEN } from '../../lib/tween.module.min.js'
import { createExplosion } from './effects.js'

/** @type {THREE.WebGLRenderer}*/
let renderer

/** @type {THREE.PerspectiveCamera}*/
let camera

/** @type {THREE.Scene}*/
let scene

let userPosition, mousePosition
mousePosition = new THREE.Vector2()

let minesweeper

let raycaster, intersects

let textMine
let mineMesh
let coins = []
let gltfLoader
let buttonMesh

let flagMesh

const BLANK = 0
const MINE = -1

let board = new Board(10)

init()
loadMinesweeper()
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
    scene.background = new THREE.Color('black')

    // Camara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 7, 7)
    /*******************
     * TO DO: Añadir manejador de camara (OrbitControls)
     *******************/
    const orbit = new OrbitControls(camera, renderer.domElement)
    orbit.update()
    camera.lookAt(new THREE.Vector3(0, 1, 0))

    gltfLoader = new GLTFLoader()
    for (let i = 1; i <= 8; i++) {
        loadModel(`../../models/coins/${i}_coin.glb`, coins)
    }

    gltfLoader.load('../../models/sea_mine/mine.glb', (gltf) => {
        mineMesh = gltf.scene.clone()
    })

    gltfLoader.load('../../models/button/button.glb', (gltf) => {
        buttonMesh = gltf.scene.clone()
        buttonMesh.scale.set(0.25, 0.25, 0.25)
        createButtons()
    })

    gltfLoader.load('../../models/flag/flag.glb', (gltf) => {
        flagMesh = SkeletonUtils.clone(gltf.scene)
        flagMesh.scale.set(0.25, 0.25, 0.25)
    })

    const loader = new FontLoader()
    loader.load(
        'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
        function(font) {
            const textGeometry = new TextGeometry('B', {
                font: font,
                size: 0.5,
                height: 0.2,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelSegments: 5,
            })

            const textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
            const textMesh = new THREE.Mesh(textGeometry, textMaterial)
            textMine = textMesh

            board.mines.forEach((tileIndex) => {
                const textClone = textMine.clone()
                const gridPos = transformToGrid(tileIndex.row, tileIndex.col, board.dimension)
                textClone.position.set(gridPos.gridX - 0.25, 0.01, gridPos.gridZ + 0.25)
                textClone.rotateX(-Math.PI / 2)

                scene.add(textClone)
            })
        }
    )

    raycaster = new THREE.Raycaster()
}

function loadMinesweeper() {
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0)
    dirLight.position.set(10, 1, 5)
    dirLight.lookAt(0, 0, 0)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 4096
    dirLight.shadow.mapSize.height = 4096

    const spotLight = new THREE.SpotLight(0xffffff, 3)
    spotLight.position.set(0, 60, -20)
    spotLight.penumbra = 0.9
    spotLight.decay = 2
    spotLight.distance = 200

    spotLight.castShadow = true
    spotLight.shadow.mapSize.width = 128
    spotLight.shadow.mapSize.height = 128

    scene.add(dirLight, spotLight)
    minesweeper = new THREE.Mesh(
        new THREE.BoxGeometry(board.dimension, board.dimension, 1),
        //new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
        new THREE.MeshPhongMaterial({
            roughness: 0.3,
            metalness: 0.5,
            color: 0x2590d1,
            side: THREE.DoubleSide,
        })
    )
    minesweeper.position.y = -0.5

    minesweeper.rotateX(-Math.PI / 2)
    minesweeper.name = 'minesweeper'
    scene.add(minesweeper)

    userPosition = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ color: 0xb3c8cf, side: THREE.DoubleSide })
    )

    userPosition.position.set(0.5, 0.01, 0.5)
    userPosition.rotateX(-Math.PI / 2)
    scene.add(userPosition)

    changePosition(1, 5)

    const grid = new THREE.GridHelper(board.dimension, board.dimension)
    scene.add(grid)
}

function changePosition(row, col) {
    const newPos = transformToGrid(row, col, board.dimension)
    userPosition.position.set(newPos.gridX, 0.01, newPos.gridZ)
}

function transformToGrid(row, col, N) {
    let gridX = -(col - Math.floor(N / 2)) - 0.5
    let gridZ = Math.floor(N / 2) - row - 0.5
    return { gridX, gridZ }
}

function transformToMatrix(x, z, N) {
    const halfN = Math.floor(N / 2)
    let col = halfN - (x + 0.5)
    let row = halfN - 0.5 - z
    return { row, col }
}

function openArea(row, col) {
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i == 0 && j == 0) continue
            const nextRow = row + i
            const nextCol = col + j
            if (nextRow >= board.dimension || nextRow < 0) continue
            if (nextCol >= board.dimension || nextCol < 0) continue
            if (!board.isDiscovered(nextRow, nextCol)) {
                board.showTile(nextRow, nextCol)
                removeButton(nextRow, nextCol)
                const nextVal = board.getTileValue(nextRow, nextCol)
                if (nextVal != -1) {
                    createCoinGrid(nextVal, nextRow, nextCol)
                }

                if (nextVal == 0) {
                    openArea(nextRow, nextCol)
                }
            }
        }
    }
}

function loadModel(modelPath, list) {
    gltfLoader.load(
        modelPath,
        function(gltf) {
            list.push(gltf.scene.clone())
        },
        undefined,
        function(error) {
            console.error(error)
        }
    )
}

function createButtons() {
    for (let row = 0; row < board.dimension; row++) {
        for (let col = 0; col < board.dimension; col++) {
            const gridPos = transformToGrid(row, col, board.dimension)
            const button = buttonMesh.clone()
            button.name = `button-${row}-${col}`
            button.position.set(gridPos.gridX, 0.1, gridPos.gridZ)
            scene.add(button)
        }
    }
}

function removeButton(row, col) {
    const button = scene.getObjectByName(`button-${row}-${col}`)
    scene.remove(button)
}

function createCoinGrid(number, row, col) {
    if (coins.length <= 0) return
    if (number == 0) return
    const coin = coins[number - 1].clone()
    const matrixPos = transformToGrid(row, col, board.dimension)
    coin.position.set(matrixPos.gridX, 0.01, matrixPos.gridZ)
    coin.scale.set(0.125, 0.125, 0.125)
    scene.add(coin)
}

function update() { }

function render() {
    requestAnimationFrame(render)
    update()
    TWEEN.update()
    renderer.render(scene, camera)
}

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})

window.addEventListener('mousemove', function(e) {
    mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1
    mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1

    let prevPosition, prevMatrixPosition, prevBtn, prevBtnLabel

    if (intersects && intersects.length > 0) {
        prevPosition = new THREE.Vector3().copy(intersects[0].point).floor().addScalar(0.5)
        prevMatrixPosition = transformToMatrix(prevPosition.x, prevPosition.z, board.dimension)
        prevBtnLabel = `button-${prevMatrixPosition.row}-${prevMatrixPosition.col}`
        prevBtn = scene.getObjectByName(prevBtnLabel)
    } else prevPosition = undefined

    raycaster.setFromCamera(mousePosition, camera)
    intersects = raycaster.intersectObject(minesweeper)
    if (intersects.length > 0) {
        const intersect = intersects[0]
        const highlightPos = new THREE.Vector3().copy(intersect.point).floor().addScalar(0.5)
        const currMatrixPosition = transformToMatrix(
            highlightPos.x,
            highlightPos.z,
            board.dimension
        )
        const currBtnLabel = `button-${currMatrixPosition.row}-${currMatrixPosition.col}`
        const currBtn = scene.getObjectByName(currBtnLabel)
        if (currBtn) {
            document.body.style.cursor = 'pointer'
            currBtn.position.set(highlightPos.x, 0.07, highlightPos.z)
        } else {
            document.body.style.cursor = 'default'
        }
        if (prevPosition && currBtnLabel !== prevBtnLabel) {
            if (prevBtn) prevBtn.position.set(prevPosition.x, 0.1, prevPosition.z)
        }
        userPosition.position.set(highlightPos.x, 0.01, highlightPos.z)
    } else {
        document.body.style.cursor = 'default'
        if (prevPosition) {
            if (prevBtn) prevBtn.position.set(prevPosition.x, 0.1, prevPosition.z)
        }
    }
})

window.addEventListener('mousedown', (event) => {
    if (event.button === 2) {
        event.preventDefault()
        const matrixPos = transformToMatrix(
            userPosition.position.x,
            userPosition.position.z,
            board.dimension
        )
        if (intersects.length > 0) {
            if (!board.isMarked(matrixPos.row, matrixPos.col)) {
                board.toggleMarkTile(matrixPos.row, matrixPos.col)
                removeButton(matrixPos.row, matrixPos.col)
                const flag = SkeletonUtils.clone(flagMesh)
                flag.name = `flag-${matrixPos.row}-${matrixPos.col}`
                flag.position.copy(userPosition.position)
                flag.rotateY(0.25)
                scene.add(flag)
            } else {
                board.toggleMarkTile(matrixPos.row, matrixPos.col)
                const flag = scene.getObjectByName(`flag-${matrixPos.row}-${matrixPos.col}`)
                scene.remove(flag)

                const button = buttonMesh.clone()
                button.name = `button-${matrixPos.row}-${matrixPos.col}`
                button.position.set(userPosition.x, 0.1, userPosition.z)
                scene.add(button)
            }
        }
    }
})

window.addEventListener('dblclick', () => {
    const matrixPos = transformToMatrix(
        userPosition.position.x,
        userPosition.position.z,
        board.dimension
    )
    if (intersects.length > 0) {
        document.body.style.cursor = 'default'
        if (
            board.isDiscovered(matrixPos.row, matrixPos.col) ||
            board.isMarked(matrixPos.row, matrixPos.col)
        )
            return
        const curVal = board.getTileValue(matrixPos.row, matrixPos.col)

        removeButton(matrixPos.row, matrixPos.col)

        switch (curVal) {
            case BLANK:
                openArea(matrixPos.row, matrixPos.col)
                break

            case MINE: {
                const mine = mineMesh.clone()
                mine.position.copy(userPosition.position)
                mine.position.y = 0.8
                mine.scale.set(0.3, 0.3, 0.3)
                createExplosion(userPosition.position.clone(), scene)
                scene.add(mine)

                board.showTile(matrixPos.row, matrixPos.col)
                break
            }
            default:
                createCoinGrid(curVal, matrixPos.row, matrixPos.col)
                board.showTile(matrixPos.row, matrixPos.col)
                break
        }
    }
    console.log(scene.children.length)
})
