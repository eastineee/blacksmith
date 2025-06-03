const { Router } = require("express")

const productsRouter = Router()

const controllers = require("../controllers/products-controllers")

// Route prefix /api/products
productsRouter.get('/', controllers.getProducts)
productsRouter.get('/:id', controllers.getProduct)

module.exports = productsRouter