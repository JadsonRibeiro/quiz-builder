import { Server as SocketIO, Socket } from 'socket.io';
import { Server } from 'http';

interface ISocketServerDeps {
  httpServer: Server;
}

class SocketServer {
  private io: SocketIO;

  httpServer: Server;

  constructor({ httpServer }: ISocketServerDeps) {
    this.httpServer = httpServer;
  }

  attachEvents(
    routesConfig: {
      [x: string]: {
        events: (string | symbol | ((...args: any[]) => void))[][];
      };
    }[]
  ): void {
    for (const routeConfig of routesConfig) {
      for (const namespace in routeConfig) {
        if (Object.prototype.hasOwnProperty.call(routeConfig, namespace)) {
          const route = this.io.of(`/${namespace}`);
          route.on('connection', (socket: Socket) => {
            for (const [functionName, functionValue] of routeConfig[namespace]
              .events) {
              socket.on(String(functionName), (...args: any) => {
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

  start(): void {
    this.io = new SocketIO(this.httpServer, {
      cors: {
        origin: '*'
      }
    });
  }
}

export default SocketServer;
