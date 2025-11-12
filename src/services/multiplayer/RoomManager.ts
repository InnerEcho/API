import WebSocket from 'ws';

// AR 상태 정보를 담을 인터페이스
interface ARState {
  position: [number, number, number];
  rotation: [number, number, number];
  expression: string;
  animation: string;
}

// 클라이언트 정보를 담을 인터페이스
interface Client {
  ws: WebSocket;
  userId: number;
  userName: string;
  roomId: string;
  state?: ARState;  // 옵셔널: addUserToRoom에서 초기화
}

// 서버가 클라이언트로 보내는 메시지 타입
type ServerMessage = {
  type: 'user-joined' | 'user-left' | 'update' | 'animation' | 'room-state';
  payload: any;
};

/**
 * 멀티플레이어 AR 방을 관리하는 서비스 클래스
 * - 사용자 입장/퇴장 처리
 * - 같은 방에 있는 사용자들에게 데이터 브로드캐스팅
 */

export class RoomManager {
  // <roomId, <userId, Client>>
  private rooms: Map<string, Map<number, Client>> = new Map();

  constructor() {
    console.log('🌱 RoomManager initialized');
  }

  /**
   * 새로운 사용자를 방에 추가합니다.
   * @param client - 새로 연결된 클라이언트 정보
   */
  public addUserToRoom(client: Client): void {
    const { roomId, userId, userName, ws } = client;

    // 초기 AR 상태 설정 (state 객체가 없으면 기본값으로 초기화)
    if (!client.state) {
      client.state = {
        position: [0, 0, -2],
        rotation: [0, 0, 0],
        expression: 'default',
        animation: 'idle'
      };
    }

    // 1. 방이 없으면 새로 생성
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Map());
    }
    const room = this.rooms.get(roomId)!;

    // 2. 현재 방에 있는 다른 사용자들에게 새 사용자 입장 알림
    const newUserPayload = {
      userId,
      userName,
      ...client.state  // state 객체 전체를 펼쳐서 전송
    };
    this.broadcast(roomId, { type: 'user-joined', payload: newUserPayload }, userId);

    // 3. 새로 입장한 사용자에게 현재 방의 모든 사용자 정보 전송 (최신 state 포함)
    const usersInRoom = Array.from(room.values()).map(c => ({
      userId: c.userId,
      userName: c.userName,
      ...c.state  // 각 사용자의 최신 state를 포함
    }));

    this.sendMessage(ws, {
      type: 'room-state',
      payload: { users: usersInRoom },
    });

    // 4. 새 사용자를 방에 추가
    room.set(userId, client);
    console.log(`[RoomManager] User '${userName}' (${userId}) joined room '${roomId}'. Total users: ${room.size}`);
  }

  /**
   * 사용자를 방에서 제거하고, 퇴장 사실을 알립니다.
   * @param userId - 연결이 끊어진 사용자의 ID
   */
  public removeUserFromRoom(userId: number): void {
    this.rooms.forEach((room, roomId) => {
      if (room.has(userId)) {
        room.delete(userId);
        console.log(`[RoomManager] User '${userId}' removed from room '${roomId}'. Total users: ${room.size}`);

        // 다른 사용자들에게 퇴장 알림
        this.broadcast(roomId, { type: 'user-left', payload: { userId } });

        if (room.size === 0) {
          this.rooms.delete(roomId);
          console.log(`[RoomManager] Room '${roomId}' is now empty and has been deleted.`);
        }
      }
    });
  }

  /**
   * 클라이언트로부터 받은 메시지를 처리합니다.
   * @param fromUserId - 메시지를 보낸 사용자 ID
   * @param message - 파싱된 메시지 객체
   */
  public handleMessage(fromUserId: number, message: { type: string; payload: any }): void {
    const client = this.findClientById(fromUserId);
    if (!client) return;

    // state가 초기화되지 않은 경우 방어 코드 (정상적으로는 addUserToRoom에서 초기화됨)
    if (!client.state) {
      console.warn(`[RoomManager] Client ${fromUserId} has no state, initializing...`);
      client.state = {
        position: [0, 0, -2],
        rotation: [0, 0, 0],
        expression: 'default',
        animation: 'idle'
      };
    }

    const { roomId } = client;
    const { type, payload } = message;

    console.log(`[RoomManager] Message from '${fromUserId}' in room '${roomId}': ${type}`);

    // 'update' 메시지로 클라이언트 AR state를 즉시 업데이트
    if (type === 'update' && payload.data) {
      // 클라이언트의 state를 즉시 업데이트
      if (payload.data.position) {
        client.state.position = payload.data.position;
      }
      if (payload.data.rotation) {
        client.state.rotation = payload.data.rotation;
      }
      if (payload.data.expression) {
        client.state.expression = payload.data.expression;
      }

      // 다른 클라이언트에게 브로드캐스트
      this.broadcast(roomId, {
        type,
        payload: { userId: fromUserId, data: payload.data }
      }, fromUserId);
    }

    // 'animation' 타입의 메시지 처리
    if (type === 'animation' && payload.data) {
      // 클라이언트의 state를 즉시 업데이트
      if (payload.data.animation) {
        client.state.animation = payload.data.animation;
      }

      // 다른 클라이언트에게 브로드캐스트
      this.broadcast(roomId, {
        type,
        payload: { userId: fromUserId, data: payload.data }
      }, fromUserId);
    }
  }

  // ============== Private Helper Methods ==============

  private findClientById(userId: number): Client | undefined {
    for (const room of this.rooms.values()) {
      if (room.has(userId)) {
        return room.get(userId);
      }
    }
    return undefined;
  }

  private sendMessage(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[RoomManager] Failed to send message:', error);
      }
    }
  }

  private broadcast(roomId: string, message: ServerMessage, excludeUserId?: number): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.forEach((client, userId) => {
        if (userId !== excludeUserId) {
          this.sendMessage(client.ws, message);
        }
      });
    }
  }

  // ============== Public Monitoring Methods ==============

  /**
   * 모든 방의 통계 정보를 반환합니다.
   */
  public getRoomStats(): { roomId: string; userCount: number }[] {
    return Array.from(this.rooms.entries()).map(([roomId, room]) => ({
      roomId,
      userCount: room.size
    }));
  }

  /**
   * 전체 접속 사용자 수를 반환합니다.
   */
  public getTotalUserCount(): number {
    let total = 0;
    this.rooms.forEach(room => { total += room.size; });
    return total;
  }

  /**
   * 특정 방의 사용자 목록을 반환합니다.
   */
  public getUsersInRoom(roomId: string): { userId: number; userName: string }[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room.values()).map(client => ({
      userId: client.userId,
      userName: client.userName
    }));
  }
}