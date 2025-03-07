import { MatrixCoords } from './matrixCoords.js'
export const EASY = 1
export const MEDIUM = 2
export const HARD = 3
const MINE = -1
export class Board {
    constructor(dimension, difficulty, creative) {
        this.nRockets = 25
        this.dimension = dimension
        // If fill(new Tile...), the reference to tile is the same in all the array so
        // changes on tile[x] change the value on all tiles...
        this.tiles = new Array(dimension * dimension).fill(null).map(() => new Tile(null))
        this.rockets = []
        this.marks = []

        this.discovered = 0
        this.markedCount = 0

        if (creative) this.creative = creative
        else this.creative = false

        if (difficulty) this.difficulty = difficulty
        else this.difficulty = EASY

        setNumRockets(this)
        placeRockets(this)
        setCountingMines(this)
    }

    /**
     *  Sets the difficulty and number of rockets of the board but don't update the actual board
     * */
    setDifficulty(diff) {
        this.difficulty = diff
        setNumRockets(this)
    }

    /**
     *  Updates the board to the new difficulty value with new rockets
     * */
    updateDifficulty() {
        placeRockets(this)
        setCountingMines(this)
    }

    difficultyToString() {
        switch (this.difficulty) {
            case EASY:
                return 'Fácil'
            case MEDIUM:
                return 'Medio'
            case HARD:
                return 'Difícil'
            default:
                return 'Fácil'
        }
    }

    isDiffEasy() {
        return this.difficulty == EASY
    }

    isDiffMedium() {
        return this.difficulty == MEDIUM
    }

    isDiffHard() {
        return this.difficulty == HARD
    }

    toggleCreative() {
        this.creative = !this.creative
    }

    setCreative(creative) {
        this.creative = creative
    }

    /**@param {MatrixCoords} matPos */
    isDiscovered(matPos) {
        return this.tiles[matPos.row * this.dimension + matPos.col].state == 'discovered'
    }

    /**@param {MatrixCoords} matPos */
    isMarked(matPos) {
        return this.tiles[matPos.row * this.dimension + matPos.col].state == 'marked'
    }

    /**@param {MatrixCoords} matPos */
    discoverTile(matPos) {
        if (!this.isMine(matPos) && !this.isDiscovered(matPos)) this.discovered++
        this.tiles[matPos.row * this.dimension + matPos.col].state = 'discovered'
    }

    hasWon() {
        const realDimension = this.dimension * this.dimension
        return realDimension - this.nRockets == this.discovered
    }

    getGameRockets() {
        return this.nRockets - this.markedCount
    }

    /**@param {MatrixCoords} matPos */
    toggleMarkTile(matPos) {
        const current = this.tiles[matPos.row * this.dimension + matPos.col].state
        if (current === 'marked') {
            this.markedCount--

            const index = this.marks.indexOf(matPos)
            this.marks.splice(index, 1)

            this.tiles[matPos.row * this.dimension + matPos.col].state = 'undiscovered'
        }
        if (current === 'undiscovered') {
            this.markedCount++
            this.marks.push(matPos)
            this.tiles[matPos.row * this.dimension + matPos.col].state = 'marked'
        }
    }

    /**@param {MatrixCoords} matPos */
    setTile(matPos, value) {
        this.tiles[matPos.row * this.dimension + matPos.col].value = value
    }

    /**@param {MatrixCoords} matPos */
    getTileValue(matPos) {
        return this.tiles[matPos.row * this.dimension + matPos.col].value
    }

    /**@param {MatrixCoords} matPos */
    isBlankTile(matPos) {
        return this.tiles[matPos.row * this.dimension + matPos.col].value == 0
    }

    /**@param {MatrixCoords} matPos */
    isMine(matPos) {
        return this.tiles[matPos.row * this.dimension + matPos.col].value == -1
    }
}

export class Tile {
    constructor(value) {
        this.value = value
        this.state = 'undiscovered'
    }
}

/**
 * Initialize board rockets based on difficulty
 *@param{Board}board
 */
function setNumRockets(board) {
    switch (board.difficulty) {
        case EASY:
            board.nRockets = Math.floor(0.1 * (board.dimension * board.dimension))
            break
        case MEDIUM:
            board.nRockets = Math.floor(0.25 * (board.dimension * board.dimension))
            break
        case HARD:
            board.nRockets = Math.floor(0.35 * (board.dimension * board.dimension))
            break
        default:
            board.nRockets = Math.floor(0.15 * (board.dimension * board.dimension))
    }
}

/**
 * Initialize mines in the board
 *@param{Board}board
 */
function placeRockets(board) {
    for (let i = 0; i < board.nRockets; i++) {
        let matPos
        do {
            matPos = new MatrixCoords(
                Math.floor(Math.random() * board.dimension),
                Math.floor(Math.random() * board.dimension)
            )
        } while (board.isMine(matPos))
        board.setTile(matPos, MINE)
        board.rockets.push(matPos)
    }
}

/**
 * Initialize board counting
 *@param{Board}board
 */
function setCountingMines(board) {
    for (let row = 0; row < board.dimension; row++) {
        for (let col = 0; col < board.dimension; col++) {
            if (!board.getTileValue(new MatrixCoords(row, col))) {
                let count = 0
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (i == 0 && j == 0) continue
                        const nextPos = new MatrixCoords(row + i, col + j)
                        if (nextPos.row >= board.dimension || nextPos.row < 0) continue
                        if (nextPos.col >= board.dimension || nextPos.col < 0) continue
                        if (board.isMine(nextPos)) {
                            count++
                        }
                    }
                }
                const currPos = new MatrixCoords(row, col)
                board.setTile(currPos, count)
            }
        }
    }
}
