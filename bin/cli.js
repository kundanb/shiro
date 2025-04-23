#!/usr/bin/env node

const inquirer = require("inquirer");

const { startSender } = require("../sender.js");
const { startReceiver } = require("../receiver.js");

async function main() {
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: ["Send File", "Receive File"],
    },
  ]);

  if (action === "Send File") {
    await startSender();
  } else {
    await startReceiver();
  }
}

main().catch((err) => console.error(err));
