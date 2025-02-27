export class Board {
    constructor(dimension) {
        this.nMines = 55
        this.dimension = dimension
        // If fill(new Tile...) the reference to tile is the same in all the array so
        // changes on tile[x] change the value on all tiles...
        this.tiles = new Array(dimension * dimension).fill(null).map(() => new Tile(null))
        this.mines = []
        setMines(this)
        setCountingMines(this)
    }

    isDiscovered(row, col) {
        return this.tiles[row * this.dimension + col].state == 'discovered'
    }

    isMarked(row, col) {
        return this.tiles[row * this.dimension + col].state == 'marked'
    }

    showTile(row, col) {
        this.tiles[row * this.dimension + col].state = 'discovered'
    }

    toggleMarkTile(row, col) {
        const current = this.tiles[row * this.dimension + col].state
        if (current === 'marked') this.tiles[row * this.dimension + col].state = 'undiscovered'
        if (current === 'undiscovered') this.tiles[row * this.dimension + col].state = 'marked'
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
        // -1 is a Mine
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
