export const EASY = 1
export const MEDIUM = 2
export const HARD = 3
export class Board {
    constructor(dimension, difficulty, creative) {
        this.nMines = 25
        this.dimension = dimension
        // If fill(new Tile...) the reference to tile is the same in all the array so
        // changes on tile[x] change the value on all tiles...
        this.tiles = new Array(dimension * dimension).fill(null).map(() => new Tile(null))
        this.mines = []

        this.discovered = 0
        this.marked = 0

        if (creative) this.creative = creative
        else this.creative = false

        if (difficulty) this.difficulty = difficulty
        else this.difficulty = EASY

        setNMines(this)
        setMines(this)
        setCountingMines(this)
    }

    setDifficulty(diff) {
        this.difficulty = diff
        setNMines(this)
    }

    updateDifficulty() {
        setMines(this)
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

    isDiscovered(row, col) {
        return this.tiles[row * this.dimension + col].state == 'discovered'
    }

    isMarked(row, col) {
        return this.tiles[row * this.dimension + col].state == 'marked'
    }

    discoverTile(row, col) {
        if (!this.isMine(row, col) && !this.isDiscovered(row, col)) this.discovered++
        this.tiles[row * this.dimension + col].state = 'discovered'
    }

    hasWon() {
        const realDimension = this.dimension * this.dimension
        return realDimension - this.nMines == this.discovered
    }

    getGameRockets() {
        return this.nMines - this.marked
    }

    toggleMarkTile(row, col) {
        const current = this.tiles[row * this.dimension + col].state
        if (current === 'marked') {
            this.marked--
            this.tiles[row * this.dimension + col].state = 'undiscovered'
        }
        if (current === 'undiscovered') {
            this.marked++
            this.tiles[row * this.dimension + col].state = 'marked'
        }
    }

    setTile(row, col, value) {
        this.tiles[row * this.dimension + col].value = value
    }

    getTileValue(row, col) {
        return this.tiles[row * this.dimension + col].value
    }

    isBlankTile(row, col) {
        return this.tiles[row * this.dimension + col].value == 0
    }

    isMine(row, col) {
        return this.tiles[row * this.dimension + col].value == -1
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
function setNMines(board) {
    switch (board.difficulty) {
        case EASY:
            board.nMines = Math.floor(0.1 * (board.dimension * board.dimension))
            break
        case MEDIUM:
            board.nMines = Math.floor(0.25 * (board.dimension * board.dimension))
            break
        case HARD:
            board.nMines = Math.floor(0.35 * (board.dimension * board.dimension))
            break
        default:
            board.nMines = Math.floor(0.15 * (board.dimension * board.dimension))
    }
}

/**
 * Initialize mines in the board
 *@param{Board}board
 */
function setMines(board) {
    for (let i = 0; i < board.nMines; i++) {
        let row, col
        do {
            row = Math.floor(Math.random() * board.dimension)
            col = Math.floor(Math.random() * board.dimension)
        } while (board.getTileValue(row, col) == -1)
        board.setTile(row, col, -1)
        board.mines.push({ row, col })
    }
}

/**
 * Initialize board counting
 *@param{Board}board
 */
function setCountingMines(board) {
    for (let row = 0; row < board.dimension; row++) {
        for (let col = 0; col < board.dimension; col++) {
            if (!board.getTileValue(row, col)) {
                let count = 0
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (i == 0 && j == 0) continue
                        const nextRow = row + i
                        const nextCol = col + j
                        if (nextRow >= board.dimension || nextRow < 0) continue
                        if (nextCol >= board.dimension || nextCol < 0) continue
                        if (board.isMine(row + i, col + j)) {
                            count++
                        }
                    }
                }
                board.setTile(row, col, count)
            }
        }
    }
}
