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
import { Menu } from './menu.js'

/** @type {THREE.WebGLRenderer}*/
let renderer
/**@type {THREE.Scene}*/
let scene
/**@type {THREE.PerspectiveCamera}*/
let camera
/**@type {THREE.Raycaster} */
let raycaster

/**@type {THREE.Mesh} */
let rocketSweeperBase

let boardMaterial

let rocketSweeper, userPosition
let intersects
let mousePosition = { x: 0, y: 0 }

let board = new Board(10)
let game = new Game()

const menu = new Menu(game, board)

let score
let rocketCount

let textRocket
let textLost
let textWin

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

    boardMaterial = new THREE.MeshPhongMaterial({
        roughness: 0.3,
        metalness: 0.5,
        color: 0x2590d1,
        side: THREE.DoubleSide,
    })

    rocketSweeperBase = new THREE.Mesh(
        new THREE.BoxGeometry(board.dimension, board.dimension, 1),
        boardMaterial
    )
    rocketSweeperBase.geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
    rocketSweeperBase.position.y = -0.5

    scene.add(rocketSweeperBase)

    initBoardView()

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
    let addX = 0.5
    let addZ = 0.5
    if (N % 2 != 0) {
        addX = 1
        addZ = 0
    }
    let x = col - Math.round(N / 2) + addX
    let z = Math.round(N / 2) - row - 1 + addZ
    z = -z
    return { x, z }
}

function transformToMatrix(x, z, N) {
    const M = Math.floor(N / 2)
    const col = x + M - 0.5
    const row = z + M - 0.5
    return { row, col }
}

function restart() {
    board = new Board(board.dimension, board.difficulty, board.creative)
    game = new Game()
}

/**
 * This function initializes the board, the game, clears the rocketSweeper
 * creates the rocketSweeper obj (the one is intersected), the grid, the userPosition
 * and adds all to the rocketSweeperBase
 * */
function initBoardView() {
    if (!menu.isShowingMenu()) {
        board = new Board(board.dimension, board.difficulty, board.creative)
        game = new Game()
        menu.reset(board, game)
    }

    rocketSweeperBase.clear()
    rocketSweeper = new THREE.Mesh(
        new THREE.PlaneGeometry(board.dimension, board.dimension),
        boardMaterial
    )
    rocketSweeper.rotateX(-Math.PI / 2)
    rocketSweeper.position.y = 0.5
    rocketSweeper.name = 'rocketsweeper'

    const grid = new THREE.GridHelper(board.dimension, board.dimension)
    grid.position.y = 0.51

    userPosition = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshPhongMaterial({ color: 0xb3c8cf, side: THREE.DoubleSide })
    )
    userPosition.position.addScalar(0.5)
    userPosition.position.y = 0.01
    userPosition.rotateX(-Math.PI / 2)

    rocketSweeperBase.add(rocketSweeper)
    addToBoard(userPosition, userPosition.position.clone())
    rocketSweeperBase.add(grid)

    if (buttonMesh) createButtons()
}

function win() {
    game.win()

    const video = document.createElement('video')
    video.src = './videos/laugh1.mp4'
    video.load()
    video.muted = true
    video.loop = true
    const texvideo = new THREE.VideoTexture(video)
    const pantalla = new THREE.Mesh(
        new THREE.PlaneGeometry(board.dimension, 6, 4, 4),
        new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: texvideo })
    )

    setTimeout(() => {
        video.play()
        addToBoard(pantalla, new THREE.Vector3(0, 5.0, 0))
    }, 2500)
    const textObj = showText(textWin)
    moveCamera(new THREE.Vector3(0, 5, 12), new THREE.Vector3(0, 5, 0))
    setTimeout(() => {
        rocketSweeperBase.remove(pantalla)
        rocketSweeperBase.remove(textObj)
        initBoardView()
        menu.showMenu()
        moveCamera(new THREE.Vector3(0, 7, 7), new THREE.Vector3(0, 1, 0), 1000)
    }, 5000)
}

function lose() {
    game.lose()

    const video = document.createElement('video')
    video.src = './videos/laugh1.mp4'
    video.load()
    video.muted = true
    video.loop = true
    const texvideo = new THREE.VideoTexture(video)
    const pantalla = new THREE.Mesh(
        new THREE.PlaneGeometry(board.dimension, 6, 4, 4),
        new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: texvideo })
    )

    setTimeout(() => {
        video.play()
        addToBoard(pantalla, new THREE.Vector3(0, 5.0, 0))
    }, 2000)
    const textObj = showText(textLost)
    moveCamera(new THREE.Vector3(0, 5, 12), new THREE.Vector3(0, 5, 0))
    setTimeout(() => {
        rocketSweeperBase.remove(pantalla)
        rocketSweeperBase.remove(textObj)
        initBoardView()
        menu.showMenu()
        moveCamera(new THREE.Vector3(0, 7, 7), new THREE.Vector3(0, 1, 0), 2000)
    }, 5000)
}

/**
 * @param {THREE.Mesh} text
 * */
function showText(text) {
    const lastPosition = text.position
    const textAux = text.clone()
    addToBoard(textAux, new THREE.Vector3(0, 10, 0))
    const textAnimation = new TWEEN.Tween(textAux.position)
        .to({ x: lastPosition.x, y: lastPosition.y, z: lastPosition.z }, 3000)
        .easing(TWEEN.Easing.Bounce.Out)

    textAnimation.start()
    return textAux
}

/**
 * Move the camera to a position and look to another position
 * @param {THREE.Vector3} moveTo
 * @param {THREE.Vector3} lookAt
 * */
function moveCamera(moveTo, lookAt, duration) {
    const moveAnim = new TWEEN.Tween(camera.position)
        .to({ x: moveTo.x, y: moveTo.y, z: moveTo.z }, duration)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
            camera.lookAt(lookAt)
        })
    moveAnim.start()
}

function updatePoints() {
    const newPoints = game.points
    score.innerText = 'Puntos: ' + newPoints
}

function showMines() {
    if (!board.creative) return
    board.mines.forEach((mine) => {
        const textClone = textRocket.clone()
        const gridPos = transformToGrid(mine.row, mine.col, board.dimension)
        textClone.position.set(gridPos.x - 0.25, 0.01, gridPos.z + 0.25)
        textClone.rotateX(-Math.PI / 2)

        addToBoard(textClone, textClone.position.clone())
        removeButton(mine.row, mine.col)
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
            if (!board.isDiscovered(nextRow, nextCol) && !board.isMarked(nextRow, nextCol)) {
                board.discoverTile(nextRow, nextCol)
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

function openSurrounding(row, col) {
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const nextRow = row + i
            const nextCol = col + j
            if (nextRow >= board.dimension || nextRow < 0) continue
            if (nextCol >= board.dimension || nextCol < 0) continue

            const condition =
                !board.isDiscovered(nextRow, nextCol) && !board.isMarked(nextRow, nextCol)
            console.log('tile', nextRow, nextCol, board.isMarked(nextRow, nextCol))
            if (condition) {
                if (discoverTile(nextRow, nextCol) == 'mine') return
            }
        }
    }
}

function discoverTile(row, col) {
    const currVal = board.getTileValue(row, col)
    switch (currVal) {
        case BLANK:
            openArea(row, col)
            break

        case MINE: {
            discoveredARocket(row, col)
            return 'mine'
        }
        default:
            createCoinGrid(currVal, row, col, 0)
            board.discoverTile(row, col)
            removeButton(row, col)
            break
    }
    if (board.hasWon()) win()
    return ''
}

function discoveredARocket(row, col) {
    const currPosition = transformToGrid(row, col, board.dimension)
    createRocket(new THREE.Vector3(currPosition.x, 0, currPosition.z))
    board.discoverTile(row, col)
    removeButton(row, col)
    lose()
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
            const textGeometry = new TextGeometry('R', {
                font: font,
                size: 0.5,
                height: 0.2,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelSegments: 5,
            })

            const endTextSize = 1
            const labelWin = 'Has Ganado!'
            const labelLost = 'Has Perdido!'

            const lostGeom = new TextGeometry(labelLost, {
                font: font,
                size: endTextSize,
                height: 0.2,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelSegments: 5,
            })

            const winGeom = new TextGeometry(labelWin, {
                font: font,
                size: endTextSize,
                height: 0.2,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelSegments: 5,
            })

            const textRed = new THREE.MeshPhongMaterial({ color: 0xff0000 })
            const textGreen = new THREE.MeshPhongMaterial({ color: 0x00ff00 })

            textLost = new THREE.Mesh(lostGeom, textRed)
            textLost.position.x -= (endTextSize * labelLost.length) / 2 - 2
            textLost.position.y = 4
            textLost.position.z += 1.5

            textWin = new THREE.Mesh(winGeom, textGreen)
            textWin.position.x -= (endTextSize * labelWin.length) / 2 - 1.5
            textWin.position.y = 4
            textWin.position.z += 1.5

            textRocket = new THREE.Mesh(textGeometry, textRed)
        }
    )
}

function resizeWindow() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

function dblClick() {
    if (!game.canPlay()) return
    if (intersects.length <= 0) return
    const matrixPos = transformToMatrix(
        userPosition.position.x,
        userPosition.position.z,
        board.dimension
    )
    if (currTileDisOrMarked(matrixPos)) return
    if (!tryStartPlaying(matrixPos)) return
    document.body.style.cursor = 'default'

    discoverTile(matrixPos.row, matrixPos.col)

    removeButton(matrixPos.row, matrixPos.col)
}

function currTileDisOrMarked(mtrxPosition) {
    return (
        board.isDiscovered(mtrxPosition.row, mtrxPosition.col) ||
        board.isMarked(mtrxPosition.row, mtrxPosition.col)
    )
}

function tryStartPlaying(mtrxPosition) {
    if (!game.canPlay()) return false
    let curVal = board.getTileValue(mtrxPosition.row, mtrxPosition.col)
    while (!game.isPlaying()) {
        curVal = board.getTileValue(mtrxPosition.row, mtrxPosition.col)
        if (curVal != BLANK) {
            restart()
        } else {
            game.startPlaying()
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
        const button = scene.getObjectByName(`button-${matrixPos.row}-${matrixPos.col}`)
        const flag = scene.getObjectByName(`flag-${matrixPos.row}-${matrixPos.col}`)
        if (button || flag) toggleFlag(matrixPos)
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
    rocketCount.innerText = 'Explosivos: ' + board.getGameRockets()
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
        const currIsMine = board.isMine(currMatrixPosition.row, currMatrixPosition.col)
        const currBtn = rocketSweeperBase.getObjectByName(currBtnLabel)
        if (currBtn) {
            document.body.style.cursor = game.canPlay() ? 'pointer' : 'default'
            hoverBtn(true, currBtn)
        } else if (board.creative && currIsMine) {
            document.body.style.cursor = game.canPlay() ? 'pointer' : 'default'
        } else document.body.style.cursor = e.ctrlKey ? 'pointer' : 'default'
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

function cntrlClick(event) {
    if (!event.ctrlKey) return
    if (!game.canPlay()) return
    if (!intersects && intersects.length <= 0) return
    const currPosition = userPosition.position.clone()
    const matrixPos = transformToMatrix(currPosition.x, currPosition.z, board.dimension)
    openSurrounding(matrixPos.row, matrixPos.col, currPosition)
}

window.addEventListener('resize', resizeWindow)
window.addEventListener('mousemove', moveOnBoard)
window.addEventListener('dblclick', dblClick)
window.addEventListener('mousedown', rightMouseDown)
window.addEventListener('click', cntrlClick)
