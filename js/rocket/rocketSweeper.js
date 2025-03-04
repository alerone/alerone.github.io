import { GUI } from '../../lib/lil-gui.module.min.js'
import { RGBELoader } from '../../lib/RGBELoader.min.js'
import { MatrixCoords } from './matrixCoords.js'
import { FontLoader } from '../../lib/FontLoader.module.js'
import { TextGeometry } from '../../lib/TextGeometry.module.js'
import { GLTFLoader } from '../../lib/GLTFLoader.module.js'
import { Board } from './board.js'
import * as THREE from '../../lib/three.module.js'
import { OrbitControls } from '../../lib/OrbitControls.module.js'
import { TWEEN } from '../../lib/tween.module.min.js'
import { Game } from './game.js'
import { Menu } from './menu.js'
import { BoardView } from './boardView.js'

/** @type {THREE.WebGLRenderer}*/
let renderer
/**@type {THREE.Scene}*/
let scene
/**@type {THREE.PerspectiveCamera}*/
let camera

/**@type {OrbitControls}*/
let orbit

let gui

let userPosition
let intersects
let mousePosition = { x: 0, y: 0 }

let board = new Board(10)
let game = new Game()

/**@type {BoardView}*/
let boardView
let table
let tableBox

let flagMeshes = new Map()
let flagBase

const menu = new Menu(game, board)

let scoreLabel
let rocketCountLabel

let textLostMesh
let textWinMesh

let gltfLoader

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
    renderer.shadowMap.enabled = true

    document.getElementById('container').appendChild(renderer.domElement)
    scoreLabel = document.querySelector('#score')
    rocketCountLabel = document.getElementById('explosivos')
    rocketCountLabel.innerText = 'Explosivos: ' + board.nRockets
    // Escena
    scene = new THREE.Scene()

    // Camara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 7, 7)
}

function load() {
    setLights()

    userPosition = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshPhongMaterial({ color: 0xb3c8cf, side: THREE.DoubleSide })
    )
    userPosition.position.addScalar(0.5)
    userPosition.position.y = 0.01
    userPosition.rotateX(-Math.PI / 2)

    loadModels()
    loadFonts()
    loadGUI()
    loadBackground()
    createMoon()
    //createStars()
}

function update(delta) {
    TWEEN.update(delta)
}

function render(delta) {
    requestAnimationFrame(render)
    update(delta)
    renderer.render(scene, camera)
}

function restart() {
    board = new Board(board.dimension, board.difficulty, board.creative)
    game = new Game()
    boardView.board = board
}

/**
 * This function initializes the board, the game, clears the rocketSweeper
 * creates the rocketSweeper obj (the one is intersected), the grid, the userPosition
 * and adds all to the rocketSweeperBase
 * */
function restartBoard() {
    if (!menu.isShowingMenu()) {
        board = new Board(board.dimension, board.difficulty, board.creative)
        game = new Game()
        menu.reset(board, game)
    }

    boardView.restartBoardView(board)
    userPosition.position.y = 0.01
    boardView.addToBoard(userPosition, userPosition.position.clone())
}

function loadGUI() {
    gui = new GUI()
    const flagKeys = ['bowser', 'mario', 'luigi', 'peach', 'toad', 'estrella']
    const options = {
        flag: flagKeys[0],
    }
    const folder = gui.addFolder('Cambiar Bandera')
    folder.add(options, 'flag', flagKeys).name('Bandera').onChange(changeFlag)
}

function createMoon() {
    const textureLoader = new THREE.TextureLoader()
    const moonGeometry = new THREE.IcosahedronGeometry(1000, 10)
    const moonMaterial = new THREE.MeshStandardMaterial({
        map: textureLoader.load('../../images/moon.jpg'),
    })
    const sphereMesh = new THREE.Mesh(moonGeometry, moonMaterial)
    sphereMesh.castShadow = true
    sphereMesh.receiveShadow = true
    sphereMesh.position.y = -998
    sphereMesh.rotateX(Math.PI / 2)
    scene.add(sphereMesh)
}

function createStars() {
    const starVertices = []
    const starGeometry = new THREE.BufferGeometry()
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff })

    for (let i = 0; i < 10000; i++) {
        const x = randomCoordinate()
        const y = randomCoordinate()
        const z = randomCoordinate()
        starVertices.push(x, y, z)
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3))

    const stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)
}

function setLights() {
    const ambientLight = new THREE.AmbientLight(0x222244, 0.4)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 20, 10)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight2.position.set(0, 10, -10000)
    directionalLight2.castShadow = true
    directionalLight2.shadow.mapSize.width = 2048
    directionalLight2.shadow.mapSize.height = 2048
    scene.add(directionalLight2)

    const pointLight1 = new THREE.PointLight(0xffddaa, 0.8, 100)
    pointLight1.position.set(-150, 100, 50)
    pointLight1.castShadow = true
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0xaaddff, 0.8, 100)
    pointLight2.castShadow = true
    pointLight2.position.set(150, 100, -50)
    scene.add(pointLight2)

    const spotLight = new THREE.SpotLight(0xffffff, 1, 1000, Math.PI / 6, 0.1, 2)
    spotLight.castShadow = true
    spotLight.position.set(0, 300, 300)
    spotLight.target.position.set(0, 0, 0)
    scene.add(spotLight)
    scene.add(spotLight.target)
}

function randomCoordinate() {
    // Con 50% de probabilidad, escoge el intervalo negativo o positivo
    if (Math.random() < 0.5) {
        // Intervalo entre -2000 y -500
        return -2000 + Math.random() * 1950 // 1500 = (-500) - (-2000)
    } else {
        // Intervalo entre 500 y 2000
        return 50 + Math.random() * 1950 // 1500 = 2000 - 500
    }
}

function changeFlag(newVal) {
    flagBase.clear()
    const flag = flagMeshes.get(newVal)
    const flagAux = flag.clone()
    flagAux.rotateX(-Math.PI)
    flagAux.position.z = 0.1
    flagAux.scale.set(0.5, 0.5, 0.5)
    flagBase.add(flagAux)
    boardView.setFlagMesh(flag)
}

function win() {
    game.win()

    const video = document.createElement('video')
    video.src = './videos/win0.mp4'
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
        boardView.addToBoard(pantalla, new THREE.Vector3(0, 5.0, 0))
    }, 1500)
    const textObj = showText(textWinMesh)
    moveCamera(
        new THREE.Vector3(0, tableBox.max.y + 5, 12),
        new THREE.Vector3(0, tableBox.max.y + 5, 0),
        500
    )
    setTimeout(() => {
        boardView.deleteFromBoard(pantalla)
        boardView.deleteFromBoard(textObj)
        restartBoard()
        menu.showMenu()
        moveCamera(
            new THREE.Vector3(0, tableBox.max.y + 7, 12),
            new THREE.Vector3(0, tableBox.max.y + 1, 0),
            1500
        )
    }, 10000)
}

function lose() {
    game.lose()

    const video = document.createElement('video')
    const randomVideo = Math.round(Math.random() * 2)
    video.src = `./videos/lose${randomVideo}.mp4`
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
        boardView.addToBoard(pantalla, new THREE.Vector3(0, 5.0, 0))
    }, 1500)
    const textObj = showText(textLostMesh)
    moveCamera(
        new THREE.Vector3(0, tableBox.max.y + 5, 12),
        new THREE.Vector3(0, tableBox.max.y + 5, 0),
        500
    )
    setTimeout(() => {
        boardView.deleteFromBoard(pantalla)
        boardView.deleteFromBoard(textObj)
        restartBoard()
        menu.showMenu()
        moveCamera(
            new THREE.Vector3(0, tableBox.max.y + 7, 12),
            new THREE.Vector3(0, tableBox.max.y + 1, 0),
            1500
        )
    }, 7000)
}

/**
 * @param {THREE.Mesh} text
 * */
function showText(text) {
    const lastPosition = text.position
    const textAux = text.clone()
    boardView.addToBoard(textAux, new THREE.Vector3(0, 10, 0))
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
    scoreLabel.innerText = 'Puntos: ' + newPoints
}

function showRockets() {
    if (!board.creative) return
    boardView.showRockets()
}

function createCoin(number, matPos, delay) {
    boardView.createCoin(number, matPos, delay)
    game.addPoints(number * 10)
    updatePoints()
}

function openArea(matPos) {
    let delay = 0
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i == 0 && j == 0) continue
            const nextPos = new MatrixCoords(matPos.row + i, matPos.col + j)
            if (nextPos.row >= board.dimension || nextPos.row < 0) continue
            if (nextPos.col >= board.dimension || nextPos.col < 0) continue
            if (!board.isDiscovered(nextPos) && !board.isMarked(nextPos)) {
                board.discoverTile(nextPos)
                boardView.removeButton(nextPos)
                const nextVal = board.getTileValue(nextPos)
                if (nextVal != MINE) {
                    createCoin(nextVal, nextPos, delay)
                    delay += 100
                }

                if (nextVal == BLANK) {
                    openArea(nextPos)
                }
            }
        }
    }
}

function openSurrounding(matPos) {
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const nextPos = new MatrixCoords(matPos.row + i, matPos.col + j)
            if (nextPos.row >= board.dimension || nextPos.row < 0) continue
            if (nextPos.col >= board.dimension || nextPos.col < 0) continue

            const notDisAndNotMarked = !board.isDiscovered(nextPos) && !board.isMarked(nextPos)
            if (notDisAndNotMarked) {
                if (discoverTile(nextPos) == 'rocket') return
            }
        }
    }
}

function discoverTile(matPos) {
    const currVal = board.getTileValue(matPos)
    let res = ''
    switch (currVal) {
        case BLANK:
            openArea(matPos)
            res = 'blank'
            if (!board.isDiscovered(matPos)) {
                board.discoverTile(matPos)
                boardView.removeButton(matPos)
            }
            break

        case MINE: {
            discoveredARocket(matPos)
            // to stop just after finding a rocket
            return 'rocket'
        }
        default: {
            board.discoverTile(matPos)
            const noDelay = 0
            createCoin(currVal, matPos, noDelay)
            boardView.removeButton(matPos)
            res = 'coin'
        }
    }
    if (board.hasWon()) win()
    return res
}

function discoveredARocket(matPos) {
    boardView.createRocket(matPos)
    boardView.removeButton(matPos)
    board.discoverTile(matPos)
    lose()
}

function loadModels() {
    gltfLoader = new GLTFLoader()
    gltfLoader.setPath('../../models/')

    gltfLoader.load('table/table.glb', (gltf) => {
        table = gltf.scene
        table.castShadow = true
        table.receiveShadow = true
        tableBox = new THREE.Box3().setFromObject(table)
        const tableTopY = tableBox.max.y

        boardView = new BoardView(camera, table, scene, board)
        boardView.setBoardYPosition(tableTopY)

        scene.add(table)
        boardView.addToBoard(userPosition, userPosition.position.clone())

        camera.position.set(0, tableTopY + 7, 10)
        orbit = new OrbitControls(camera, renderer.domElement)
        orbit.update()
        orbit.target.set(0, tableTopY, 0)

        const flag = flagMeshes.get('bowser')

        if (flag) boardView.setFlagMesh(flag)

        moveCamera(
            new THREE.Vector3(0, tableBox.max.y + 7, 12),
            new THREE.Vector3(0, tableBox.max.y + 1, 0),
            1500
        )

        loadTextures()
    })

    gltfLoader.load('flag/flag.glb', (gltf) => {
        const flag = gltf.scene
        flag.scale.set(0.25, 0.25, 0.25)
        flagMeshes.set('bowser', flag)
        if (boardView) boardView.setFlagMesh(flag)
    })
    loadAllFlags()
}

function loadAllFlags() {
    const flagKeys = ['mario', 'luigi', 'peach', 'toad', 'estrella']
    for (let i = 1; i <= 5; i++) {
        gltfLoader.load(`flag/flag${i}.glb`, (gltf) => {
            const flag = gltf.scene
            flag.scale.set(0.25, 0.25, 0.25)
            flagMeshes.set(flagKeys[i - 1], flag)
        })
    }
}

function loadTextures() {
    const textureLoader = new THREE.TextureLoader()
    textureLoader.setPath('../../images/')

    const diffuseMap = textureLoader.load('carpet/casino-diffuse.png')
    const normalMap = textureLoader.load('carpet/casino-normal.jpg')
    const displacementMap = textureLoader.load('carpet/casino-displacement.jpg')
    const aoMap = textureLoader.load('carpet/casino-ao.jpg')
    const specularMap = textureLoader.load('carpet/casino-specular.jpg')

    const geometry = new THREE.PlaneGeometry(4, 2, 100, 100)

    geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(geometry.attributes.uv.array, 2))

    const material = new THREE.MeshPhongMaterial({
        map: diffuseMap,
        normalMap: normalMap,
        displacementMap: displacementMap,
        displacementScale: 0.1,
        aoMap: aoMap,
        specularMap: specularMap,
    })

    flagBase = new THREE.Mesh(geometry, material)
    const tableMax = tableBox.max
    flagBase.position.y = 0.01 + tableMax.y
    flagBase.position.z = tableMax.z - 1.5
    flagBase.position.x = tableMax.x - 8
    flagBase.rotation.x = -Math.PI / 2

    const flag = flagMeshes.get('bowser').clone()
    flag.rotateX(-Math.PI)
    flag.position.z = 0.1
    flag.scale.set(0.5, 0.5, 0.5)

    flagBase.add(flag)

    table.add(flagBase)
}

function loadFonts() {
    const loader = new FontLoader()
    loader.load(
        'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
        function(font) {
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

            textLostMesh = new THREE.Mesh(lostGeom, textRed)
            textLostMesh.position.x -= (endTextSize * labelLost.length) / 2 - 2
            textLostMesh.position.y = 4
            textLostMesh.position.z += 1.5

            textWinMesh = new THREE.Mesh(winGeom, textGreen)
            textWinMesh.position.x -= (endTextSize * labelWin.length) / 2 - 1.5
            textWinMesh.position.y = 4
            textWinMesh.position.z += 1.5
        }
    )
}

function loadBackground() {
    const loader = new RGBELoader()
    loader.load('../../images/hdr/background.hdr', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping
        scene.background = texture
    })
}

function resizeWindow() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

function dblClick() {
    if (!game.canPlay()) return
    if (intersects.length <= 0) return
    const matrixPos = boardView.transformToMatrix(userPosition.position)

    if (currTileDisOrMarked(matrixPos)) return
    if (!tryStartPlaying(matrixPos)) return
    document.body.style.cursor = 'default'

    discoverTile(matrixPos)

    boardView.removeButton(matrixPos)
}

function currTileDisOrMarked(mtrxPosition) {
    return board.isDiscovered(mtrxPosition) || board.isMarked(mtrxPosition)
}

function tryStartPlaying(mtrxPosition) {
    if (!game.canPlay()) return false

    let curVal = board.getTileValue(mtrxPosition)

    while (!game.isPlaying()) {
        curVal = board.getTileValue(mtrxPosition)
        if (curVal != BLANK) {
            restart()
        } else {
            game.startPlaying()
            showRockets()
        }
    }

    rocketCountLabel.innerText = 'Explosivos: ' + board.nRockets
    return true
}

function rightMouseDown(event) {
    if (!game.isPlaying()) return
    if (intersects.length <= 0) return
    if (event.button == 2) {
        event.preventDefault()
        const matrixPos = boardView.transformToMatrix(userPosition.position)
        const button = boardView.getButton(matrixPos)
        const flag = boardView.getFlag(matrixPos)
        if (button || flag || (board.creative && board.isMine(matrixPos))) toggleFlag(matrixPos)
    }
}

function toggleFlag(mtrxPosition) {
    if (!board.isMarked(mtrxPosition)) {
        boardView.removeButton(mtrxPosition)
        boardView.createFlag(mtrxPosition)
    } else {
        boardView.removeFlag(mtrxPosition)
        boardView.createButton(mtrxPosition)
    }
    board.toggleMarkTile(mtrxPosition)
    rocketCountLabel.innerText = 'Explosivos: ' + board.getGameRockets()
}

function moveOnBoard(e) {
    if (!boardView) return
    mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1
    mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1

    let prevPosition, prevMatrixPosition, prevBtn

    if (intersects && intersects.length > 0) {
        prevPosition = new THREE.Vector3().copy(intersects[0].point).floor().addScalar(0.5)
        prevMatrixPosition = boardView.transformToMatrix(prevPosition)
        prevBtn = boardView.getButton(prevMatrixPosition)
    } else prevPosition = undefined

    intersects = boardView.getIntersect(mousePosition)
    if (intersects.length > 0) {
        const intersect = intersects[0]
        const highlightPos = new THREE.Vector3().copy(intersect.point).floor().addScalar(0.5)
        const currMatrixPosition = boardView.transformToMatrix(highlightPos)

        userPosition.position.set(highlightPos.x, 0.51, highlightPos.z)
        const currIsMine = board.isMine(currMatrixPosition)
        const currBtn = boardView.getButton(currMatrixPosition)

        if (currBtn) {
            document.body.style.cursor = game.canPlay() ? 'pointer' : 'default'
            hoverBtn(true, currBtn)
        } else if (board.creative && currIsMine) {
            document.body.style.cursor = game.canPlay() ? 'pointer' : 'default'
        } else document.body.style.cursor = e.ctrlKey ? 'pointer' : 'default'

        if (prevBtn && !currMatrixPosition.equals(prevMatrixPosition)) {
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
    const matrixPos = boardView.transformToMatrix(currPosition)
    openSurrounding(matrixPos)
}

window.addEventListener('resize', resizeWindow)
window.addEventListener('mousemove', moveOnBoard)
window.addEventListener('dblclick', dblClick)
window.addEventListener('mousedown', rightMouseDown)
window.addEventListener('click', cntrlClick)
