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
      const { toUserId: friendId } = req.body;
      const userId = req.user!.userId; // 예: 회원 고유 ID
      const user = await User.findOne({ where: { user_id: userId } });
      const friend = await User.findOne({ where: { user_id: friendId } });

      console.log('user:', user);
      console.log('friend:', friend);

      const userEmail = user.user_email;
      const friendEmail = friend.user_email;

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
      const { requestId: request_Id, fromUserId: friend_Id2 } = req.body;

      if (!request_Id || !friend_Id2) {
        apiResult.msg = 'Missing required fields: requestId or fromUserId';
        res.status(400).json(apiResult);
        return;
      }

      const userId = req.user!.userId; // 예: 회원 고유 ID
      const user = await User.findOne({ where: { user_id: userId } });
      const friend = await User.findOne({ where: { user_id: friend_Id2 } });

      if (!user || !friend) {
        apiResult.msg = '존재하지 않는 사용자입니다.';
        res.status(404).json(apiResult);
        return;
      }

      const userEmail2 = user.user_email;
      const friendEmail2 = friend.user_email;

      const request = await this.friendService.updateStatus(
        request_Id,
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
      const { requestId: request_Id, fromUserId: friend_Id3 } = req.body;

      if (!request_Id || !friend_Id3) {
        apiResult.msg = 'Missing required fields: requestId or fromUserId';
        res.status(400).json(apiResult);
        return;
      }

      const userId = req.user!.userId; // 예: 회원 고유 ID
      const user = await User.findOne({ where: { user_id: userId } });
      const friend = await User.findOne({ where: { user_id: friend_Id3 } });

      if (!user || !friend) {
        apiResult.msg = '존재하지 않는 사용자입니다.';
        res.status(404).json(apiResult);
        return;
      }

      const userEmail3 = user.user_email;
      const friendEmail3 = friend.user_email;

      const request = await this.friendService.updateStatus(
        request_Id,
        userEmail3,
        friendEmail3,
        'rejected',
      );

      if (!request) {
        apiResult.msg = '친구 요청이 존재하지 않습니다';
        res.status(404).json(apiResult);
        return;
      }

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

    // 친구 삭제
  public async deleteFriend(
    req: Request,
    res: Response<ApiResult>,
  ): Promise<void> {
    const apiResult: ApiResult = { code: 400, data: null, msg: '' };

    try {
      const userId = req.user!.userId
      const { friendId } = req.body; // 또는 req.params.friendId 사용

      if (!userId || !friendId) {
        apiResult.msg = '필요한 정보가 없습니다.';
        res.status(400).json(apiResult);
        return;
      }

      // 사용자 이메일 조회
      const user = await User.findOne({ where: { user_id: userId } });
      const friend = await User.findOne({ where: { user_id: friendId } });

      if (!user || !friend) {
        apiResult.msg = '존재하지 않는 사용자입니다.';
        res.status(404).json(apiResult);
        return;
      }

      const userEmail4 = user.user_email;
      const friendEmail4 = friend.user_email;

      // 서비스 호출 - 친구 삭제
      const deleted = await this.friendService.deleteFriend(userEmail4, friendEmail4);

      if (deleted) {
        apiResult.code = 200;
        apiResult.msg = '친구 삭제 완료';
        res.status(200).json(apiResult);
      } else {
        apiResult.code = 404;
        apiResult.msg = '친구 관계를 찾을 수 없습니다.';
        res.status(404).json(apiResult);
      }

    } catch (err) {
      console.error(err);
      apiResult.code = 500;
      apiResult.msg = '서버 오류';
      res.status(500).json(apiResult);
    }
  }


}
