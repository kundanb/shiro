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
exports.default = startReceiver;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var http_1 = __importDefault(require("http"));
var uuid_1 = require("uuid");
var chalk_1 = __importDefault(require("chalk"));
var axios_1 = __importDefault(require("axios"));
var express_1 = __importDefault(require("express"));
var socket_io_1 = require("socket.io");
var PORT = 3000;
function startReceiver() {
    return __awaiter(this, void 0, void 0, function () {
        var uid, res, publicIP_1, token, app, server, io, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    uid = (0, uuid_1.v4)();
                    return [4 /*yield*/, axios_1.default.get('https://api.ipify.org?format=json')];
                case 1:
                    res = _a.sent();
                    publicIP_1 = res.data.ip;
                    token = Buffer.from("".concat(uid, "|").concat(publicIP_1)).toString('base64');
                    console.log(chalk_1.default.green("Your token: ".concat(token)));
                    console.log(chalk_1.default.green("Receiver's public IP: ".concat(publicIP_1)));
                    app = (0, express_1.default)();
                    server = http_1.default.createServer(app);
                    io = new socket_io_1.Server(server);
                    server.listen(PORT, function () {
                        console.log(chalk_1.default.green("Receiver listening on ws://".concat(publicIP_1, ":").concat(PORT)));
                        console.log(chalk_1.default.yellow('Waiting for sender to connect...'));
                    });
                    // Listen for incoming file transfer
                    io.on('connection', function (socket) {
                        console.log(chalk_1.default.green('Sender connected! Waiting for file transfer...'));
                        socket.on('file-meta', function (_a) {
                            var name = _a.name, size = _a.size;
                            console.log(chalk_1.default.yellow("Receiving file: ".concat(name, " (").concat(size, " bytes)")));
                            // Create a stream to write the received file
                            var fileStream = fs_1.default.createWriteStream(path_1.default.join(process.cwd(), name));
                            // Write file chunks
                            socket.on('file-chunk', function (chunk) {
                                fileStream.write(chunk);
                            });
                            // Complete the file transfer
                            socket.on('file-complete', function () {
                                fileStream.end();
                                console.log(chalk_1.default.green('File received successfully!'));
                            });
                        });
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error(chalk_1.default.red('Error starting receiver:', error_1));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
