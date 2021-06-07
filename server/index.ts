import express, { Express, Request, Response } from 'express';
import { Server as SocketIOServer, Socket } from 'socket.io'
import { createServer, Server as HttpServer } from 'http';
import next, { NextApiHandler } from 'next';

import RoomsController from './src/controllers/roomsControllers';
import SocketServer from './src/utils/socketServer';

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const nextHandler: NextApiHandler = app.getRequestHandler();

const roomsController = new RoomsController();

const namespaces = {
  room: { controller: roomsController }
};

const routesConfig = Object.entries(namespaces).map(
  ([namespace, { controller }]) => {
    const events = controller.getEvents();
    return {
      [namespace]: { events }
    };
  }
);

app.prepare().then(() => {
  const app: Express = express();
  const server: HttpServer = createServer(app);
  
  const socketServer = new SocketServer({ httpServer: server });
  socketServer.start();
  socketServer.attachEvents(routesConfig);

  app.all('*', (req: any, res: any) => {
    nextHandler(req, res);
  });

  server.listen(port, () => {
    console.log(`> Ready on port ${port}`);
  });
})
