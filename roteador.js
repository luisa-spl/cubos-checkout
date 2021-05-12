const express = require('express');
const pedidos = require('./controladores/pedidos');

const roteador = express();

roteador.get('/produtos', pedidos.buscarProduto);
roteador.get('/carrinho', pedidos.mostrarCarrinho);
roteador.post('/carrinho/produtos', pedidos.addProdutoCarrinho);
roteador.patch('/carrinho/produtos/:idProduto', pedidos.alterarCarrinho);
roteador.delete('/carrinho/produtos/:idProduto', pedidos.deletarProduto);
roteador.delete('/carrinho', pedidos.deletarCarrinho);
roteador.post('/finalizar-compra', pedidos.finalizarCompra);

module.exports = {roteador};