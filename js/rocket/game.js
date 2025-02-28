export class Game {
    constructor() {
        this.points = 0
        this.state = 'stop'
        this.endState = ''
    }

    stop() {
        this.state = 'stop'
    }

    canPlay() {
        return this.state != 'stop' && this.state != 'gameOver'
    }

    start() {
        this.state = 'start'
    }

    startPlaying() {
        this.state = 'playing'
        this.endState = ''
    }

    isPlaying() {
        return this.state == 'playing'
    }

    isGameOver() {
        return this.state == 'gameOver'
    }

    hasLost() {
        return this.endState == 'lost'
    }

    hasWon() {
        this.endState == 'won'
    }

    addPoints(points) {
        this.points += points
    }

    lose() {
        this.endState = 'lost'
        this.state = 'gameOver'
    }

    win() {
        this.endState = 'won'
        this.state = 'gameOver'
    }
}
