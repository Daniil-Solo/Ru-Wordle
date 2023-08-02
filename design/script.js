const tryingCount = 6

class WordsView{
    constructor(){
        this.tryingNumber = 1
        this.currentWord = new CurrentWord()
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
            symbolElement.innerHTML = this.currentWord.data[index]
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

let wordView = new WordsView()


buttons = document.querySelectorAll(".keyboard__row__item")
buttons.forEach(button => {
    button.addEventListener("click", event => {
        let buttonType = button.dataset?.action
        switch(buttonType){
            case "check":
                alert("checking")
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