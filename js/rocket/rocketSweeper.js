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
import { Game } from './game.js'

let renderer, scene, camera, raycaster
let rocketSweeper, rocketSweeperBase, userPosition
let intersects
let mousePosition = { x: 0, y: 0 }

let board = new Board(10)
let game = new Game()

let score
let rocketCount

let textRocket

let rocketMesh
let coinMeshes = []
let gltfLoader
let buttonMesh
let flagMesh

const BLANK = 0
const MINE = -1

init()
load()

render()

function init() {
    // Motor de render
    renderer = new THREE.WebGLRenderer({
        antialias: true,
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)

    document.getElementById('container').appendChild(renderer.domElement)
    score = document.querySelector('#score')
    rocketCount = document.getElementById('explosivos')
    rocketCount.innerText = 'Explosivos: ' + board.nMines
    // Escena
    scene = new THREE.Scene()
    scene.background = new THREE.Color('black')

    // Camara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 7, 7)

    const orbit = new OrbitControls(camera, renderer.domElement)
    orbit.update()
    camera.lookAt(new THREE.Vector3(0, 1, 0))

    raycaster = new THREE.Raycaster()
}

function load() {
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0)
    dirLight.position.set(0, 3, 1)
    dirLight.lookAt(0, 0, 0)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 4096
    dirLight.shadow.mapSize.height = 4096

    scene.add(dirLight)
    const boardMaterial = new THREE.MeshPhongMaterial({
        roughness: 0.3,
        metalness: 0.5,
        color: 0x2590d1,
        side: THREE.DoubleSide,
    })
    rocketSweeper = new THREE.Mesh(
        new THREE.PlaneGeometry(board.dimension, board.dimension),
        boardMaterial
        //new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
    )
    rocketSweeper.rotateX(-Math.PI / 2)
    rocketSweeper.position.y = 0.5
    rocketSweeper.name = 'rocketsweeper'

    rocketSweeperBase = new THREE.Mesh(
        new THREE.BoxGeometry(board.dimension, board.dimension, 1),
        boardMaterial
    )
    rocketSweeperBase.geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
    rocketSweeperBase.position.y = -0.5

    userPosition = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ color: 0xb3c8cf, side: THREE.DoubleSide })
    )

    const grid = new THREE.GridHelper(board.dimension, board.dimension)
    grid.position.y = 0.51

    rocketSweeperBase.add(rocketSweeper)
    userPosition.position.addScalar(0.5)
    userPosition.position.y = 0.01
    userPosition.rotateX(-Math.PI / 2)
    addToBoard(userPosition, userPosition.position.clone())
    rocketSweeperBase.add(grid)
    scene.add(rocketSweeperBase)

    loadModels()
    loadFonts()
}

function update(delta) {
    TWEEN.update(delta)
}

function render(delta) {
    requestAnimationFrame(render)
    update(delta)
    renderer.render(scene, camera)
}

function addToBoard(figure, position) {
    figure.position.set(position.x, position.y + 0.5, position.z)
    rocketSweeperBase.add(figure)
}

function transformToGrid(row, col, N) {
    let x = col - Math.floor(N / 2) + 0.5
    let z = Math.floor(N / 2) - row - 1 + 0.5
    z = -z
    return { x, z }
}

function transformToMatrix(x, z, N) {
    const M = Math.floor(N / 2)
    const col = x + M - 0.5
    const row = z + M - 0.5
    return { row, col }
}

function restart(dimension) {
    board = new Board(dimension)
    game = new Game()
}

function lose() {
    game.lose()
}

function updatePoints() {
    const newPoints = game.points
    score.innerText = 'Puntos: ' + newPoints
}

function showMines() {
    board.mines.forEach((mine) => {
        const textClone = textRocket.clone()
        const gridPos = transformToGrid(mine.row, mine.col, board.dimension)
        textClone.position.set(gridPos.x - 0.25, 0.01, gridPos.z + 0.25)
        textClone.rotateX(-Math.PI / 2)

        addToBoard(textClone, textClone.position.clone())
    })
}

function createButtons() {
    for (let row = 0; row < board.dimension; row++) {
        for (let col = 0; col < board.dimension; col++) {
            createButton(row, col)
        }
    }
}

function createButton(row, col) {
    const gridPos = transformToGrid(row, col, board.dimension)
    const button = buttonMesh.clone()
    button.name = `button-${row}-${col}`
    button.position.set(gridPos.x, 0.1, gridPos.z)
    addToBoard(button, button.position.clone())
}

function removeButton(row, col) {
    const button = scene.getObjectByName(`button-${row}-${col}`)
    rocketSweeperBase.remove(button)
}

function createCoinGrid(number, row, col, delay) {
    if (coinMeshes.length <= 0) return
    if (number == BLANK) return
    const coin = coinMeshes[number - 1].clone()
    const matrixPos = transformToGrid(row, col, board.dimension)
    coin.scale.set(0.125, 0.125, 0.125)
    coin.position.set(matrixPos.x, 0.51, matrixPos.z)
    setTimeout(() => {
        rocketSweeperBase.add(coin)
    }, delay)
    animateCoin(coin, delay)
    game.addPoints(number * 10)
    updatePoints()
}

function animateCoin(coin, delay) {
    const duration = 500
    console.log(coin.position)
    const positionTween = new TWEEN.Tween(coin.position)
        .to({ y: 1.5 }, duration) // Move up 3 units over 1 second
        .easing(TWEEN.Easing.Quadratic.Out)
        .delay(delay)
        .onComplete(() => {
            // After reaching the peak, fall back down
            new TWEEN.Tween(coin.position)
                .to({ y: 0.51 }, duration)
                .easing(TWEEN.Easing.Quadratic.In)
                .start()
        })

    // Create tween for rotation
    const rotationTween = new TWEEN.Tween(coin.rotation)
        .to({ x: Math.PI * 4 }, duration * 2) // Rotate 720 degrees (4π) over 2 seconds
        .delay(delay)
        .easing(TWEEN.Easing.Linear.None)

    // Start both tweens simultaneously
    positionTween.start()
    rotationTween.start()
}

function createRocket(position) {
    const rocket = rocketMesh.clone()
    rocket.position.copy(position)
    rocket.position.y = 5
    rocket.rotateY(-Math.PI / 2)
    rocket.scale.set(0.3, 0.3, 0.3)
    addToBoard(rocket, rocket.position.clone())
    new TWEEN.Tween(rocket.position)
        .to({ x: position.x, y: 0.5, z: position.z }, 500)
        .easing(TWEEN.Easing.Linear.None)
        .onComplete(() => {
            rocketSweeperBase.remove(rocket)
            createExplosion(position.clone(), scene)
        })
        .start()
}

function openArea(row, col) {
    let delay = 0
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
                if (nextVal != MINE) {
                    createCoinGrid(nextVal, nextRow, nextCol, delay)
                    delay += 100
                }

                if (nextVal == BLANK) {
                    openArea(nextRow, nextCol)
                }
            }
        }
    }
}

function loadModels() {
    gltfLoader = new GLTFLoader()
    for (let i = 1; i <= 8; i++) {
        loadModel(`../../models/coins/${i}_coin.glb`, coinMeshes)
    }

    gltfLoader.load('../../models/Rocket/rocket.glb', (gltf) => {
        rocketMesh = gltf.scene.clone()
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
}

function loadModel(modelPath, list) {
    gltfLoader.load(
        modelPath,
        function (gltf) {
            list.push(gltf.scene.clone())
        },
        undefined,
        function (error) {
            console.error(error)
        }
    )
}
function loadFonts() {
    const loader = new FontLoader()
    loader.load(
        'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
        function (font) {
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
            textRocket = textMesh
        }
    )
}

function resizeWindow() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

function dblClick() {
    if (intersects.length <= 0) return
    const matrixPos = transformToMatrix(
        userPosition.position.x,
        userPosition.position.z,
        board.dimension
    )
    if (currTileDisOrMarked(matrixPos)) return
    console.log(game)
    if (!canStartPlaying(matrixPos)) return
    const curVal = board.getTileValue(matrixPos.row, matrixPos.col)
    document.body.style.cursor = 'default'

    removeButton(matrixPos.row, matrixPos.col)

    switch (curVal) {
        case BLANK:
            openArea(matrixPos.row, matrixPos.col)
            break

        case MINE: {
            createRocket(userPosition.position)
            board.showTile(matrixPos.row, matrixPos.col)
            lose()
            break
        }
        default:
            createCoinGrid(curVal, matrixPos.row, matrixPos.col, 0)
            board.showTile(matrixPos.row, matrixPos.col)
            break
    }
    console.log(scene.children.length)
}

function currTileDisOrMarked(mtrxPosition) {
    return (
        board.isDiscovered(mtrxPosition.row, mtrxPosition.col) ||
        board.isMarked(mtrxPosition.row, mtrxPosition.col)
    )
}

function canStartPlaying(mtrxPosition) {
    if (game.end != '') return false
    let curVal = board.getTileValue(mtrxPosition.row, mtrxPosition.col)
    while (!game.isPlaying()) {
        curVal = board.getTileValue(mtrxPosition.row, mtrxPosition.col)
        if (curVal != BLANK) {
            restart(board.dimension)
        } else {
            game.start()
            showMines()
        }
    }

    rocketCount.innerText = 'Explosivos: ' + board.nMines
    return true
}

function rightMouseDown(event) {
    if (!game.isPlaying()) return
    if (intersects.length <= 0) return
    if (event.button == 2) {
        event.preventDefault()
        const matrixPos = transformToMatrix(
            userPosition.position.x,
            userPosition.position.z,
            board.dimension
        )
        toggleFlag(matrixPos)
    }
}

function toggleFlag(mtrxPosition) {
    if (!board.isMarked(mtrxPosition.row, mtrxPosition.col)) {
        removeButton(mtrxPosition.row, mtrxPosition.col)
        createFlag(mtrxPosition)
    } else {
        removeFlag(mtrxPosition)
        createButton(mtrxPosition.row, mtrxPosition.col)
    }
    board.toggleMarkTile(mtrxPosition.row, mtrxPosition.col)
}

function createFlag(mtrxPosition) {
    const flag = SkeletonUtils.clone(flagMesh)
    flag.name = `flag-${mtrxPosition.row}-${mtrxPosition.col}`
    flag.rotateY(0.25)
    const flagPos = userPosition.position.clone()
    addToBoard(flag, new THREE.Vector3(flagPos.x, 0.01, flagPos.z))
}
function removeFlag(mtrxPosition) {
    const flag = scene.getObjectByName(`flag-${mtrxPosition.row}-${mtrxPosition.col}`)
    rocketSweeperBase.remove(flag)
}

function moveOnBoard(e) {
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
    intersects = raycaster.intersectObject(rocketSweeper)
    if (intersects.length > 0) {
        const intersect = intersects[0]
        const highlightPos = new THREE.Vector3().copy(intersect.point).floor().addScalar(0.5)
        const currMatrixPosition = transformToMatrix(
            highlightPos.x,
            highlightPos.z,
            board.dimension
        )

        userPosition.position.set(highlightPos.x, 0.51, highlightPos.z)
        const currBtnLabel = `button-${currMatrixPosition.row}-${currMatrixPosition.col}`
        const currBtn = rocketSweeperBase.getObjectByName(currBtnLabel)
        if (currBtn) {
            document.body.style.cursor = 'pointer'
            hoverBtn(true, currBtn)
        } else {
            document.body.style.cursor = 'default'
        }
        if (prevBtn && currBtnLabel !== prevBtnLabel) {
            hoverBtn(false, prevBtn)
        }
    } else {
        document.body.style.cursor = 'default'
        if (prevPosition && prevBtn) {
            hoverBtn(false, prevBtn)
        }
    }
}

function hoverBtn(isHovering, btn) {
    const nextY = isHovering ? 0.57 : 0.6
    btn.position.y = nextY
}

window.addEventListener('resize', resizeWindow)
window.addEventListener('mousemove', moveOnBoard)
window.addEventListener('dblclick', dblClick)
window.addEventListener('mousedown', rightMouseDown)
