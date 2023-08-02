let trying_number = 1

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

let current_word = new CurrentWord()


buttons = document.querySelectorAll(".keyboard__row__item")
buttons.forEach(button => {
    button.addEventListener("click", event => {
        let buttonType = button.dataset?.action
        switch(buttonType){
            case "check":
                alert("checking")
                break
            case "clear":
                current_word.clear()
                break
            default:
                let symbol = event.srcElement.innerText
                current_word.addSymbol(symbol)
        }
    })
});