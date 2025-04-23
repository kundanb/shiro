#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import http from 'http'
import { v4 as uuidv4 } from 'uuid'
import chalk from 'chalk'
import inquirer from 'inquirer'
import axios from 'axios'
import express from 'express'
import { Server } from 'socket.io'
import { io } from 'socket.io-client'

const PORT = 3000

console.clear()
console.log(`
========================================================
  Shiro CLI
  ---------
  Secure, fast, and user-friendly file transfer tool.
========================================================
`)

async function startCLI() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '🤖 What would you like to do?',
      choices: ['📤 Send File(s)', '📥 Receive File(s)'],
    },
  ])

  if (action.startsWith('📤')) {
    await startSender()
  } else {
    await startReceiver()
  }
}

async function startSender() {
  console.log(chalk.cyan('🚀 Starting File Sender...'))

  const { token } = await inquirer.prompt([
    {
      type: 'input',
      name: 'token',
      message: '🔑 Enter the token provided by the receiver:',
      validate: input => input.trim() !== '' || 'Token cannot be empty.',
    },
  ])

  const currentDir = process.cwd()
  const allFiles = fs.readdirSync(currentDir).filter(f => fs.lstatSync(path.join(currentDir, f)).isFile())

  const { files } = await inquirer.prompt<{ files: string[] }>([
    {
      type: 'checkbox',
      name: 'files',
      message: '📁 Select files to send:',
      choices: allFiles,
    },
  ])

  if (files.length === 0) {
    console.log(chalk.red('❌ No files selected. Exiting...'))
    return
  }

  const decoded = Buffer.from(token, 'base64').toString('utf-8')
  const publicIP = decoded.split('|')[1]
  const uri = `ws://${publicIP}:${PORT}`

  console.log(chalk.green(`🔗 Connecting to receiver at ${uri}...`))

  const socket = io(uri)

  socket.on('connect', () => {
    console.log(chalk.green('✅ Connected to receiver!'))

    let filesSent = 0

    files.forEach(file => {
      const filePath = path.join(currentDir, file)
      const fileSize = fs.statSync(filePath).size

      console.log(chalk.yellow(`📤 Sending: ${file} (${(fileSize / 1024).toFixed(2)} KB)`))
      socket.emit('file-meta', { name: file, size: fileSize })

      const stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 })

      stream.on('data', chunk => socket.emit('file-chunk', chunk))

      stream.on('end', () => {
        socket.emit('file-complete', { name: file })
        console.log(chalk.blue(`✅ ${file} sent successfully!`))

        filesSent++

        if (filesSent === files.length) {
          console.log(chalk.green('🎉 All files sent!'))
          socket.close()
          process.exit(0)
        }
      })
    })
  })

  socket.on('connect_error', err => {
    console.log(chalk.red('❌ Failed to connect to receiver.'))
    console.error(err.message)
    process.exit(1)
  })
}

async function startReceiver() {
  try {
    console.log(chalk.blue('🛠 Initializing Receiver...'))

    const uid = uuidv4()
    const res = await axios.get<{ ip: string }>('https://api.ipify.org?format=json')
    const publicIP = res.data.ip
    const token = Buffer.from(`${uid}|${publicIP}`).toString('base64')

    console.log(chalk.green.bold('\n📋 Your Shiro Token:'))
    console.log(chalk.green(`🔑 Token: ${chalk.yellow(token)}`))
    console.log(chalk.green(`🌍 Public IP: ${chalk.yellow(publicIP)}`))

    const app = express()
    const server = http.createServer(app)
    const io = new Server(server)

    server.listen(PORT, () => {
      console.log(chalk.green('\n🚀 Listening for connections...'))
      console.log(chalk.green(`🌐 ws://${publicIP}:${PORT}`))
      console.log(chalk.yellow('⌛ Waiting for sender...'))
    })

    io.on('connection', socket => {
      console.log(chalk.green('\n🔗 Sender connected!'))

      let fileStream: fs.WriteStream

      socket.on('file-meta', ({ name, size }) => {
        console.log(chalk.blue(`\n📦 Receiving: ${chalk.yellow(name)} (${size} bytes)`))
        fileStream = fs.createWriteStream(path.join(process.cwd(), name))
      })

      socket.on('file-chunk', (chunk: Buffer) => {
        fileStream.write(chunk)
      })

      socket.on('file-complete', () => {
        fileStream.end()
        console.log(chalk.green(`✅ File received successfully! 🎉`))
      })

      socket.on('disconnect', () => {
        console.log(chalk.red('❌ Sender disconnected.'))
      })
    })
  } catch (err) {
    console.error(chalk.red.bold('❗ Error starting receiver:'), (err as Error).message)
  }
}

startCLI()
