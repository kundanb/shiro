import fs from 'fs'
import path from 'path'
import inquirer from 'inquirer'
import chalk from 'chalk'
import { io } from 'socket.io-client'

interface FileMeta {
  name: string
  size: number
}

export default function startReceiver(): void {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'token',
        message: 'Enter the token provided by the sender:',
        validate: (input: string) => input.trim() !== '' || 'Token is required',
      },
    ])
    .then(({ token }: { token: string }) => {
      const socket = io(`ws://localhost:3000`)

      socket.on('request-token', () => {
        socket.emit('token-verified', token)
      })

      socket.on('file-meta', ({ name, size }: FileMeta) => {
        console.log(chalk.yellow(`\nReceiving file: ${name} (${size} bytes)`))
        const fileStream = fs.createWriteStream(path.join(process.cwd(), name))

        socket.on('file-chunk', (chunk: Buffer) => {
          fileStream.write(chunk)
        })

        socket.on('file-complete', () => {
          fileStream.end()
          console.log(chalk.green('\n✅ File received successfully!'))
        })
      })

      socket.on('connect_error', (err: Error) => {
        console.log(chalk.red('Failed to connect to sender. Please check the token.'))
        console.error(err)
      })
    })
    .catch((err: Error) => console.error(err))
}
