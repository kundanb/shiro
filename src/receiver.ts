import inquirer from 'inquirer'
import { io } from 'socket.io-client'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

export default function startReceiver() {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'token',
        message: "Enter the sender's token:",
        validate: (input: string) => input.trim() !== '' || 'Token is required',
      },
    ])
    .then(({ token }) => {
      const socket = io(`ws://localhost:3000`)

      socket.on('connect', () => {
        console.log(chalk.green('Connected to sender!'))
        socket.emit('token-verified', token)
      })

      socket.on('file-meta', ({ name, size }: { name: string; size: number }) => {
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

      socket.on('invalid-token', (message: string) => {
        console.log(chalk.red(message))
      })

      socket.on('connect_error', (err: Error) => {
        console.log(chalk.red('Failed to connect to sender. Please check the token or sender status.'))
        console.error(err)
      })
    })
    .catch((err: Error) => console.error(err))
}
