import httpStatus from 'http-status';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import catchAsync from '../utils/catchAsync';
import ApiError from '../errors/ApiError';
import pick from '../utils/pick';
import { IOptions } from '../paginate/paginate';
import * as productService from './product.service';
import * as amqp from 'amqplib'

var channel: amqp.Channel, connection;
var queue = 'product'
var queue2 = 'product_update'
var queue3 = 'product_delete'



async function connect() {
  const amqpServer = "amqp://localhost:5672";
  connection = await amqp.connect(amqpServer);
  channel = await connection.createChannel();
  await channel.assertQueue("product");
  await channel.assertQueue("product_update");
  await channel.assertQueue("product_delete");

}
connect();


export const createProduct = catchAsync(async (req: Request, res: Response) => {
    req.body.user = req.user._id
    const product = await productService.createProduct(req.body);
    console.log(product)
    const sent = await channel.sendToQueue(
      "product",
      Buffer.from(
          JSON.stringify({
              product
          })
      )
  );
  sent
            ? console.log(`Sent message to "${queue}" queue`, product)
            : console.log(`Fails sending message to "${queue}" queue`, req.body)

    res.status(httpStatus.CREATED).send(product);
});

export async function checkStock(product: any,quantity: number){
  //console.log(product)
  let productData = await productService.getProductById(new mongoose.Types.ObjectId(product))
  //console.log('data: '+productData)
  if (productData != null){
    if (productData.stock < quantity){
      return false
    }
    return true
  }
  return false
}

export async function substractStock(product: any, quantity: any){
  if (await checkStock(product,quantity)){
    let productData = await productService.getProductById(new mongoose.Types.ObjectId(product))
    if (productData != null){
      productData.stock = productData.stock - quantity
      const updateProduct = await productService.updateProductById(new mongoose.Types.ObjectId(product), productData);
      console.log('Stock actualizado')
      return updateProduct
    }
  }
  console.log(`Product ${product} no cuenta con stock suficiente`)
  return false
}

export const getProducts = catchAsync(async (req: Request, res: Response) => {
  const filter = {user:req.user._id};
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await productService.queryProducts(filter, options);
  res.send(result);
});

export const getProduct = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['productId'] === 'string') {
    const product = await productService.getProductById(new mongoose.Types.ObjectId(req.params['productId']));
    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
    }
    res.send(product);
  }
});

export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['productId'] === 'string') {
    const product = await productService.updateProductById(new mongoose.Types.ObjectId(req.params['productId']), req.body);
    const productId = req.params['productId']
    const sent = await channel.sendToQueue(
      "product_update",
      Buffer.from(
          JSON.stringify({
              productId,
              product
          })
      )
  );
  sent
            ? console.log(`Sent message to "${queue2}" queue`, productId)
            : console.log(`Fails sending message to "${queue2}" queue`, productId)
    res.send(product);
  }
});

export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params['productId'] === 'string') {
    await productService.deleteProductById(new mongoose.Types.ObjectId(req.params['productId']));
    const productId = req.params['productId']
    const sent = await channel.sendToQueue(
      "product_delete",
      Buffer.from(
          JSON.stringify({
              productId
          })
      )
  );
  sent
            ? console.log(`Sent message to "${queue3}" queue`, productId)
            : console.log(`Fails sending message to "${queue3}" queue`, productId)

    res.status(httpStatus.NO_CONTENT).send();
  }
});
