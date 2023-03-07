import * as amqp from 'amqplib'
import { substractStock } from '../product/product.controller'
const queue = 'order'


export default async function subscriber(){
    const connection = await amqp.connect('amqp://localhost')
    const channel = await  connection.createChannel()

    await channel.assertQueue(queue)

    channel.consume(queue, async (message: any) => {
        const content = JSON.parse(message.content.toString())

        console.log(`Mensaje recibido de la cola: ${queue}`)
        //console.log(content)
        console.log(content.products)
        console.log(content.quantity)

        for (let i=0; i<content.products.length;i++){
            if (await substractStock(content.products[i],content.quantity[i]) == false){
              console.log('Ocurrio un error al actualizar el stock')
              console.log('Producto: ' + content.products[i],'Cantidad: ' + content.quantity[i])
              return
            }
          }
        
        channel.ack(message)
    })
}

subscriber().catch((error)=>{
    console.log(error)
    process.exit(1)
})
