const {createServer} = require('http')
const {appendFile} = require('fs')
const {promisify} = require('util')

const port = 50084
const file = 'events.log'

const append = promisify(appendFile)
const postData = (req) => {
  return new Promise(function(resolve, reject) {
    let data = ''
    req.on('data', chunk => {
      if(!data) data = chunk
      else data = Buffer.concat([data, chunk])
    })
    req.on('end', () => {
      if(!req.complete) {
        reject(new Error('Incomplete Request'))
      }
      resolve(data);
    })
  })
}

createServer(async (req, resp) => {
  const data = await postData(req)
  try {
    await append(file, time() + data + '\n')
    try {
      resp.writeHead(204, {
        'Access-Control-Allow-Origin': '*'
      })
      resp.end()
    } catch(e) {}
  } catch(e) {
    console.error(e.stack)
    try {
      resp.writeHead(500, {
        'Access-Control-Allow-Origin': '*'
      })
      resp.end()
    } catch(e) {}
  }
}).listen(port)

const time = () => {
  const date = new Date()
  let month = date.getMonth() + 1
  let strDate = date.getDate()
  if (month >= 1 && month <= 9) {
    month = '0' + month
  }
  if (strDate >= 0 && strDate <= 9) {
    strDate = '0' + strDate
  }
  let Hours = date.getHours()
  let Minutes = date.getMinutes()
  let Seconds = date.getSeconds()

  if (Hours >= 0 && Hours <= 9) {
    Hours = '0' + Hours
  }
  if (Minutes >= 0 && Minutes <= 9) {
    Minutes = '0' + Minutes
  }
  if (Seconds >= 0 && Seconds <= 9) {
    Seconds = '0' + Seconds
  }
  return `[${date.getFullYear()}-${month}-${strDate} ${Hours}:${Minutes}:${Seconds}] `
}
