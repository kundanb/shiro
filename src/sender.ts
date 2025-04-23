import fs from 'fs'
import path from 'path'
import http from 'http'
import { Server } from 'socket.io'
import inquirer from 'inquirer'
import chalk from 'chalk'
import crypto from 'crypto'

const PORT = 3000

const generateToken = (): string => {
  return crypto.randomBytes(16).toString('hex') // generates a unique token
}

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

      const token = generateToken() // Generate a new token for authentication
      console.log(chalk.green(`\n🚀 Token for receiver: ${token}`))
      console.log(chalk.yellow('Please share this token with the receiver'))

      const app = http.createServer()
      const io = new Server(app)

      app.listen(PORT, () => {
        console.log(chalk.green(`\n🚀 File sender ready on:`))
        console.log(chalk.cyanBright(`ws://localhost:${PORT}`))
        console.log(chalk.yellow('Waiting for receiver to connect...'))
      })

      io.on('connection', socket => {
        console.log(chalk.green('\n🎉 Receiver connected!'))

        socket.on('token-verified', (receivedToken: string) => {
          if (receivedToken === token) {
            console.log(chalk.green('Token verified! Sending file...'))
            socket.emit('file-meta', { name: selectedFile, size: fileSize })

            const stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 })
            stream.on('data', chunk => socket.emit('file-chunk', chunk))
            stream.on('end', () => {
              socket.emit('file-complete')
              console.log(chalk.blue('\n✅ File sent successfully!'))
            })
          } else {
            socket.emit('invalid-token', 'Invalid token. Connection closed.')
            socket.disconnect()
            console.log(chalk.red('❌ Invalid token'))
          }
        })
      })
    })
    .catch(err => console.error(err))
}
