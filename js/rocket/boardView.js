import { Board } from './board.js'
import { TextGeometry } from '../../lib/TextGeometry.module.js'
import { FontLoader } from '../../lib/FontLoader.module.js'
import * as SkeletonUtils from '../../lib/SkeletonUtils.min.js'
import { GLTFLoader } from '../../lib/GLTFLoader.module.js'
import { TWEEN } from '../../lib/tween.module.min.js'
import * as THREE from '../../lib/three.module.js'
import { createExplosion } from './effects.js'
import { MatrixCoords } from './matrixCoords.js'

/**@type{THREE.Mesh}*/
let base
/**@type{THREE.MeshPhongMaterial}*/
let boardMaterial
/**@type{THREE.MeshPhongMaterial}*/
let intersectBase

let raycaster

let gltfLoader
let textRocket

const BLANK = 0

export class BoardView {
    /**@param {Board} board */
    constructor(camera, createOn, scene, board) {
        this.scene = scene
        this.board = board
        this.camera = camera
        this.coinMeshes = new Map()

        boardMaterial = new THREE.MeshPhongMaterial({
            color: 0x2590d1,
            side: THREE.DoubleSide,
        })

        base = new THREE.Mesh(
            new THREE.BoxGeometry(board.dimension, board.dimension, 1),
            boardMaterial
        )
        base.geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
        base.position.y = -0.5
        base.castShadow = true
        base.receiveShadow = true

        intersectBase = new THREE.Mesh(
            new THREE.PlaneGeometry(board.dimension, board.dimension),
            boardMaterial
        )
        intersectBase.rotateX(-Math.PI / 2)
        intersectBase.position.y = 0.5
        intersectBase.name = 'intersectBase'

        const grid = new THREE.GridHelper(board.dimension, board.dimension)
        grid.position.y = 0.51

        base.add(grid)
        base.add(intersectBase)
        createOn.add(base)

        raycaster = new THREE.Raycaster()
        this.loadBoardModels()
        this.loadFonts()
    }

    showRockets() {
        this.board.rockets.forEach((rocket) => {
            const textClone = textRocket.clone()
            const matPos = new MatrixCoords(rocket.row, rocket.col)
            const gridPos = this.transformToBoard(matPos)
            textClone.position.set(gridPos.x - 0.25, 0.01, gridPos.z + 0.25)
            textClone.rotateX(-Math.PI / 2)

            this.addToBoard(textClone, textClone.position.clone())
            this.removeButton(matPos)
        })
    }

    setBoardYPosition(newY) {
        base.position.y = newY
    }

    getBoardYPosition() {
        return base.position.y
    }

    addToBoard(figure, position) {
        figure.position.set(position.x, position.y + 0.5, position.z)
        base.add(figure)
    }

    /**@param {MatrixCoords} matPos */
    addToBoardMatrix(figure, matPos, y) {
        const boardPosition = this.transformToBoard(matPos)
        const yPos = y ? y : 0.01
        this.addToBoard(figure, new THREE.Vector3(boardPosition.x, yPos, boardPosition.z))
    }

    deleteFromBoard(figure) {
        base.remove(figure)
    }

    deleteByName(name) {
        const deleteObj = base.getObjectByName(name)
        base.remove(deleteObj)
    }

    getIntersect(mousePosition) {
        raycaster.setFromCamera(mousePosition, this.camera)
        return raycaster.intersectObject(intersectBase)
    }

    /**@param {MatrixCoords} matPos */
    createButton(matPos) {
        const button = this.buttonMesh.clone()
        const buttonLabel = `button-${matPos.row}-${matPos.col}`
        button.name = buttonLabel
        this.addToBoardMatrix(button, matPos, 0.1)
        return buttonLabel
    }

    /**@param {MatrixCoords} matPos */
    getButton(matPos) {
        const buttonLabel = `button-${matPos.row}-${matPos.col}`
        const button = base.getObjectByName(buttonLabel)
        return button
    }

    /**@param {MatrixCoords} matPos */
    removeButton(matPos) {
        const buttonLabel = `button-${matPos.row}-${matPos.col}`
        this.deleteByName(buttonLabel)
        return buttonLabel
    }

    setFlagMesh(flagMesh) {
        this.flagMesh = flagMesh.clone()
        this.flagMesh.rotateX(Math.PI / 2)
        if (this.board.markedCount > 0) {
            this.board.marks.forEach((elem) => {
                this.removeFlag(elem)
                this.createFlag(elem)
            })
        }
    }

    /**@param {MatrixCoords} matPos */
    createFlag(matPos) {
        const flag = SkeletonUtils.clone(this.flagMesh)
        const flagLabel = `flag-${matPos.row}-${matPos.col}`
        flag.name = flagLabel
        flag.rotateZ(0.25)
        this.addToBoardMatrix(flag, matPos, 0.1)
        return flagLabel
    }

    /**@param {MatrixCoords} matPos */
    getFlag(matPos) {
        const flagLabel = `flag-${matPos.row}-${matPos.col}`
        const flag = base.getObjectByName(flagLabel)
        return flag
    }

    /**@param {MatrixCoords} matPos */
    removeFlag(matPos) {
        const flagLabel = `flag-${matPos.row}-${matPos.col}`
        this.deleteByName(flagLabel)
        return flagLabel
    }

    transformToMatrix(position) {
        const M = Math.floor(this.board.dimension / 2)
        const col = position.x + M - 0.5
        const row = position.z + M - 0.5
        return new MatrixCoords(row, col)
    }

    /**@param {MatrixCoords} matPos */
    transformToBoard(matPos) {
        let addX = 0.5
        let addZ = 0.5
        if (this.board.dimension % 2 != 0) {
            addX = 1
            addZ = 0
        }
        let x = matPos.col - Math.round(this.board.dimension / 2) + addX
        let z = Math.round(this.board.dimension / 2) - matPos.row - 1 + addZ
        z = -z
        return { x, z }
    }

    restartBoardView(board) {
        base.clear()

        const grid = new THREE.GridHelper(this.board.dimension, this.board.dimension)
        grid.position.y = 0.51

        base.add(grid)
        base.add(intersectBase)
        this.board = board
        createButtons(this)
    }

    /**@param {MatrixCoords} matPos */
    createCoin(number, matPos, delay) {
        if (this.coinMeshes.size <= 0) return
        if (number == BLANK) return
        const coin = this.coinMeshes.get(`coin-${number}`).clone()
        coin.scale.set(0.125, 0.125, 0.125)
        setTimeout(() => {
            this.addToBoardMatrix(coin, matPos)
            animateCoin(coin)
        }, delay)
    }

    /**@param {MatrixCoords} matPos */
    createRocket(matPos) {
        const rocket = this.rocketMesh.clone()
        const boardPosition = this.transformToBoard(matPos)
        rocket.rotateY(-Math.PI / 2)
        rocket.scale.set(0.3, 0.3, 0.3)
        this.addToBoardMatrix(rocket, matPos, 5)
        new TWEEN.Tween(rocket.position)
            .to({ x: boardPosition.x, y: 0.5, z: boardPosition.z }, 500)
            .easing(TWEEN.Easing.Linear.None)
            .onComplete(() => {
                createExplosion(rocket.position.clone(), this.scene)
                this.deleteFromBoard(rocket)
            })
            .start()
    }

    loadBoardModels() {
        gltfLoader = new GLTFLoader()
        for (let i = 1; i <= 8; i++) {
            loadModel(`../../models/coins/${i}_coin.glb`, this.coinMeshes, `coin-${i}`)
        }
        gltfLoader.load('../../models/Rocket/rocket.glb', (gltf) => {
            this.rocketMesh = gltf.scene.clone()
        })

        gltfLoader.load('../../models/button/button.glb', (gltf) => {
            this.buttonMesh = gltf.scene.clone()
            this.buttonMesh.scale.set(0.25, 0.25, 0.25)
            createButtons(this)
        })
    }

    loadFonts() {
        const loader = new FontLoader()
        loader.load(
            'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
            function(font) {
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
                const textRed = new THREE.MeshPhongMaterial({ color: 0xff0000 })
                textRocket = new THREE.Mesh(textGeometry, textRed)
            }
        )
    }
}

function animateCoin(coin) {
    const duration = 500
    const positionTween = new TWEEN.Tween(coin.position)
        .to({ y: 1.5 }, duration)
        .easing(TWEEN.Easing.Quadratic.Out)
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
        .easing(TWEEN.Easing.Linear.None)

    // Start both tweens simultaneously
    positionTween.start()
    rotationTween.start()
}

function createButtons(boardView) {
    for (let row = 0; row < boardView.board.dimension; row++) {
        for (let col = 0; col < boardView.board.dimension; col++) {
            const currPos = new MatrixCoords(row, col)
            boardView.createButton(currPos)
        }
    }
}

/**@param {Map} map */
function loadModel(modelPath, map, key) {
    gltfLoader.load(
        modelPath,
        function(gltf) {
            map.set(key, gltf.scene)
        },
        undefined,
        function(error) {
            console.error(error)
        }
    )
}
