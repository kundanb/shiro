import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { io } from 'socket.io-client'

export default async function startSender() {
  // Ask for the token from the sender
  const { token } = await inquirer.prompt([
    {
      type: 'input',
      name: 'token',
      message: 'Enter the receiver token:',
      validate: (input: string) => input.trim() !== '' || 'Token is required',
    },
  ])

  // Extract receiver's public IP from the token (Base64 Decoding)
  const decoded = Buffer.from(token, 'base64').toString('utf-8')
  const [uid, publicIP] = decoded.split('|')

  console.log(chalk.green(`Connecting to receiver at ws://${publicIP}:3000`))

  // Ask the sender to choose a file
  const currentDir = process.cwd()
  const allFiles = fs.readdirSync(currentDir).filter(f => fs.lstatSync(path.join(currentDir, f)).isFile())

  const { selectedFile } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedFile',
      message: '📄 Choose a file to send:',
      choices: allFiles,
    },
  ])

  const filePath = path.join(currentDir, selectedFile)
  const fileSize = fs.statSync(filePath).size

  const socket = io(`ws://${publicIP}:3000`)

  socket.on('connect', () => {
    console.log(chalk.green(`Connected to receiver at ws://${publicIP}:3000`))

    socket.emit('file-meta', { name: selectedFile, size: fileSize })

    const stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 })
    stream.on('data', chunk => socket.emit('file-chunk', chunk))
    stream.on('end', () => {
      socket.emit('file-complete')
      console.log(chalk.blue('File sent successfully!'))
    })
  })

  socket.on('connect_error', err => {
    console.log(chalk.red('Failed to connect to receiver. Please check the token or receiver IP.'))
    console.error(err)
  })
}
