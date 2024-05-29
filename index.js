/**
 * 1 - Monitoramento
 * 2 - Estratégia
 * 3 - Trade
 */

const WebSocket = require("ws");
const axios = require("axios");
const crypto = require("crypto");


const base_url = process.env.ENVIRONMENT === 'PROD' ? process.env.STREAM_URL_BIANCE_PROD : process.env.STREAM_URL_BIANCE_DEV;
const PROFITABILITY = parseFloat(process.env.PROFITABILITY)

let sellPrice = 0

const ws = new WebSocket(`${base_url}/${process.env.SYMBOL.toLowerCase()}@ticker`);

ws.onmessage = (event) => {
  console.clear()
  const object = JSON.parse(event.data);
  const currentPrice = parseFloat(object.a)

  console.log('Symbol ->', object.s)
  console.log('Price current ->', object.a)

  if (sellPrice === 0 && currentPrice <= parseFloat(process.env.TO_BUY)) {
    console.log('bom para compra ')
    newOrder('0.001', 'BUY')
    sellPrice = currentPrice * PROFITABILITY
  } else if (currentPrice >= sellPrice && sellPrice !== 0) {
    console.log('bom para venda ')
    newOrder('0.001', 'SELL')
    sellPrice = 0
  } else {
    console.log('esperando...  Sell price:', sellPrice)
  }
}

const newOrder = async (quantity, side) => {

  const timestamp = Date.now();
  const recvWindow = 30_000 // max time order
  const data = {
    symbol: process.env.SYMBOL,
    type: 'MARKET', // sell/buy for price market
    side,
    quantity,
    timestamp,
    recvWindow
  }

  const signature = crypto
    .createHmac('sha256', process.env.SECRET_KEY)
    .update(`${new URLSearchParams({ ...data })}`)
    .digest('hex') // convert bit for hexadecimal

  const newData = { ...data, signature }
  const queryString = `?${new URLSearchParams(newData)}`

  try {

    const response = await axios({
      method: 'POST',
      url: `${process.env.API_BINANCE_DEV}/v3/order${queryString}`,
      headers: { 'X-MBX-APIKEY': process.env.API_KEY }
    })

    console.log(response.data)

  } catch (error) {
    console.log(error)
  }


}