const fs = require('fs');
const {addBusinessDays} = require('date-fns');

let carrinho;
let produtos;

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
    carAtual.dataDeEntrega = addBusinessDays(Date.now(), 15)
    carAtual.valorDoFrete = (carAtual.subtotal > 20000 ? 0 : 5000);
    carAtual.totalAPagar = carAtual.subtotal+carAtual.valorDoFrete;

    return carAtual;
}

function lerEstoque() {

    try{
        produtos = JSON.parse(fs.readFileSync("./dados/data.json").toString());
        return (produtos);
    }catch (error) {
        return res.status(500).json("Não foi possível consultar o estoque");
    }
}

function limparCarrinho() {

    try{
       carrinho = JSON.parse(fs.readFileSync("./dados/carrinho.json").toString());
       
        carrinho.subtotal = 0;
        carrinho.dataDeEntrega = null;
        carrinho.valorDoFrete = 0;
        carrinho.totalAPagar = 0;
        carrinho.produtos = [];
          
        fs.writeFileSync("./dados/carrinho.json",JSON.stringify(carrinho, null, "  "));
         
        return ("Carrinho deletado com sucesso");
    } 
catch(error){
        return("carrinho não foi deletado");
    }
}


module.exports = {
    leituraDoCarrinho,
    atualizarCarrinho,
    lerEstoque,
    limparCarrinho
};