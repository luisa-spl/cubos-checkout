const axios = require('axios');
const fs = require('fs').promises;
const {produtos} = require('../dados/data.json');
const {leituraDoCarrinho, atualizarCarrinho, lerEstoque, limparCarrinho} = require('../dados/funcoes');


async function buscarProduto (req, res){

    const categoria = req.query.categoria;
    const precoInicial = Number(req.query.precoInicial);
    const precoFinal = Number(req.query.precoFinal);
    const produtosEmEstoque = lerEstoque();                    //await produtos.filter(produto => produto.estoque > 0);
   
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
    const produtos = lerEstoque();
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
       
            return res.status(201).json(carAtual);
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
    const produtos = lerEstoque();
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
    res.json(limparCarrinho());

}

async function finalizarCompra(req, res) {
    const {body} = req;
    const carrinho = leituraDoCarrinho(); 
    const produtos = lerEstoque();
    const controleProdutos = produtos;

        if(carrinho.produtos.length < 1){
            return res.status(400).json("O carrinho está vazio");
        }

        for (const item of carrinho.produtos) {
            const itemEstoque = produtos.find(e => e.id === item.id);

            if (item.quantidade > itemEstoque.estoque) {
                return res.status(400).json({mensagem: `o item ${item.nome} não possui estoque suficiente para a sua compra`});
            } 
        }

        if(body.type && body.country && body.name && body.documents){

            if(body.type !== "individual") {
                return res.status(400).json({mensagem: "Este e-commerce realiza vendas apenas para pessoa física"});
            } 
            else if (body.country.length !== 2) {
                return res.status(400).json({mensagem: "O campo 'país' deve conter apenas dois dígitos. Ex: 'br'."});
            }
            else if (body.name.split(" ").length < 2) {
                return res.status(400).json({mensagem: "O campo 'nome' deve conter nome e sobrenome."});
            } 
            else if (body.documents[0].type !== "cpf") {
                return res.status(400).json({mensagem: "Este e-commerce realiza vendas apenas para pessoa física. O documento deve ser um CPF"});
            }
            else if (body.documents[0].number.length !== 11) {
                return res.status(400).json({mensagem: "O número do documento deve conter 11 digítos"});
            }

            for(const num of body.documents[0].number) {
                if(isNaN(num)){
                    return res.status(400).json({mensagem: "O CPF deve conter apenas números"});
                }
            }
        
        } else {
            res.status(400).json({mensagem: "Todos os campos são obrigatórios"});
        }
        
        console.log("Dados validados");

        try{
            for (const item of carrinho.produtos) {
                const itemEstoque = controleProdutos.find(e => e.id === item.id);
                itemEstoque.estoque -= item.quantidade;  
            }
                await fs.writeFile("./dados/data.json",JSON.stringify(controleProdutos, null, "  "));
        }
        catch (error) {
            return res.status(500).json({mensagem: "O estoque não foi atualizado"})
        }

        const resposta =[
            {mensagem: "pedido realizado com sucesso"},
            {carrinho}
        ]
        res.status(201).json(resposta);

        limparCarrinho();

}


module.exports = {
    buscarProduto,
    mostrarCarrinho,
    addProdutoCarrinho,
    alterarCarrinho,
    deletarProduto,
    deletarCarrinho,
    finalizarCompra
}