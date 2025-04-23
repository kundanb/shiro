#!/usr/bin/env node

import inquirer from 'inquirer'
import startSender from '../sender'
import startReceiver from '../receiver'

async function main() {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: ['Send File', 'Receive File'],
    },
  ])

  if (action === 'Send File') {
    startSender()
  } else {
    startReceiver()
  }
}

main()
