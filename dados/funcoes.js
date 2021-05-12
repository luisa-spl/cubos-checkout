const fs = require('fs');
const {addBusinessDays} = require('date-fns');

let carrinho;


function leituraDoCarrinho() {
    try{
        carrinho = JSON.parse(fs.readFileSync("./dados/carrinho.json").toString());
        return (carrinho)
    }
    catch(error) {
       carrinho = { 
            produtos: [],
            subtotal: 0,
            dataDeEntrega: null,
            valorDoFrete: 0,
            totalAPagar: 0
            }
        return carrinho;
    };

    
}

function atualizarCarrinho(carAtual, preco, quantidade ) {
    carAtual.subtotal += preco*quantidade;
    carAtual.dataDeEntrega = addBusinessDays(Date.now(), 15);
    carAtual.valorDoFrete = (carAtual.subtotal > 20000 ? 0 : 5000);
    carAtual.totalAPagar = carAtual.subtotal+carAtual.valorDoFrete;

    return carAtual;
}



module.exports = {
    leituraDoCarrinho,
    atualizarCarrinho,
};