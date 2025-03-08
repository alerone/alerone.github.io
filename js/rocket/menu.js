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
        this.infoMenu = document.querySelector('#controls-menu')
        this.getMarcador()
        this.getButtons()
        this.initEvents()
        this.showingMenu = true
        if (this.gui) this.gui.domElement.style.display = 'none'
    }

    reset(board, game) {
        this.board = board
        this.game = game
    }

    setGUI(gui) {
        this.gui = gui
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
        this.infoBtn.addEventListener('click', this.infoEvent.bind(this))
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
        this.infoBtn = document.querySelector('#info-btn')
        this.infoActive = false
    }

    isShowingMenu() {
        return this.showingMenu
    }

    playEvent() {
        if (!this.canPressPlay) return
        this.gameMenu.classList.add('hidden')
        this.game.start()
        // actualiza la dificultad que se puede haber cambiado con los botones de dificultad
        this.board.updateDifficulty()
        this.showingMenu = false
        if (this.gui) this.gui.domElement.style.display = ''
        if (this.outTitleFunction) {
            this.outTitleFunction()
        }
    }

    setCanPressPlay(val) {
        this.canPressPlay = val
    }

    hideMenu() {
        this.gameMenu.classList.add('hidden')
        this.showingMenu = false
    }

    showMenu() {
        if (!this.infoActive) {
            this.gameMenu.classList.remove('hidden')
        }
        this.showingMenu = true
        if (this.gui) this.gui.domElement.style.display = 'none'
        if (this.inTitleFunction) {
            this.inTitleFunction()
        }
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
        this.nRockets.innerText = 'Explosivos: ' + this.board.nRockets
    }

    changeDiff(diff) {
        switch (diff) {
            case BOARD.EASY:
                this.changeDiffEvent(BOARD.EASY, this.btnEasy)
                break
            case BOARD.MEDIUM:
                this.changeDiffEvent(BOARD.MEDIUM, this.btnMedium)
                break
            default:
                this.changeDiffEvent(BOARD.HARD, this.btnHard)
                break
        }
    }

    toggleCreativeEvent() {
        this.board.toggleCreative()
        const isCreative = this.board.creative
        const isCreativeToString = isCreative ? 'Sí' : 'No'
        this.creativeLabel.innerText = 'Mostrar cohetes: ' + isCreativeToString
        buttonColours(this.btnCreative, isCreative, 'green', 'gray')
    }

    setCreative(newVal) {
        this.board.setCreative(newVal)
        const isCreativeToString = newVal ? 'Sí' : 'No'
        this.creativeLabel.innerText = 'Mostrar cohetes: ' + isCreativeToString
        buttonColours(this.btnCreative, newVal, 'green', 'gray')
    }

    backEvent() {
        this.gameMenu.classList.remove('hidden')
        this.diffMenu.classList.add('hidden')
    }

    setInTitleFunction(func) {
        this.inTitleFunction = func
    }

    setOutTitleFunction(func) {
        this.outTitleFunction = func
    }

    infoEvent() {
        this.infoActive = !this.infoActive
        if (this.infoActive) {
            this.infoBtn.classList.add('bg-blue-500')
            this.infoBtn.classList.add('hover:bg-blue-600')
            this.infoBtn.classList.add('text-white')
            this.infoBtn.classList.remove('bg-white')
            this.infoBtn.classList.remove('hover:bg-gray-200')
            this.infoBtn.classList.remove('text-gray-800')
            this.infoMenu.classList.remove('hidden')
            if (this.showingMenu) {
                this.gameMenu.classList.add('hidden')
            }
        } else {
            this.infoBtn.classList.remove('bg-blue-500')
            this.infoBtn.classList.remove('hover:bg-blue-600')
            this.infoBtn.classList.remove('text-white')
            this.infoBtn.classList.add('bg-white')
            this.infoBtn.classList.add('hover:bg-gray-200')
            this.infoBtn.classList.add('text-gray-800')
            this.infoMenu.classList.add('hidden')
            if (this.showingMenu) {
                this.gameMenu.classList.remove('hidden')
            }
        }
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
