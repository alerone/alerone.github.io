import * as BOARD from './board.js'
import { Game } from './game.js'
export class Menu {
    /**
     * @param{Game}game
     * @param{BOARD.Board}board
     * */
    constructor(game, board) {
        this.game = game
        this.board = board
        this.gameMenu = document.querySelector('#game-menu')
        this.diffMenu = document.querySelector('#difficulty-menu')
        this.getMarcador()
        this.getButtons()
        this.initEvents()
        this.showingMenu = true
    }

    reset(board, game) {
        this.board = board
        this.game = game
    }

    initEvents() {
        this.btnPlay.addEventListener('click', this.playEvent.bind(this))
        this.btnDiff.addEventListener('click', this.diffMenuEvent.bind(this))
        this.btnCreative.addEventListener('click', this.toggleCreativeEvent.bind(this))
        this.btnEasy.addEventListener(
            'click',
            this.changeDiffEvent.bind(this, BOARD.EASY, this.btnEasy)
        )
        this.btnMedium.addEventListener(
            'click',
            this.changeDiffEvent.bind(this, BOARD.MEDIUM, this.btnMedium)
        )
        this.btnHard.addEventListener(
            'click',
            this.changeDiffEvent.bind(this, BOARD.HARD, this.btnHard)
        )
        this.btnBack.addEventListener('click', this.backEvent.bind(this))
    }

    getMarcador() {
        this.nRockets = document.getElementById('explosivos')
        this.diffLabel = document.getElementById('diff')
        this.creativeLabel = document.getElementById('creative')
    }

    getButtons() {
        this.btnPlay = document.querySelector('#btn-play')
        this.btnDiff = document.querySelector('#btn-difficulty')
        this.btnCreative = document.querySelector('#btn-creative')
        this.btnEasy = document.querySelector('#btn-easy')
        this.btnMedium = document.querySelector('#btn-medium')
        this.btnHard = document.querySelector('#btn-hard')
        this.diffBtns = new Map([
            [this.btnEasy, 'blue'],
            [this.btnMedium, 'yellow'],
            [this.btnHard, 'purple'],
        ])
        this.count = 0
        this.btnBack = document.querySelector('#btn-back')
    }

    isShowingMenu() {
        return this.showingMenu
    }

    playEvent() {
        this.gameMenu.classList.add('hidden')
        console.log(this.game)
        this.game.start()
        // actualiza la dificultad que se puede haber cambiado con los botones de dificultad
        this.board.updateDifficulty()
        this.showingMenu = false
    }

    showMenu() {
        this.gameMenu.classList.remove('hidden')
        this.showingMenu = true
    }

    diffMenuEvent() {
        this.gameMenu.classList.add('hidden')
        this.diffMenu.classList.remove('hidden')
    }

    changeDiffEvent(diff, button) {
        this.diffBtns.forEach((btnColor, btn) => {
            const buttonColor = this.diffBtns.get(button)
            const isActive = btnColor === buttonColor
            buttonColours(btn, isActive, btnColor)
        })

        this.board.setDifficulty(diff)
        this.diffLabel.innerText = 'Dificultad: ' + this.board.difficultyToString(diff)
        this.nRockets.innerText = 'Explosivos: ' + this.board.nMines
    }
    toggleCreativeEvent() {
        this.board.toggleCreative()
        const isCreative = this.board.creative
        const isCreativeToString = isCreative ? 'Sí' : 'No'
        this.creativeLabel.innerText = 'Mostrar cohetes: ' + isCreativeToString
        buttonColours(this.btnCreative, isCreative, 'green', 'gray')
    }

    backEvent() {
        this.gameMenu.classList.remove('hidden')
        this.diffMenu.classList.add('hidden')
    }
}

function buttonColours(button, isActive, colorActive) {
    if (isActive) {
        button.classList.add(`bg-${colorActive}-600`)
        button.classList.add(`hover:bg-${colorActive}-700`)
        button.classList.remove(`bg-gray-500`)
        button.classList.remove(`hover:bg-gray-600`)
    } else {
        button.classList.remove(`bg-${colorActive}-600`)
        button.classList.remove(`hover:bg-${colorActive}-700`)
        button.classList.add(`bg-gray-500`)
        button.classList.add(`hover:bg-gray-600`)
    }
}
