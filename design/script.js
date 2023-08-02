const tryingCount = 6


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
    }

    startNextTrying(){
        if (this.tryingNumber < tryingCount){
            this.tryingNumber += 1
            this.currentWord.clear()
        } else {
            alert("Game over")
        }
    }

    updateView(){
        const wordElements = document.querySelectorAll(".words__row")
        let symbolElements = [...wordElements[this.tryingNumber - 1].children]
        symbolElements.forEach((symbolElement, index) => {
            let currentSymbol = this.currentWord.data[index]
            let color = this.colorSchema.getColorBySymbol(currentSymbol)
            if (color !== undefined){
                symbolElement.classList.add(color)
            } 
            symbolElement.innerHTML = currentSymbol
        })
    }
}

class KeyboardView{
    constructor(colorSchema){
        this.colorSchema = colorSchema
    }

    updateView(){
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
                let colors = checkWordAndGetColors(wordView.currentWord.getText())
                colorSchema.updateColors(colors)
                keyboardView.updateView()
                wordView.updateView()
                wordView.startNextTrying()
                break
            case "clear":
                wordView.currentWord.clear()
                wordView.updateView()
                break
            case "delete":
                wordView.currentWord.deleteRightSymbol()
                wordView.updateView()
                break  
            default:
                let symbol = event.srcElement.innerText
                wordView.currentWord.addSymbol(symbol)
                wordView.updateView()
        }
    })
});