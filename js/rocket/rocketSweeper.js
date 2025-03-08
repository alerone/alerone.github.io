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

// HTML Elems
let scoreLabel
let rocketCountLabel
let difficultyLabel
let scoreboard

/**@type {THREE.LoadingManager}*/
let loadingManager

let textLostMesh
let textWinMesh
let textFont

let gltfLoader

const BLANK = 0
const MINE = -1
const dificultades = ['Fácil', 'Medio', 'Difícil']

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
    renderer.shadowMap.type = THREE.PCFShadowMap

    document.getElementById('container').appendChild(renderer.domElement)
    scoreLabel = document.querySelector('#score')
    rocketCountLabel = document.getElementById('explosivos')
    rocketCountLabel.innerText = 'Explosivos: ' + board.nRockets
    difficultyLabel = document.querySelector('#diff')
    // Escena
    scene = new THREE.Scene()

    // Camara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000)
    camera.position.set(0, -100, 550)

    loadingManager = new THREE.LoadingManager()
    menu.hideMenu()

    scoreboard = document.querySelector('#scoreboard')
    scoreboard.classList.add('hidden')
}

function load() {
    const loadingScreen = document.querySelector('#loading-screen')
    const progressBar = document.querySelector('#progress-bar')

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

    loadingManager.onProgress = (_, itemsLoaded, itemsTotal) => {
        const percentComplete = 100 * (itemsLoaded / itemsTotal)
        progressBar.style.width = Math.round(percentComplete) + '%'
        progressBar.textContent = Math.round(percentComplete) + '%'
    }

    loadingManager.onLoad = () => {
        loadingScreen.classList.add('hidden')

        const flag = flagMeshes.get('bowser').clone()

        if (flag) boardView.setFlagMesh(flag)
        menu.setInTitleFunction(showTitle)
        menu.setOutTitleFunction(removeTitle)

        moveCamera(
            new THREE.Vector3(0, tableBox.max.y + 7, 14),
            new THREE.Vector3(0, tableBox.max.y + 1, 0),
            5000,
            () => {
                menu.showMenu()
            }
        )
        flag.rotateX(-Math.PI)
        flag.position.z = 0.1
        flag.scale.set(0.5, 0.5, 0.5)

        flagBase.add(flag)
        setLights()

        scoreboard.classList.remove('hidden')
    }
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
    console.log(board)
    if (!menu.isShowingMenu()) {
        board = new Board(board.dimension, board.difficulty, board.creative)
        game = new Game()
        menu.reset(board, game)
        difficultyLabel.innerText = 'Dificultad: ' + dificultades[board.difficulty - 1]
        rocketCountLabel.innerText = 'Explosivos: ' + board.nRockets
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
        color: '#2590d1',
        metalness: 0,
        roughness: 1,
        diff: dificultades[board.difficulty - 1],
        creative: board.creative,
        applyGameChanges: () => {
            //cambia los colores del menú de botones de dificultad
            menu.changeDiff(dificultades.indexOf(options.diff) + 1)
            board.setDifficulty(dificultades.indexOf(options.diff) + 1)
            menu.setCreative(options.creative)
            restartBoard()
            game.start()
        },
        shadows: true,
        camera: () => {
            moveCamera(
                new THREE.Vector3(0, tableBox.max.y + 7, 14),
                new THREE.Vector3(0, tableBox.max.y + 1, 0),
                1500
            )
        },
    }
    const folder = gui.addFolder('Cambiar Apariencia')
    folder.add(options, 'flag', flagKeys).name('Bandera').onChange(changeFlag)
    folder
        .addColor(options, 'color')
        .name('Color')
        .onChange((val) => {
            boardView.changeBoardColor(val)
        })
    folder
        .add(options, 'roughness', 0.0, 1.0, 0.1)
        .name('Dureza')
        .onChange((val) => {
            boardView.changeRoughness(val)
        })
    folder
        .add(options, 'metalness', 0.0, 1.0, 0.1)
        .name('Metálico')
        .onChange((val) => {
            boardView.changeMetalness(val)
        })
    const gameFolder = gui.addFolder('Ajustar partida')
    gameFolder.add(options, 'diff', dificultades).name('Dificultad')
    gameFolder.add(options, 'creative', false).name('Ver Cohetes')
    gameFolder.add(options, 'applyGameChanges').name('Aplicar cambios')

    const cameraFolder = gui.addFolder('Ajustes de cámara')
    cameraFolder.add(options, 'camera').name('Centrar cámara')

    menu.setGUI(gui)
    gui.domElement.style.display = 'none'
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

function setLights() {
    const tableTop = tableBox.max.y
    const ambientLight = new THREE.AmbientLight(0x222244, 0.7)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(0, tableTop + 10, -100)
    castDirectional(directionalLight)
    scene.add(directionalLight)

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight2.position.set(0, tableTop + 5, 25)
    directionalLight2.target.position.set(0, tableTop + 5, 0)
    castDirectional(directionalLight2)
    scene.add(directionalLight2)

    const spotLight = new THREE.SpotLight(0xffffff, 3, 40, Math.PI / 6, 0.6, 2)
    spotLight.position.set(0, tableTop + 25, 0)
    spotLight.target.position.set(0, tableTop, 0)
    scene.add(spotLight)

    const flagSpotLight = new THREE.SpotLight(0xffffff, 2, 10, Math.PI / 12, 0.1, 2)
    const flagBasePos = flagBase.position.clone()
    flagSpotLight.position.set(flagBasePos.x, tableTop + 5, flagBasePos.z)
    flagSpotLight.target = flagBase
    scene.add(flagSpotLight)

    const shipSpotLight = new THREE.SpotLight(0xffffff, 3, 60, Math.PI / 4, 0.3, 2)
    const ship = scene.getObjectByName('starship')
    const shipPosition = ship.position.clone()
    shipSpotLight.position.set(shipPosition.x - 25, 40, shipPosition.z + 25)
    shipSpotLight.target = ship
    scene.add(shipSpotLight)

    //const lightHelper = new THREE.SpotLightHelper(shipSpotLight)
    //scene.add(lightHelper)
}

function showTitle() {
    const title = 'RocketSweeper'
    menu.setCanPressPlay(false)
    const colors = [
        0x4fc3f7, 0x7cb342, 0xfbc02d, 0xf44336, 0xba68c8,
    ] /**#4fc3f7, #7cb342, #fbc02d, #f44336, #ba68c8*/
    const size = 1.6
    const firstPosX = size * 0.5 + -((title.length * size) / 2)
    let delay = 0
    const lastIndex = 'r' + (title.length - 1)
    for (let index = 0; index < title.length; index++) {
        const letter = title[index]
        const colorCurr = colors[index % colors.length]
        const currPosition = new THREE.Vector3(firstPosX + index * size, 5.5, 0)
        const letter3D = create3DText(letter, size, colorCurr, currPosition)
        letter3D.castShadow = true
        letter3D.name = letter + index
        animateTitle(letter3D, currPosition, delay, lastIndex)
        delay += 70
    }
}

function removeTitle() {
    const title = 'RocketSweeper'
    for (let index = 0; index < title.length; index++) {
        const character = title[index]
        const letter3D = boardView.getObjectByName(character + index)
        new TWEEN.Tween(letter3D.scale)
            .to({ x: 0.2, y: 0.2, z: 0.2 }, 500)
            .easing(TWEEN.Easing.Linear.None)
            .onComplete(() => {
                boardView.deleteByName(character + index)
            })
            .start()
    }
}

function animateTitle(letter, lastPosition, delay, lastIndex) {
    const positionX = Math.floor(Math.random() * 21) - 10
    const positionZ = -Math.floor(Math.random() * 21)
    const positionY = 15
    const position = new THREE.Vector3(positionX, positionY, positionZ)
    const duration = 1000
    const textPosition = new TWEEN.Tween(letter.position)
        .to({ x: lastPosition.x, y: lastPosition.y, z: lastPosition.z }, duration)
        .easing(TWEEN.Easing.Quadratic.In)
        .onComplete(() => {
            if (letter.name == lastIndex) {
                menu.setCanPressPlay(true)
            }
        })

    setTimeout(() => {
        boardView.addToBoard(letter, position)
        textPosition.start()
    }, delay)
}

function castDirectional(dirLight) {
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    dirLight.shadow.camera.near = 0.01
    dirLight.shadow.camera.far = 500
    dirLight.shadow.camera.left = -100
    dirLight.shadow.camera.right = 100
    dirLight.shadow.camera.bottom = -100
    dirLight.shadow.camera.top = 100
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
    gui.domElement.style.display = 'none'
    game.win()

    const video = document.createElement('video')
    const randomVideo = Math.round(Math.random() * 2)
    video.src = `./videos/win${randomVideo}.mp4`
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
        new THREE.Vector3(0, tableBox.max.y + 5, 14),
        new THREE.Vector3(0, tableBox.max.y + 5, 0),
        500
    )

    setTimeout(() => {
        if (!game.isGameOver()) return
        boardView.deleteFromBoard(pantalla)
        boardView.deleteFromBoard(textObj)
        restartBoard()
        menu.showMenu()
        moveCamera(
            new THREE.Vector3(0, tableBox.max.y + 7, 14),
            new THREE.Vector3(0, tableBox.max.y + 1, 0),
            1500
        )
    }, 10000)
}

function lose() {
    gui.domElement.style.display = 'none'
    game.lose()

    const video = document.createElement('video')
    const randomVideo = Math.round(Math.random() * 3)
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
        new THREE.Vector3(0, tableBox.max.y + 5, 14),
        new THREE.Vector3(0, tableBox.max.y + 5, 0),
        500
    )
    setTimeout(() => {
        if (!game.isGameOver()) return
        boardView.deleteFromBoard(pantalla)
        boardView.deleteFromBoard(textObj)
        restartBoard()
        menu.showMenu()
        moveCamera(
            new THREE.Vector3(0, tableBox.max.y + 7, 14),
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
function moveCamera(moveTo, lookAt, duration, onComplete) {
    const moveAnim = new TWEEN.Tween(camera.position)
        .to({ x: moveTo.x, y: moveTo.y, z: moveTo.z }, duration)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
            camera.lookAt(lookAt)
        })
        .onComplete(() => {
            if (onComplete) onComplete()
            orbit.target.copy(lookAt)
        })
    moveAnim.start()
}

function moveAroundObject(target, radius, duration) {
    const startAngle = 0
    const endAngle = Math.PI * 2

    const tweenObj = { angle: startAngle }

    new TWEEN.Tween(tweenObj)
        .to({ angle: endAngle }, duration)
        .easing(TWEEN.Easing.Linear.None)
        .onUpdate(() => {
            camera.position.x = target.x + radius * Math.cos(tweenObj.angle)
            camera.position.z = target.z + radius * Math.sin(tweenObj.angle)
            camera.lookAt(target)
        })
        .repeat(2)
        .start()
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
    gltfLoader = new GLTFLoader(loadingManager)
    gltfLoader.setPath('../../models/')

    gltfLoader.load('table/table.glb', (gltf) => {
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true // Permite que la malla proyecte sombras
                child.receiveShadow = true // Permite que la malla reciba sombras
            }
        })
        table = gltf.scene.clone()
        tableBox = new THREE.Box3().setFromObject(table)
        const tableTopY = tableBox.max.y

        boardView = new BoardView(camera, table, scene, board, loadingManager)
        boardView.setBoardYPosition(tableTopY)

        scene.add(table)
        boardView.addToBoard(userPosition, userPosition.position.clone())

        orbit = new OrbitControls(camera, renderer.domElement)
        orbit.update()
        orbit.target.set(0, tableTopY, 0)

        loadTextures()
    })

    gltfLoader.load('flag/flag.glb', (gltf) => {
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true // Permite que la malla proyecte sombras
            }
        })
        const flag = gltf.scene
        flag.scale.set(0.25, 0.25, 0.25)
        flagMeshes.set('bowser', flag)
    })
    loadAllFlags()

    gltfLoader.load('starship/starship.glb', (gltf) => {
        const starship = gltf.scene
        starship.scale.set(8, 8, 8)
        starship.rotateY(-0.8)
        starship.traverse((child) => {
            if (child.isMesh) child.castShadow = true
        })
        starship.name = 'starship'
        starship.position.set(85, 30, -60)
        scene.add(starship)
    })
}

function loadAllFlags() {
    const flagKeys = ['mario', 'luigi', 'peach', 'toad', 'estrella']
    for (let i = 1; i <= 5; i++) {
        gltfLoader.load(`flag/flag${i}.glb`, (gltf) => {
            gltf.scene.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true // Permite que la malla proyecte sombras
                }
            })
            const flag = gltf.scene
            flag.scale.set(0.25, 0.25, 0.25)
            flagMeshes.set(flagKeys[i - 1], flag)
        })
    }
}

function loadTextures() {
    const textureLoader = new THREE.TextureLoader(loadingManager)
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
    flagBase.position.z = tableMax.z - 3
    flagBase.position.x = tableMax.x - 6
    flagBase.rotation.x = -Math.PI / 2
    flagBase.castShadow = true

    table.add(flagBase)
}

function loadFonts() {
    const loader = new FontLoader(loadingManager)
    loader.load(
        'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
        function (font) {
            textFont = font
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
            textLostMesh.position.y = 5
            textLostMesh.position.z += 1.5

            textWinMesh = new THREE.Mesh(winGeom, textGreen)
            textWinMesh.position.x -= (endTextSize * labelWin.length) / 2 - 1.5
            textWinMesh.position.y = 5
            textWinMesh.position.z += 1.5
        }
    )
}

function create3DText(text, size, color, position) {
    if (!textFont) return
    const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.9,
        metalness: 0.3,
    })

    const resGeom = new TextGeometry(text, {
        font: textFont,
        size: size,
        height: 0.2,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelSegments: 5,
    })

    const result = new THREE.Mesh(resGeom, material)
    result.position.copy(position)

    return result
}

function loadBackground() {
    const loader = new RGBELoader(loadingManager)
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

//function testingCamera(event) {
//    if (event.key == 'c') {
//        moveCamera(
//            new THREE.Vector3(0, tableBox.max.y + 7, 14),
//            new THREE.Vector3(0, tableBox.max.y + 1, 0),
//            3000
//        )
//    }
//    if (event.key == 'r') {
//        moveAroundObject(new THREE.Vector3(0, tableBox.max.y + 1, 0), 10, 6000)
//    }
//}

window.addEventListener('resize', resizeWindow)
window.addEventListener('mousemove', moveOnBoard)
window.addEventListener('dblclick', dblClick)
window.addEventListener('mousedown', rightMouseDown)
window.addEventListener('click', cntrlClick)
//window.addEventListener('keydown', testingCamera)
