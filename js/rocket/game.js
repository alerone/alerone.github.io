export class Game {
    constructor() {
        this.points = 0
        this.playing = false
        this.end = ''
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

    lose() {
        this.end = 'lost'
        this.playing = false
    }

    win() {
        this.end = 'win'
        this.playing = false
    }
}
