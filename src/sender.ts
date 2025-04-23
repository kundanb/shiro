import fs from 'fs'
import path from 'path'
import http from 'http'
import { v4 as uuidv4 } from 'uuid'
import inquirer from 'inquirer'
import chalk from 'chalk'
import express from 'express'
import { Server } from 'socket.io'

const PORT = 3000

export default function startSender() {
  const currentDir = process.cwd()
  const allFiles = fs.readdirSync(currentDir).filter(f => fs.lstatSync(path.join(currentDir, f)).isFile())

  inquirer
    .prompt([
      {
        type: 'list',
        name: 'selectedFile',
        message: '📄 Choose a file to send:',
        choices: allFiles,
      },
    ])
    .then(async ({ selectedFile }) => {
      const filePath = path.join(currentDir, selectedFile)
      const fileSize = fs.statSync(filePath).size

      const token = uuidv4()
      console.log(chalk.green(`\n🚀 File sender ready. Share the token with the receiver:`))
      console.log(chalk.cyanBright(`Token: ${token}`))

      const app = express()
      const server = http.createServer(app)
      const io = new Server(server)

      server.listen(PORT, () => {
        console.log(chalk.green(`\nWaiting for receiver to connect using the token...`))
      })

      io.on('connection', socket => {
        socket.emit('request-token')

        socket.on('token-verified', (receivedToken: string) => {
          if (receivedToken === token) {
            console.log(chalk.green('\n🎉 Receiver connected with the correct token! Sending file...'))

            socket.emit('file-meta', { name: selectedFile, size: fileSize })

            const stream = fs.createReadStream(filePath, {
              highWaterMark: 64 * 1024,
            })
            stream.on('data', chunk => socket.emit('file-chunk', chunk))
            stream.on('end', () => {
              socket.emit('file-complete')
              console.log(chalk.blue('\n✅ File sent successfully!'))
            })
          } else {
            console.log(chalk.red('Invalid token. Disconnecting the receiver.'))
            socket.disconnect()
          }
        })
      })
    })
    .catch(err => console.error(err))
}
