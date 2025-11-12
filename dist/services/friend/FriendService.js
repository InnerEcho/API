import db from "../../models/index.js";
import { QueryTypes, Op } from 'sequelize';
export class FriendService {
  async getUserOrThrow(userId) {
    const user = await db.User.findOne({
      where: {
        user_id: userId
      },
      attributes: ['user_id', 'user_email', 'user_name']
    });
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    return {
      id: Number(user.get('user_id')),
      email: String(user.get('user_email')),
      name: user.get('user_name') ? String(user.get('user_name')) : null
    };
  }
  async findRequestById(requestId) {
    return db.UserFriends.findOne({
      where: {
        friend_id: requestId
      }
    });
  }
  async createRequest(requesterId, targetId) {
    if (requesterId === targetId) {
      throw new Error('자기 자신에게는 친구 요청을 보낼 수 없습니다.');
    }
    const requester = await this.getUserOrThrow(requesterId);
    const target = await this.getUserOrThrow(targetId);
    const existing = await db.UserFriends.findOne({
      where: {
        [Op.or]: [{
          user_email: requester.email,
          friend_email: target.email
        }, {
          user_email: target.email,
          friend_email: requester.email
        }]
      }
    });
    if (existing) {
      const status = existing.get('status');
      if (status === 'accepted') {
        throw new Error('이미 친구 관계입니다.');
      }
      if (status === 'pending' && existing.get('friend_email') === requester.email) {
        throw new Error('상대방이 이미 친구 요청을 보냈습니다.');
      }
      if (status === 'pending' && existing.get('user_email') === requester.email) {
        throw new Error('이미 친구 요청을 보낸 상태입니다.');
      }
    }
    const nickname = target.name ?? target.email.split('@')[0] ?? `friend_${String(target.id).padStart(4, '0')}`;
    const request = await db.UserFriends.create({
      user_email: requester.email,
      friend_email: target.email,
      friend_nickname: nickname,
      status: 'pending'
    });
    return {
      requestId: Number(request.get('friend_id')),
      status: request.get('status'),
      target: {
        userId: target.id,
        email: target.email,
        name: target.name
      }
    };
  }
  async getPendingRequests(userId, direction) {
    const user = await this.getUserOrThrow(userId);
    const isInbound = direction === 'inbound';
    const rows = await db.sequelize.query(`
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
      `, {
      replacements: {
        email: user.email
      },
      type: QueryTypes.SELECT
    });
    return rows.map(row => ({
      requestId: row.friend_id,
      status: row.status,
      direction,
      from: {
        userId: row.requester_id,
        email: row.requester_email,
        name: row.requester_name
      },
      to: {
        userId: row.target_id,
        email: row.target_email,
        name: row.target_name
      }
    }));
  }
  async acceptRequest(requestId, userId) {
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
    return {
      success: true
    };
  }
  async rejectRequest(requestId, userId) {
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
    return {
      success: true
    };
  }
  async cancelRequest(requestId, userId) {
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
    return {
      success: true
    };
  }
  async getFriends(userId) {
    const user = await this.getUserOrThrow(userId);
    const rows = await db.sequelize.query(`
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
      `, {
      replacements: {
        email: user.email
      },
      type: QueryTypes.SELECT
    });
    const emotionMap = await this.getLatestEmotions(rows.map(row => row.friend_user_id));
    return rows.map(row => ({
      requestId: row.friend_id,
      friend: {
        userId: row.friend_user_id,
        email: row.friend_email,
        name: row.friend_name
      },
      latestEmotion: emotionMap.get(row.friend_user_id) ?? null
    }));
  }
  async getLatestEmotions(friendIds) {
    if (!friendIds.length) {
      return new Map();
    }
    const rows = await db.sequelize.query(`
        WITH ranked AS (
          SELECT
            ch.user_id,
            ca.emotion,
            ca.created_at,
            ROW_NUMBER() OVER (
              PARTITION BY ch.user_id
              ORDER BY ca.created_at DESC
            ) AS rn
          FROM chat_analysis ca
          JOIN plant_history ch ON ch.history_id = ca.history_id
          WHERE ch.user_id IN (:friendIds)
        )
        SELECT user_id, emotion, created_at
        FROM ranked
        WHERE rn = 1
      `, {
      replacements: {
        friendIds
      },
      type: QueryTypes.SELECT
    });
    const map = new Map();
    for (const row of rows) {
      map.set(row.user_id, {
        emotion: row.emotion ?? null,
        analyzedAt: row.created_at ?? null
      });
    }
    return map;
  }
  async removeFriend(userId, friendUserId) {
    const user = await this.getUserOrThrow(userId);
    const friend = await this.getUserOrThrow(friendUserId);
    const deletedCount = await db.UserFriends.destroy({
      where: {
        status: 'accepted',
        [Op.or]: [{
          user_email: user.email,
          friend_email: friend.email
        }, {
          user_email: friend.email,
          friend_email: user.email
        }]
      }
    });
    return deletedCount > 0;
  }
}