"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = startReceiver;
var inquirer_1 = __importDefault(require("inquirer"));
var socket_io_client_1 = require("socket.io-client");
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var chalk_1 = __importDefault(require("chalk"));
function startReceiver() {
    inquirer_1.default
        .prompt([
        {
            type: 'input',
            name: 'token',
            message: "Enter the sender's token:",
            validate: function (input) { return input.trim() !== '' || 'Token is required'; },
        },
    ])
        .then(function (_a) {
        var token = _a.token;
        var socket = (0, socket_io_client_1.io)("ws://localhost:3000");
        socket.on('connect', function () {
            console.log(chalk_1.default.green('Connected to sender!'));
            socket.emit('token-verified', token);
        });
        socket.on('file-meta', function (_a) {
            var name = _a.name, size = _a.size;
            console.log(chalk_1.default.yellow("\nReceiving file: ".concat(name, " (").concat(size, " bytes)")));
            var fileStream = fs_1.default.createWriteStream(path_1.default.join(process.cwd(), name));
            socket.on('file-chunk', function (chunk) {
                fileStream.write(chunk);
            });
            socket.on('file-complete', function () {
                fileStream.end();
                console.log(chalk_1.default.green('\n✅ File received successfully!'));
            });
        });
        socket.on('invalid-token', function (message) {
            console.log(chalk_1.default.red(message));
        });
        socket.on('connect_error', function (err) {
            console.log(chalk_1.default.red('Failed to connect to sender. Please check the token or sender status.'));
            console.error(err);
        });
    })
        .catch(function (err) { return console.error(err); });
}
