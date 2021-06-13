"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const next_1 = __importDefault(require("next"));
const roomsControllers_1 = __importDefault(require("./src/controllers/roomsControllers"));
const socketServer_1 = __importDefault(require("./src/utils/socketServer"));
const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next_1.default({ dev });
const nextHandler = app.getRequestHandler();
const roomsController = new roomsControllers_1.default();
const namespaces = {
    room: { controller: roomsController }
};
const routesConfig = Object.entries(namespaces).map(([namespace, { controller }]) => {
    const events = controller.getEvents();
    return {
        [namespace]: { events }
    };
});
app.prepare().then(() => {
    const app = express_1.default();
    const server = http_1.createServer(app);
    const socketServer = new socketServer_1.default({ httpServer: server });
    socketServer.start();
    socketServer.attachEvents(routesConfig);
    app.all('*', (req, res) => {
        nextHandler(req, res);
    });
    server.listen(port, () => {
        console.log(`> Ready on port ${port}`);
    });
});
