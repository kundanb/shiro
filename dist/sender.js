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
exports.default = startSender;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var http_1 = __importDefault(require("http"));
var inquirer_1 = __importDefault(require("inquirer"));
var chalk_1 = __importDefault(require("chalk"));
var express_1 = __importDefault(require("express"));
var node_fetch_1 = __importDefault(require("node-fetch"));
var socket_io_1 = require("socket.io");
var uuid_1 = require("uuid");
var PORT = 3000;
function startSender() {
    var _this = this;
    var currentDir = process.cwd();
    var allFiles = fs_1.default.readdirSync(currentDir).filter(function (f) { return fs_1.default.lstatSync(path_1.default.join(currentDir, f)).isFile(); });
    inquirer_1.default
        .prompt([
        {
            type: 'list',
            name: 'selectedFile',
            message: '📄 Choose a file to send:',
            choices: allFiles,
        },
    ])
        .then(function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var filePath, fileSize, res, publicIP, token, app, server, io;
        var selectedFile = _b.selectedFile;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    filePath = path_1.default.join(currentDir, selectedFile);
                    fileSize = fs_1.default.statSync(filePath).size;
                    return [4 /*yield*/, (0, node_fetch_1.default)('https://api.ipify.org?format=json')];
                case 1:
                    res = _c.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    publicIP = (_c.sent()).ip;
                    token = (0, uuid_1.v4)();
                    console.log(chalk_1.default.green("\n\uD83D\uDE80 File sender ready. Share the token with the receiver:"));
                    console.log(chalk_1.default.cyanBright("Token: ".concat(token)));
                    console.log(chalk_1.default.cyanBright("Sender's Public IP: ".concat(publicIP)));
                    app = (0, express_1.default)();
                    server = http_1.default.createServer(app);
                    io = new socket_io_1.Server(server);
                    server.listen(PORT, function () {
                        console.log(chalk_1.default.green("\nWaiting for receiver to connect using the token..."));
                    });
                    // Handle receiver connection based on token
                    io.on('connection', function (socket) {
                        // Ask for the token from the receiver
                        socket.emit('request-token');
                        socket.on('token-verified', function (receivedToken) {
                            if (receivedToken === token) {
                                console.log(chalk_1.default.green('\n🎉 Receiver connected with the correct token! Sending file...'));
                                socket.emit('file-meta', { name: selectedFile, size: fileSize });
                                var stream = fs_1.default.createReadStream(filePath, {
                                    highWaterMark: 64 * 1024,
                                });
                                stream.on('data', function (chunk) { return socket.emit('file-chunk', chunk); });
                                stream.on('end', function () {
                                    socket.emit('file-complete');
                                    console.log(chalk_1.default.blue('\n✅ File sent successfully!'));
                                });
                            }
                            else {
                                console.log(chalk_1.default.red('Invalid token. Disconnecting the receiver.'));
                                socket.disconnect();
                            }
                        });
                    });
                    return [2 /*return*/];
            }
        });
    }); })
        .catch(function (err) { return console.error(err); });
}
