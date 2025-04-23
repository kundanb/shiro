import fs from 'fs'
import path from 'path'
import http from 'http'
import inquirer from 'inquirer'
import chalk from 'chalk'
import fetch from 'node-fetch'
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

      const res = await fetch('https://api.ipify.org?format=json')
      const publicIP = ((await res.json()) as { ip: string }).ip

      const app = express()
      const server = http.createServer(app)
      const io = new Server(server)

      server.listen(PORT, () => {
        console.log(chalk.green(`\n🚀 File sender ready on:`))
        console.log(chalk.cyanBright(`ws://${publicIP}:${PORT}`))
        console.log(chalk.yellow('Waiting for receiver to connect...'))
      })

      io.on('connection', socket => {
        console.log(chalk.green('\n🎉 Receiver connected! Sending file...'))

        socket.emit('file-meta', { name: selectedFile, size: fileSize })

        const stream = fs.createReadStream(filePath, {
          highWaterMark: 64 * 1024,
        })
        stream.on('data', chunk => socket.emit('file-chunk', chunk))
        stream.on('end', () => {
          socket.emit('file-complete')
          console.log(chalk.blue('\n✅ File sent successfully!'))
        })
      })
    })
    .catch(err => console.error(err))
}
