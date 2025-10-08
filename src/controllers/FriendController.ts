import type { Request, Response } from 'express';
import type { ApiResult } from '@/interface/index.js';
import { FriendService } from '@/services/FriendService.js';
import db from '@/models/index.js';
import { Op } from 'sequelize';

const { UserFriends } = db;
const { User } = db;

export class FriendController {
  private friendService: FriendService;

  constructor(friendService: FriendService) {
    this.friendService = friendService;
  }

  // 친구 목록 조회
  public async getFriendList(
    req: Request,
    res: Response<ApiResult>,
  ): Promise<void> {
    const apiResult: ApiResult = { code: 400, data: null, msg: '' };

    try {
      // 로그인한 사용자 이메일을 가져온다고 가정 (req.user.email)
      const userId = req.user!.userId; // 예: 회원 고유 ID
      if (!userId) {
        apiResult.msg = 'Missing userId';

        res.status(400).json(apiResult);
        return;
      }

      // Users 테이블에서 email 조회
      const user = await User.findOne({ where: { user_id: userId } });
      if (!user) {
        apiResult.msg = '사용자 없음';
        res.status(404).json(apiResult);
        return;
      }

      const myEmail = user.user_email;
      // 서비스 호출
      const friendList = await this.friendService.getFriendList(myEmail);

      // 성공 응답
      apiResult.code = 200;
      apiResult.msg = '친구 목록 조회 완료';
      apiResult.data = friendList;
      res.status(200).json(apiResult);
    } catch (err) {
      console.error(err);
      apiResult.code = 500;
      apiResult.msg = '서버 오류';
      res.status(500).json(apiResult);
    }
  }

  // 📌 친구 신청
  public async sendFriendRequest(
    req: Request,
    res: Response<ApiResult>,
  ): Promise<void> {
    const apiResult: ApiResult = { code: 400, data: null, msg: '' };
    try {
      const { user_email: userEmail, friend_email: friendEmail } = req.body;

      if (!userEmail || !friendEmail) {
        apiResult.msg = 'Missing required fields: user_email, friend_email';
        res.status(400).json(apiResult);
        return;
      }

      if (userEmail === friendEmail) {
        apiResult.msg = '자기 자신에게는 요청 불가';
        res.status(400).json(apiResult);
        return;
      }

      const exists = await UserFriends.findOne({
        where: {
          [Op.or]: [
            { user_email: userEmail, friend_email: friendEmail },
            { user_email: friendEmail, friend_email: userEmail },
          ],
        },
      });

      if (exists) {
        apiResult.msg = '이미 요청 또는 친구 상태입니다';
        res.status(400).json(apiResult);
        return;
      }

      const request = await this.friendService.create(userEmail, friendEmail);

      apiResult.code = 200;
      apiResult.msg = '친구 요청 전송 완료';
      apiResult.data = request;
      res.status(200).json(apiResult);
    } catch (err) {
      console.error(err);
      apiResult.code = 500;
      apiResult.msg = '서버 오류';
      res.status(500).json(apiResult);
    }
  }

  // 📌 친구 수락
  public async acceptFriendRequest(
    req: Request,
    res: Response<ApiResult>,
  ): Promise<void> {
    const apiResult: ApiResult = { code: 400, data: null, msg: '' };
    try {
      const { user_email: userEmail2, friend_email: friendEmail2 } = req.body;

      if (!userEmail2 || !friendEmail2) {
        apiResult.msg = 'Missing required fields: user_email, friend_email';
        res.status(400).json(apiResult);
        return;
      }

      const request = await this.friendService.updateStatus(
        userEmail2,
        friendEmail2,
        'accepted',
      );

      if (!request) {
        apiResult.msg = '친구 요청이 존재하지 않습니다';
        res.status(404).json(apiResult);
        return;
      }

      apiResult.code = 200;
      apiResult.msg = '친구 요청 수락 완료';
      apiResult.data = request;
      res.status(200).json(apiResult);
    } catch (err) {
      console.error(err);
      apiResult.code = 500;
      apiResult.msg = '서버 오류';
      res.status(500).json(apiResult);
    }
  }

  // 📌 친구 거절
  public async rejectFriendRequest(
    req: Request,
    res: Response<ApiResult>,
  ): Promise<void> {
    const apiResult: ApiResult = { code: 400, data: null, msg: '' };
    try {
      const { user_email: userEmail3, friend_email: friendEmail3 } = req.body;

      if (!userEmail3 || !friendEmail3) {
        apiResult.msg = 'Missing required fields: user_email, friend_email';
        res.status(400).json(apiResult);
        return;
      }

      const request = await UserFriends.findOne({
        where: {
          user_email: userEmail3,
          friend_email: friendEmail3,
          status: 'pending',
        },
      });

      if (!request) {
        apiResult.msg = '친구 요청이 존재하지 않습니다';
        res.status(404).json(apiResult);
        return;
      }

      request.status = 'rejected';
      await request.save();

      apiResult.code = 200;
      apiResult.msg = '친구 요청 거절 완료';
      apiResult.data = request;
      res.status(200).json(apiResult);
    } catch (err) {
      console.error(err);
      apiResult.code = 500;
      apiResult.msg = '서버 오류';
      res.status(500).json(apiResult);
    }
  }
}
