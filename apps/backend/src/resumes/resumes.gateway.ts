import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

const SOCKET_CORS_ORIGINS = (
  process.env.FRONTEND_URL ||
  'http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

@WebSocketGateway({
  cors: { origin: SOCKET_CORS_ORIGINS, credentials: true },
})
export class ResumesGateway {
  @WebSocketServer()
  server: Server;

  emitDone(id: string) {
    if (!this.server) {
      console.warn('WebSocket server not ready; skipping generate:done emit');
      return;
    }

    this.server.emit('generate:done', { id });
  }

  emitFailed(id: string, message?: string) {
    if (!this.server) {
      console.warn('WebSocket server not ready; skipping generate:failed emit');
      return;
    }

    this.server.emit('generate:failed', { id, message });
  }
}