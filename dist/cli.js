#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var http_1 = __importDefault(require("http"));
var uuid_1 = require("uuid");
var chalk_1 = __importDefault(require("chalk"));
var inquirer_1 = __importDefault(require("inquirer"));
var axios_1 = __importDefault(require("axios"));
var express_1 = __importDefault(require("express"));
var socket_io_1 = require("socket.io");
var socket_io_client_1 = require("socket.io-client");
var PORT = 3000;
console.clear();
console.log("\n========================================================\n  Shiro CLI\n  ---------\n  Secure, fast, and user-friendly file transfer tool.\n========================================================\n");
function startCLI() {
    return __awaiter(this, void 0, void 0, function () {
        var action;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, inquirer_1.default.prompt([
                        {
                            type: 'list',
                            name: 'action',
                            message: '🤖 What would you like to do?',
                            choices: ['📤 Send File(s)', '📥 Receive File(s)'],
                        },
                    ])];
                case 1:
                    action = (_a.sent()).action;
                    if (!action.startsWith('📤')) return [3 /*break*/, 3];
                    return [4 /*yield*/, startSender()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, startReceiver()];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
}
function startSender() {
    return __awaiter(this, void 0, void 0, function () {
        var token, currentDir, allFiles, files, decoded, publicIP, uri, socket;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log(chalk_1.default.cyan('🚀 Starting File Sender...'));
                    return [4 /*yield*/, inquirer_1.default.prompt([
                            {
                                type: 'input',
                                name: 'token',
                                message: '🔑 Enter the token provided by the receiver:',
                                validate: function (input) { return input.trim() !== '' || 'Token cannot be empty.'; },
                            },
                        ])];
                case 1:
                    token = (_a.sent()).token;
                    currentDir = process.cwd();
                    allFiles = fs_1.default.readdirSync(currentDir).filter(function (f) { return fs_1.default.lstatSync(path_1.default.join(currentDir, f)).isFile(); });
                    return [4 /*yield*/, inquirer_1.default.prompt([
                            {
                                type: 'checkbox',
                                name: 'files',
                                message: '📁 Select files to send:',
                                choices: allFiles,
                            },
                        ])];
                case 2:
                    files = (_a.sent()).files;
                    if (files.length === 0) {
                        console.log(chalk_1.default.red('❌ No files selected. Exiting...'));
                        return [2 /*return*/];
                    }
                    decoded = Buffer.from(token, 'base64').toString('utf-8');
                    publicIP = decoded.split('|')[1];
                    uri = "ws://".concat(publicIP, ":").concat(PORT);
                    console.log(chalk_1.default.green("\uD83D\uDD17 Connecting to receiver at ".concat(uri, "...")));
                    socket = (0, socket_io_client_1.io)(uri);
                    socket.on('connect', function () {
                        console.log(chalk_1.default.green('✅ Connected to receiver!'));
                        var filesSent = 0;
                        files.forEach(function (file) {
                            var filePath = path_1.default.join(currentDir, file);
                            var fileSize = fs_1.default.statSync(filePath).size;
                            console.log(chalk_1.default.yellow("\uD83D\uDCE4 Sending: ".concat(file, " (").concat((fileSize / 1024).toFixed(2), " KB)")));
                            socket.emit('file-meta', { name: file, size: fileSize });
                            var stream = fs_1.default.createReadStream(filePath, { highWaterMark: 64 * 1024 });
                            stream.on('data', function (chunk) { return socket.emit('file-chunk', chunk); });
                            stream.on('end', function () {
                                socket.emit('file-complete', { name: file });
                                console.log(chalk_1.default.blue("\u2705 ".concat(file, " sent successfully!")));
                                filesSent++;
                                if (filesSent === files.length) {
                                    console.log(chalk_1.default.green('🎉 All files sent!'));
                                    socket.close();
                                    process.exit(0);
                                }
                            });
                        });
                    });
                    socket.on('connect_error', function (err) {
                        console.log(chalk_1.default.red('❌ Failed to connect to receiver.'));
                        console.error(err.message);
                        process.exit(1);
                    });
                    return [2 /*return*/];
            }
        });
    });
}
function startReceiver() {
    return __awaiter(this, void 0, void 0, function () {
        var uid, res, publicIP_1, token, app, server, io_1, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    console.log(chalk_1.default.blue('🛠 Initializing Receiver...'));
                    uid = (0, uuid_1.v4)();
                    return [4 /*yield*/, axios_1.default.get('https://api.ipify.org?format=json')];
                case 1:
                    res = _a.sent();
                    publicIP_1 = res.data.ip;
                    token = Buffer.from("".concat(uid, "|").concat(publicIP_1)).toString('base64');
                    console.log(chalk_1.default.green.bold('\n📋 Your Shiro Token:'));
                    console.log(chalk_1.default.green("\uD83D\uDD11 Token: ".concat(chalk_1.default.yellow(token))));
                    console.log(chalk_1.default.green("\uD83C\uDF0D Public IP: ".concat(chalk_1.default.yellow(publicIP_1))));
                    app = (0, express_1.default)();
                    server = http_1.default.createServer(app);
                    io_1 = new socket_io_1.Server(server);
                    server.listen(PORT, function () {
                        console.log(chalk_1.default.green('\n🚀 Listening for connections...'));
                        console.log(chalk_1.default.green("\uD83C\uDF10 ws://".concat(publicIP_1, ":").concat(PORT)));
                        console.log(chalk_1.default.yellow('⌛ Waiting for sender...'));
                    });
                    io_1.on('connection', function (socket) {
                        console.log(chalk_1.default.green('\n🔗 Sender connected!'));
                        var fileStream;
                        socket.on('file-meta', function (_a) {
                            var name = _a.name, size = _a.size;
                            console.log(chalk_1.default.blue("\n\uD83D\uDCE6 Receiving: ".concat(chalk_1.default.yellow(name), " (").concat(size, " bytes)")));
                            fileStream = fs_1.default.createWriteStream(path_1.default.join(process.cwd(), name));
                        });
                        socket.on('file-chunk', function (chunk) {
                            fileStream.write(chunk);
                        });
                        socket.on('file-complete', function () {
                            fileStream.end();
                            console.log(chalk_1.default.green("\u2705 File received successfully! \uD83C\uDF89"));
                        });
                        socket.on('disconnect', function () {
                            console.log(chalk_1.default.red('❌ Sender disconnected.'));
                        });
                    });
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    console.error(chalk_1.default.red.bold('❗ Error starting receiver:'), err_1.message);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
startCLI();
