const tryingCount = 6
const colorTypes = ["success", "disabled", "active"]

function checkWordAndGetColors(word){
    console.log(`Handling ${word} on server`)
    return {
        "Й": "success",
        "О": "disabled",
        "Ш": "active"
    }
}


class ColorSchema{
    constructor(){
        this.data = {}
    }

    updateColors(newColorSchema){
        this.data = {...this.data, ...newColorSchema}
    }

    getColorBySymbol(symbol){
        return this.data[symbol]
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
            this.paintCells()
            this.tryingNumber += 1
            this.currentWord.clear()
            this.showCurrentCell()
        } else {
            alert("Game over")
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
            let color = this.colorSchema.getColorBySymbol(currentSymbol)
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
        return this.data.join("")
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

let colorSchema = new ColorSchema()
let wordView = new WordsView(colorSchema)
let keyboardView = new KeyboardView(colorSchema)

buttons = document.querySelectorAll(".keyboard__row__item")
buttons.forEach(button => {
    button.addEventListener("click", event => {
        let buttonType = button.dataset?.action
        switch(buttonType){
            case "check":
                if (wordView.currentWord.isReadyToCheck()){
                    let colors = checkWordAndGetColors(wordView.currentWord.getText())
                    colorSchema.updateColors(colors)
                    keyboardView.paintCells()
                    wordView.startNextTrying()
                } else {
                    wordView.showErrorWhereEmptySymbols()
                }
                break
            case "clear":
                wordView.currentWord.clear()
                wordView.renderCurrentWord()
                break
            case "delete":
                wordView.currentWord.deleteRightSymbol()
                wordView.renderCurrentWord()
                break  
            default:
                let symbol = event.srcElement.innerText
                wordView.currentWord.addSymbol(symbol)
                wordView.renderCurrentWord()
        }
    })
});