export class MatrixCoords {
    constructor(row, col) {
        this.row = row
        this.col = col
    }

    equals(other) {
        return this.row == other.row && this.col == other.col
    }
}
