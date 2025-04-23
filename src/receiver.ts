import fs from 'fs'
import path from 'path'
import http from 'http'
import { v4 as uuidv4 } from 'uuid'
import chalk from 'chalk'
import axios from 'axios'
import express from 'express'
import { Server } from 'socket.io'

const PORT = 3000

export default async function startReceiver() {
  try {
    const uid = uuidv4()

    // Get public IP using ipify API
    const res = await axios.get<{ ip: string }>('https://api.ipify.org?format=json')
    const publicIP = res.data.ip

    // Generate the token (UUID + Public IP)
    const token = Buffer.from(`${uid}|${publicIP}`).toString('base64')

    console.log(chalk.green(`Your token: ${token}`))
    console.log(chalk.green(`Receiver's public IP: ${publicIP}`))

    // Create an Express server and set up Socket.IO
    const app = express()
    const server = http.createServer(app)
    const io = new Server(server)

    server.listen(PORT, () => {
      console.log(chalk.green(`Receiver listening on ws://${publicIP}:${PORT}`))
      console.log(chalk.yellow('Waiting for sender to connect...'))
    })

    // Listen for incoming file transfer
    io.on('connection', socket => {
      console.log(chalk.green('Sender connected! Waiting for file transfer...'))

      socket.on('file-meta', ({ name, size }) => {
        console.log(chalk.yellow(`Receiving file: ${name} (${size} bytes)`))

        // Create a stream to write the received file
        const fileStream = fs.createWriteStream(path.join(process.cwd(), name))

        // Write file chunks
        socket.on('file-chunk', (chunk: Buffer) => {
          fileStream.write(chunk)
        })

        // Complete the file transfer
        socket.on('file-complete', () => {
          fileStream.end()
          console.log(chalk.green('File received successfully!'))
        })
      })
    })
  } catch (error) {
    console.error(chalk.red('Error starting receiver:', error))
  }
}
