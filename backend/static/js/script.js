const tryingCount = 6
const colorTypes = ["success", "disabled", "active"]
const maxMinutes = 5

class Game{
    constructor(){
        this.apiHandler = new APIHandler()
        this.colorSchema = new ColorSchema()
        this.wordView = new WordsView(this.colorSchema)
        this.keyboardView = new KeyboardView(this.colorSchema)
        this.addEventListeners()
        this.timer = new Timer(this.timeOver)
        this.start()
    }
    start(){
        this.apiHandler.start_new_game()
    }

    timeOver(){
        // добавить обращение за не угаданным словом
        alert("Время истекло")
    }

    async checkWord(){
        const word = this.wordView.currentWord.getText()
        const {status, data} = await this.apiHandler.checkWord(word)
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
                                this.colorSchema.updateColors(result.letters)
                                this.keyboardView.paintCells()
                                this.wordView.paintCells()
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
        this.timerId = setInterval(() => this.renderTime(), 1000);
        this.timerElement = document.querySelector("#timer")
    }

    renderTime(){
        const currentTime = new Date()
        const sumSecs = Math.floor((currentTime.getTime() - this.startTime.getTime()) / 1000)
        const minute = Math.floor(sumSecs / 60)
        const secs = sumSecs % 60
        let timeText = null
        if (minute >= maxMinutes){
            this.stop()
            this.notifyAboutTimeOver()
            timeText = "00:00"
        } else if (secs === 0){
            timeText = `0${maxMinutes - minute}:00`
        } else if (secs > 50) {
            timeText = `0${maxMinutes - minute - 1}:0${60 - secs}`
        } else {
            timeText = `0${maxMinutes - minute - 1}:${60 - secs}`
        }
        this.timerElement.innerHTML = timeText
    }

    stop(){
        clearInterval(this.timerId)
    }

}

class APIHandler{
    constructor(){}

    async start_new_game(){
        let response = await fetch('/start_new_game/', {
            method: 'POST'
        })
        let data = await response.json()
        return {status: response.status, data: data}
    }

    async checkWord(word){
        let response = await fetch(`/check_word?word=${word}`, {
            method: 'GET'
        })
        let data = await response.json()
        return {status: response.status, data: data}
    }
}

class ColorSchema{
    constructor(){
        this.data = {}
        this.current_word_colors = null
    }

    updateColors(items){
        this.current_word_colors = items
        items.forEach(item => {
            if (!(item.letter.toUpperCase() in this.data)){
                this.data[item.letter.toUpperCase()] = item.color
            } else if (this.data[item.letter.toUpperCase()] === "disabled" && (item.color === "active" || item.color === "success")){
                this.data[item.letter.toUpperCase()] = item.color
            } else if (this.data[item.letter.toUpperCase()] === "active" &&  item.color === "success"){
                this.data[item.letter.toUpperCase()] = item.color
            }
        })
    }

    getColorBySymbol(symbol){
        return this.data[symbol]
    }

    getColorByPositionInWord(position){
        return this.current_word_colors[position].color
    }

}

class WordsView{
    constructor(colorSchema){
        this.tryingNumber = 1
        this.currentWord = new CurrentWord()
        this.colorSchema = colorSchema
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
    
    paintCells(){
        const currentCells = this.getCurrentCells()
        currentCells.forEach((currentCell, index) => {
            let currentSymbol = this.currentWord.data[index]
            let color = this.colorSchema.getColorByPositionInWord(index)
            if (color !== undefined){
                currentCell.classList.remove(...colorTypes)
                currentCell.classList.add(color)
            }
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

class KeyboardView{
    constructor(colorSchema){
        this.colorSchema = colorSchema
    }

    paintCells(){
        const keyElements = document.querySelectorAll(".keyboard__row__item")
        keyElements.forEach(keyElement => {
            let currentSymbol = keyElement.innerText
            let color = this.colorSchema.getColorBySymbol(currentSymbol)
            if (color !== undefined){
                keyElement.classList.add(color)
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