import db from '@/models/index.js';
import { QueryTypes, Op } from 'sequelize';

type FriendRequestDirection = 'inbound' | 'outbound';

type RequestRow = {
  friend_id: number;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  requester_id: number;
  requester_email: string;
  requester_name: string | null;
  target_id: number;
  target_email: string;
  target_name: string | null;
};

type FriendRow = {
  friend_id: number;
  friend_user_id: number;
  friend_email: string;
  friend_name: string | null;
};

export class FriendService {
  private async getUserOrThrow(userId: number) {
    const user = await db.User.findOne({
      where: { user_id: userId },
      attributes: ['user_id', 'user_email', 'user_name'],
    });
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    return {
      id: Number(user.get('user_id')),
      email: String(user.get('user_email')),
      name: user.get('user_name') ? String(user.get('user_name')) : null,
    };
  }

  private async findRequestById(requestId: number) {
    return db.UserFriends.findOne({
      where: { friend_id: requestId },
    });
  }

  public async createRequest(requesterId: number, targetId: number) {
    if (requesterId === targetId) {
      throw new Error('자기 자신에게는 친구 요청을 보낼 수 없습니다.');
    }

    const requester = await this.getUserOrThrow(requesterId);
    const target = await this.getUserOrThrow(targetId);

    const existing = await db.UserFriends.findOne({
      where: {
        [Op.or]: [
          {
            user_email: requester.email,
            friend_email: target.email,
          },
          {
            user_email: target.email,
            friend_email: requester.email,
          },
        ],
      },
    });

    if (existing) {
      const status = existing.get('status');
      if (status === 'accepted') {
        throw new Error('이미 친구 관계입니다.');
      }
      if (
        status === 'pending' &&
        existing.get('friend_email') === requester.email
      ) {
        throw new Error('상대방이 이미 친구 요청을 보냈습니다.');
      }
      if (
        status === 'pending' &&
        existing.get('user_email') === requester.email
      ) {
        throw new Error('이미 친구 요청을 보낸 상태입니다.');
      }
    }

    const nickname =
      target.name ??
      target.email.split('@')[0] ??
      `friend_${String(target.id).padStart(4, '0')}`;

    const request = await db.UserFriends.create({
      user_email: requester.email,
      friend_email: target.email,
      friend_nickname: nickname,
      status: 'pending',
    });

    return {
      requestId: Number(request.get('friend_id')),
      status: request.get('status'),
      target: {
        userId: target.id,
        email: target.email,
        name: target.name,
      },
    };
  }

  public async getPendingRequests(
    userId: number,
    direction: FriendRequestDirection,
  ) {
    const user = await this.getUserOrThrow(userId);
    const isInbound = direction === 'inbound';

    const rows = (await db.sequelize.query(
      `
        SELECT
          uf.friend_id,
          uf.status,
          requester.user_id AS requester_id,
          requester.user_email AS requester_email,
          requester.user_name AS requester_name,
          target.user_id AS target_id,
          target.user_email AS target_email,
          target.user_name AS target_name
        FROM user_friends uf
        JOIN user requester ON requester.user_email = uf.user_email
        JOIN user target ON target.user_email = uf.friend_email
        WHERE uf.status = 'pending'
          AND ${isInbound ? 'uf.friend_email = :email' : 'uf.user_email = :email'}
      `,
      {
        replacements: { email: user.email },
        type: QueryTypes.SELECT,
      },
    )) as RequestRow[];

    return rows.map(row => ({
      requestId: row.friend_id,
      status: row.status,
      direction,
      from: {
        userId: row.requester_id,
        email: row.requester_email,
        name: row.requester_name,
      },
      to: {
        userId: row.target_id,
        email: row.target_email,
        name: row.target_name,
      },
    }));
  }

  public async acceptRequest(requestId: number, userId: number) {
    const user = await this.getUserOrThrow(userId);
    const request = await this.findRequestById(requestId);
    if (!request) {
      throw new Error('친구 요청이 존재하지 않습니다.');
    }
    if (request.get('friend_email') !== user.email) {
      throw new Error('해당 요청을 수락할 권한이 없습니다.');
    }
    if (request.get('status') !== 'pending') {
      throw new Error('이미 처리된 요청입니다.');
    }
    request.set('status', 'accepted');
    await request.save();
    return { success: true };
  }

  public async rejectRequest(requestId: number, userId: number) {
    const user = await this.getUserOrThrow(userId);
    const request = await this.findRequestById(requestId);
    if (!request) {
      throw new Error('친구 요청이 존재하지 않습니다.');
    }
    if (request.get('friend_email') !== user.email) {
      throw new Error('해당 요청을 거절할 권한이 없습니다.');
    }
    if (request.get('status') !== 'pending') {
      throw new Error('이미 처리된 요청입니다.');
    }
    request.set('status', 'rejected');
    await request.save();
    return { success: true };
  }

  public async cancelRequest(requestId: number, userId: number) {
    const user = await this.getUserOrThrow(userId);
    const request = await this.findRequestById(requestId);
    if (!request) {
      throw new Error('친구 요청이 존재하지 않습니다.');
    }
    if (request.get('user_email') !== user.email) {
      throw new Error('해당 요청을 취소할 권한이 없습니다.');
    }
    if (request.get('status') !== 'pending') {
      throw new Error('이미 처리된 요청입니다.');
    }
    await request.destroy();
    return { success: true };
  }

  public async getFriends(userId: number) {
    const user = await this.getUserOrThrow(userId);

    const rows = (await db.sequelize.query(
      `
        SELECT
          uf.friend_id,
          CASE
            WHEN uf.user_email = :email THEN target.user_id
            ELSE requester.user_id
          END AS friend_user_id,
          CASE
            WHEN uf.user_email = :email THEN target.user_email
            ELSE requester.user_email
          END AS friend_email,
          CASE
            WHEN uf.user_email = :email THEN target.user_name
            ELSE requester.user_name
          END AS friend_name
        FROM user_friends uf
        JOIN user requester ON requester.user_email = uf.user_email
        JOIN user target ON target.user_email = uf.friend_email
        WHERE uf.status = 'accepted'
          AND (uf.user_email = :email OR uf.friend_email = :email)
      `,
      {
        replacements: { email: user.email },
        type: QueryTypes.SELECT,
      },
    )) as FriendRow[];

    return rows.map(row => ({
      requestId: row.friend_id,
      friend: {
        userId: row.friend_user_id,
        email: row.friend_email,
        name: row.friend_name,
      },
    }));
  }

  public async removeFriend(userId: number, friendUserId: number) {
    const user = await this.getUserOrThrow(userId);
    const friend = await this.getUserOrThrow(friendUserId);

    const deletedCount = await db.UserFriends.destroy({
      where: {
        status: 'accepted',
        [Op.or]: [
          { user_email: user.email, friend_email: friend.email },
          { user_email: friend.email, friend_email: user.email },
        ],
      },
    });

    return deletedCount > 0;
  }
}
