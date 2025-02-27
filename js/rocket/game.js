export class Game {
    constructor() {
        this.points = 0
        this.playing = false
    }

    start() {
        this.playing = true
    }

    isPlaying() {
        return this.playing
    }

    addPoints(points) {
        this.points += points
    }
}
