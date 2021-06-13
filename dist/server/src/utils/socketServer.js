"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
class SocketServer {
    constructor({ httpServer }) {
        this.httpServer = httpServer;
    }
    attachEvents(routesConfig) {
        for (const routeConfig of routesConfig) {
            for (const namespace in routeConfig) {
                if (Object.prototype.hasOwnProperty.call(routeConfig, namespace)) {
                    const route = this.io.of(`/${namespace}`);
                    route.on('connection', (socket) => {
                        for (const [functionName, functionValue] of routeConfig[namespace]
                            .events) {
                            socket.on(String(functionName), (...args) => {
                                if (typeof functionValue === 'function') {
                                    functionValue(socket, ...args);
                                }
                            });
                        }
                    });
                }
            }
        }
    }
    start() {
        this.io = new socket_io_1.Server(this.httpServer, {
            cors: {
                origin: '*'
            }
        });
    }
}
exports.default = SocketServer;
