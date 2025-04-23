const inquirer = require("inquirer");
const { io } = require("socket.io-client");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

function startReceiver() {
  inquirer
    .prompt([
      {
        type: "input",
        name: "senderIP",
        message: "Enter the sender's public IP:",
        validate: (input) => input.trim() !== "" || "IP address is required",
      },
    ])
    .then(({ senderIP }) => {
      const socket = io(`ws://${senderIP}:3000`);

      socket.on("file-meta", ({ name, size }) => {
        console.log(chalk.yellow(`\nReceiving file: ${name} (${size} bytes)`));
        const fileStream = fs.createWriteStream(path.join(process.cwd(), name));

        socket.on("file-chunk", (chunk) => {
          fileStream.write(chunk);
        });

        socket.on("file-complete", () => {
          fileStream.end();
          console.log(chalk.green("\n✅ File received successfully!"));
        });
      });

      socket.on("connect_error", (err) => {
        console.log(
          chalk.red("Failed to connect to sender. Please check the IP.")
        );
        console.error(err);
      });
    })
    .catch((err) => console.error(err));
}

module.exports = { startReceiver };
