const tryingCount = 6
const colorTypes = ["success", "disabled", "active"]
const maxMinutes = 5

class Game{
    constructor(){
        this.wordView = new WordsView(this.colorSchema)
        this.keyboardColorPainter = new KeyboardColorPainter()
        this.addEventListeners()
        this.timer = new Timer(this.timeOver)
        this.start()
    }
    start(){
        APIHandler.start_new_game()
    }

    timeOver(){
        // добавить обращение за не угаданным словом
        alert("Время истекло")
    }

    async checkWord(){
        const word = this.wordView.currentWord.getText()
        const {status, data} = await APIHandler.checkWord(word)
        if (status === 200){
            return data
        } else {
            throw new Error(data.message)
        }

    }
    addEventListeners(){
        const buttons = document.querySelectorAll(".keyboard__row__item")
        buttons.forEach(button => {
            button.addEventListener("click", async event => {
                let buttonType = button.dataset?.action
                switch(buttonType){
                    case "check":
                        if (this.wordView.currentWord.isReadyToCheck()){
                            try{
                                let result = await this.checkWord()
                                this.keyboardColorPainter.paint(result.letters)
                                CurrentWordColorPainter.paint(this.wordView.getCurrentCells(), result.letters)
                                switch (result.game_status){
                                    case "loss":
                                        this.timer.stop()
                                        alert(result.message)
                                        break
                                    case "victory":
                                        this.timer.stop()
                                        alert(result.message)
                                        break
                                    case "continues":
                                        this.wordView.startNextTrying()
                                }
                            } catch(e){
                                alert(e.message)
                            }
                        } else {
                            this.wordView.showErrorWhereEmptySymbols()
                        }
                        break
                    case "clear":
                        this.wordView.currentWord.clear()
                        this.wordView.renderCurrentWord()
                        break
                    case "delete":
                        this.wordView.currentWord.deleteRightSymbol()
                        this.wordView.renderCurrentWord()
                        break
                    default:
                        let symbol = event.srcElement.innerText
                        this.wordView.currentWord.addSymbol(symbol)
                        this.wordView.renderCurrentWord()
                }
            })
        });
    }
}

class Timer{
    constructor(notifyAboutTimeOver){
        this.startTime = new Date()
        this.notifyAboutTimeOver = notifyAboutTimeOver
        this.timerId = setInterval(() => this.handleTime(), 1000);
        this.timerElement = document.querySelector("#timer")
    }

    handleTime(){
        const [minute, secs] = this.getCurrentTime()
        this.renderTime(minute, secs)
        if (minute >= maxMinutes){
            this.stop()
            this.notifyAboutTimeOver()
        }
    }

    getCurrentTime(){
        const currentTime = new Date()
        const sumSecs = Math.floor((currentTime.getTime() - this.startTime.getTime()) / 1000)
        const minute = Math.floor(sumSecs / 60)
        const secs = sumSecs % 60
        return [minute, secs]
    }

    renderTime(minute, secs){
        const timeString = this.getPreparedTimeString(minute, secs)
        this.timerElement.innerHTML = timeString
    }

    getPreparedTimeString(minute, secs){
        if (minute >= maxMinutes){
            return "00:00"
        } else if (secs === 0){
            return `0${maxMinutes - minute}:00`
        } else if (secs > 50) {
            return `0${maxMinutes - minute - 1}:0${60 - secs}`
        }
        return `0${maxMinutes - minute - 1}:${60 - secs}`
    }

    stop(){
        clearInterval(this.timerId)
    }

}

class APIHandler{
    static async getDataFromResponse(response){
        let data = await response.json()
        return {
            status: response.status,
            data: data
        }
    }

    static async start_new_game(){
        let response = await fetch('/start_new_game/', {
            method: 'POST'
        })
        return await APIHandler.getDataFromResponse(response)
    }

    static async checkWord(word){
        let response = await fetch(`/check_word/?word=${word}`, {
            method: 'GET'
        })
        return await APIHandler.getDataFromResponse(response)
    }
}

class CurrentWordColorPainter{
    static paint(elements, colors){
        elements.forEach((element, index) => {
            element.classList.add(colors[index].color)
        })
    }
}

class WordsView{
    constructor(){
        this.tryingNumber = 1
        this.currentWord = new CurrentWord()
        this.showCurrentCell()
    }

    startNextTrying(){
        if (this.tryingNumber < tryingCount){
            this.tryingNumber += 1
            this.currentWord.clear()
            this.showCurrentCell()
        }
    }

    renderCurrentWord(){
        this.showCurrentText()
        this.showCurrentCell()
    }

    getCurrentCells(){
        const wordRows = document.querySelectorAll(".words__row")
        const currentCells = [...wordRows[this.tryingNumber - 1].children]
        return currentCells
    }

    showCurrentCell(){
        const currentCells = this.getCurrentCells()
        currentCells.forEach((currentCell, index) => {
            currentCell.classList.remove("current")
            if (index === this.currentWord.index){
                currentCell.classList.add("current")
            } 
        })
    }

    showCurrentText(){
        const currentCells = this.getCurrentCells()
        currentCells.forEach((currentCell, index) => {
            let currentSymbol = this.currentWord.data[index]
            currentCell.innerHTML = currentSymbol
        })
    }

    showErrorWhereEmptySymbols(){
        const currentCells = this.getCurrentCells()
        this.currentWord.data.forEach((currentSymbol, index) => {
            if (currentSymbol === ""){
                currentCells[index].classList.add("empty_symbol_error")
                setTimeout(() => {
                    currentCells[index].classList.remove("empty_symbol_error")
                }, 500)
                
            }
        })
    }
}

class KeyboardColorPainter{
    constructor(colorSchema){
        this.colorSchema = {}
        this.elements = document.querySelectorAll(".keyboard__row__item")
    }

    paint(letterList){
        this.updateColors(letterList)
        this.paintElements()
    }

    updateColors(letterList){
        letterList.forEach(letterItem => {
            const letter = letterItem.letter.toUpperCase()
            const color = letterItem.color
            if (!(letter in this.colorSchema)){
                this.colorSchema[letter] = color
            } else if (this.colorSchema[letter] === "disabled" && (color === "active" || color === "success")){
                this.colorSchema[letter] = color
            } else if (this.colorSchema[letter] === "active" &&  color === "success"){
                this.colorSchema[letter] = color
            }
        })
    }

    paintElements(){
        this.elements.forEach(element => {
            const currentSymbol = element.innerText
            const color = this.colorSchema[currentSymbol]
            if (color !== undefined){
                element.classList.remove(...colorTypes)
                element.classList.add(color)
            } 
        })
    }
}

class CurrentWord {
    constructor(n_symbols = 5){
        this.n_symbols = n_symbols
        this.index = null
        this.data = null
        this.clear()
    }

    isReadyToCheck(){
        return this.getText().length === this.n_symbols
    }

    getText(){
        return this.data.join("").toLowerCase()
    }

    clear(){
        this.index = 0
        this.data = new Array(this.n_symbols).fill("");
    }

    deleteRightSymbol(){
        if (this.index > 0){
            this.index -= 1
            this.data[this.index] = ""
        }
    }

    addSymbol(symbol){
        if (this.index < this.n_symbols){
            this.data[this.index] = symbol
            this.index += 1
        }
    }
}

game = new Game()