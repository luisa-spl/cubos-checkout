const axios = require('axios');
const fs = require('fs').promises;
const {produtos} = require('../dados/data.json');
const {leituraDoCarrinho, atualizarCarrinho} = require('../dados/funcoes');


async function buscarProduto (req, res){

const categoria = req.query.categoria;
const precoInicial = Number(req.query.precoInicial);
const precoFinal = Number(req.query.precoFinal);
const produtosEmEstoque = await produtos.filter(produto => produto.estoque > 0);
   
    if (categoria && !precoFinal && !precoInicial) {
        const filtroCategoria = produtosEmEstoque.filter(produto => produto.categoria === categoria ) 
        res.json(filtroCategoria);
    }
    else if (!categoria && precoFinal && precoInicial) {
        const filtroPreco = produtosEmEstoque.filter(produto => produto.preco >= precoInicial && produto.preco <= precoFinal)
        res.json(filtroPreco);
    }
    else if (categoria && precoFinal && precoInicial) {
        const filtroCategoria = produtosEmEstoque.filter(produto => produto.categoria === categoria )
        const filtroPreco = filtroCategoria.filter(produto => produto.preco >= precoInicial && produto.preco <= precoFinal)
        res.json(filtroPreco);
    }
    else {
        res.json(produtosEmEstoque);
    }
}


async function mostrarCarrinho (req, res) {
    
    res.json(leituraDoCarrinho());

}


async function addProdutoCarrinho (req, res) {

const produtoEscolhido = req.body;
const carrinho = leituraDoCarrinho();
const temProduto = produtos.find(produto => produto.id === produtoEscolhido.id);
const temProdutoNoCarrinho = carrinho.produtos.find(e => e.id === produtoEscolhido.id);

    if(temProduto.estoque == 0){
        return res.status(400).json("Produto não disponível");
    }
    else if (produtoEscolhido.quantidade > temProduto.estoque ) {
        return res.status(400).json(`Só é possível adicionar até ${temProduto.estoque} ${(temProduto.estoque > 1 ? "unidades" : "unidade")} ao carrinho`);
    }
    else if (temProdutoNoCarrinho) {
        return res.status(400).json("Este produto já está no carrinho");
    }
    else {
        try{
            const car = await fs.readFile("./dados/carrinho.json");
            
        
            let carAtual = JSON.parse(car);
            carAtual = atualizarCarrinho(carAtual, temProduto.preco, produtoEscolhido.quantidade);
            
            
            const novaCompra = {
                id: produtoEscolhido.id,
                quantidade: produtoEscolhido.quantidade,
                nome: temProduto.nome,
                preco: temProduto.preco,
                categoria: temProduto.categoria
                }

            carAtual.produtos.push(novaCompra);
        
            await fs.writeFile("./dados/carrinho.json",JSON.stringify(carAtual, null, "  "));
       
            return res.status(200).json(carAtual);
        }
        catch (error){
            
            return res.json("erro");
        }
    }
}

async function alterarCarrinho(req,res) {
    
const produto = Number(req.params.idProduto);
const quantidade = req.body.quantidade;
const carrinho = leituraDoCarrinho(); 
const listaDeProdutos = carrinho.produtos;
const temNoCarrinho = listaDeProdutos.find(e => e.id === produto);
const indice = listaDeProdutos.findIndex(e => e.id === produto);
const temNoEstoque = produtos.find(e => e.id === produto);

    if(!temNoCarrinho){
        res.json("Este produto não está no carrinho");
        res.status(400);
    }else{
        if(quantidade>0){
            if(quantidade+temNoCarrinho.quantidade > temNoEstoque.estoque){
                return res.status(400).json("Estoque insuficiente");
            }
            else{
               try{
                    carrinho.produtos[indice].quantidade += quantidade;
                
                    atualizarCarrinho(carrinho, temNoCarrinho.preco, quantidade);
            
                    await fs.writeFile("./dados/carrinho.json",JSON.stringify(carrinho, null, "  "));
        
                    return res.status(200).json(carrinho); 
                }
                catch (error) {
                   return res.json("erro");
                }
            } 
        }else if (quantidade < 0){
            if(Math.abs(quantidade) > temNoCarrinho.quantidade){
                res.status(400).json("Você está tentando remover mais produtos do que a quantidade existente no carrinho");
            }
            else{
                try{
                    carrinho.produtos[indice].quantidade += quantidade;
                    atualizarCarrinho(carrinho, temNoCarrinho.preco, quantidade);
                   
                    await fs.writeFile("./dados/carrinho.json",JSON.stringify(carrinho, null, "  "));
        
                    return res.status(200).json(carrinho); 
                    
                }
                   catch (error) {
                   return res.json("erro");
                }
            }
        }
    }

}

async function deletarProduto(req,res) {

const produto = Number(req.params.idProduto);
const carrinho = leituraDoCarrinho(); 
const temProduto = carrinho.produtos.find(e => e.id === produto);
const indice = carrinho.produtos.findIndex(e => e.id === produto);

    if(!temProduto) {
        res.status(400).json("Este produto não está no carrinho");
    }
    else{
        try{
            carrinho.produtos.splice(indice,1);

            const preco = -temProduto.preco;
            
            atualizarCarrinho(carrinho, preco, temProduto.quantidade);

            if(carrinho.produtos.length < 1){
                try{
                const vazio = {
                        subtotal: 0,
                        dataDeEntrega: null,
                        valorDoFrete: 0,
                        totalAPagar: 0,
                        produtos: []
                      }
                    
                      await fs.writeFile("./dados/carrinho.json",JSON.stringify(vazio, null, "  "));
                     
                      return res.status(200).json("carrinho está vazio");
                } 
                catch(error){
                    res.status(400).json("carrinho não foi atualizado")
                }
            }

            await fs.writeFile("./dados/carrinho.json",JSON.stringify(carrinho, null, "  "));
            
            res.status(200).json(carrinho);
        }
        catch (error) {
            res.status(400).json("alterações não foram gravadas");
        }

    }
}

async function deletarCarrinho(req,res) {

const carrinho = leituraDoCarrinho(); 

    try{
            carrinho.subtotal = 0;
            carrinho.dataDeEntrega = null;
            carrinho.valorDoFrete = 0;
            carrinho.totalAPagar = 0;
            carrinho.produtos = [];
              
            await fs.writeFile("./dados/carrinho.json",JSON.stringify(carrinho, null, "  "));
             
            return res.status(200).json("Carrinho deletado com sucesso");
        } 
    catch(error){
            res.status(400).json("carrinho não foi deletado")
        }
}


module.exports = {
    buscarProduto,
    mostrarCarrinho,
    addProdutoCarrinho,
    alterarCarrinho,
    deletarProduto,
    deletarCarrinho
}