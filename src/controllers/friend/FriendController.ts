import type { Request, Response } from 'express';
import type { ApiResult } from '@/interface/index.js';
import { FriendService } from '@/services/friend/FriendService.js';
import { FriendRecommendationService } from '@/services/friend/FriendRecommendationService.js';

export class FriendController {
  constructor(
    private readonly friendService: FriendService,
    private readonly recommendationService: FriendRecommendationService,
  ) {}

  public async listFriends(req: Request, res: Response<ApiResult>): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: '' };
    try {
      const userId = req.user?.userId;
      if (!userId) {
        result.msg = 'Missing userId';
        res.status(400).json(result);
        return;
      }

      const friends = await this.friendService.getFriends(userId);
      result.code = 200;
      result.msg = '친구 목록 조회 완료';
      result.data = friends;
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      result.code = 500;
      result.msg = '서버 오류';
      res.status(500).json(result);
    }
  }

  public async sendFriendRequest(req: Request, res: Response<ApiResult>): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: '' };
    try {
      const userId = req.user?.userId;
      const { targetUserId } = req.body;

      if (!userId || !targetUserId) {
        result.msg = '요청 대상 정보가 없습니다.';
        res.status(400).json(result);
        return;
      }

      const request = await this.friendService.createRequest(userId, Number(targetUserId));
      result.code = 200;
      result.msg = '친구 요청 전송 완료';
      result.data = request;
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      result.code = 400;
      result.msg = error instanceof Error ? error.message : '친구 요청을 보낼 수 없습니다.';
      res.status(400).json(result);
    }
  }

  public async getInboundRequests(req: Request, res: Response<ApiResult>): Promise<void> {
    await this.handlePendingRequests(req, res, 'inbound');
  }

  public async getOutboundRequests(req: Request, res: Response<ApiResult>): Promise<void> {
    await this.handlePendingRequests(req, res, 'outbound');
  }

  private async handlePendingRequests(
    req: Request,
    res: Response<ApiResult>,
    direction: 'inbound' | 'outbound',
  ): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: '' };
    try {
      const userId = req.user?.userId;
      if (!userId) {
        result.msg = 'Missing userId';
        res.status(400).json(result);
        return;
      }

      const requests = await this.friendService.getPendingRequests(userId, direction);
      result.code = 200;
      result.msg = '친구 요청 조회 완료';
      result.data = requests;
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      result.code = 500;
      result.msg = '서버 오류';
      res.status(500).json(result);
    }
  }

  public async acceptFriendRequest(req: Request, res: Response<ApiResult>): Promise<void> {
    await this.updateRequestStatus(req, res, 'accept');
  }

  public async rejectFriendRequest(req: Request, res: Response<ApiResult>): Promise<void> {
    await this.updateRequestStatus(req, res, 'reject');
  }

  public async cancelFriendRequest(req: Request, res: Response<ApiResult>): Promise<void> {
    await this.updateRequestStatus(req, res, 'cancel');
  }

  private async updateRequestStatus(
    req: Request,
    res: Response<ApiResult>,
    action: 'accept' | 'reject' | 'cancel',
  ): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: '' };
    try {
      const userId = req.user?.userId;
      const requestId = Number(req.params.requestId);
      if (!userId || Number.isNaN(requestId)) {
        result.msg = '잘못된 요청입니다.';
        res.status(400).json(result);
        return;
      }

      if (action === 'accept') {
        await this.friendService.acceptRequest(requestId, userId);
        result.code = 200;
        result.msg = '친구 요청 수락 완료';
      } else if (action === 'reject') {
        await this.friendService.rejectRequest(requestId, userId);
        result.code = 200;
        result.msg = '친구 요청 거절 완료';
      } else {
        await this.friendService.cancelRequest(requestId, userId);
        result.code = 200;
        result.msg = '친구 요청 취소 완료';
      }

      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : '친구 요청을 처리할 수 없습니다.';
      const status = message.includes('권한') || message.includes('없습니다') ? 403 : 400;
      res.status(status).json({ code: status, data: null, msg: message });
    }
  }

  public async deleteFriend(req: Request, res: Response<ApiResult>): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: '' };
    try {
      const userId = req.user?.userId;
      const friendId = Number(req.params.friendId);
      if (!userId || Number.isNaN(friendId)) {
        result.msg = '잘못된 요청입니다.';
        res.status(400).json(result);
        return;
      }

      const removed = await this.friendService.removeFriend(userId, friendId);
      if (!removed) {
        result.code = 404;
        result.msg = '친구 관계를 찾을 수 없습니다.';
        res.status(404).json(result);
        return;
      }

      result.code = 200;
      result.msg = '친구 삭제 완료';
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      result.code = 500;
      result.msg = '서버 오류';
      res.status(500).json(result);
    }
  }

  public async recommendOpposites(req: Request, res: Response<ApiResult>): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: '' };
    try {
      const userId = req.user?.userId;
      if (!userId) {
        result.msg = 'Missing userId';
        res.status(400).json(result);
        return;
      }

      const topParam = req.query.n ?? req.query.topN;
      const rawTop = Array.isArray(topParam) ? topParam[0] : topParam;
      const parsedTop = rawTop !== undefined ? Number(rawTop) : undefined;
      const recommendation = await this.recommendationService.recommendOpposites(
        userId,
        Number.isFinite(parsedTop ?? NaN) ? parsedTop : undefined,
      );

      result.code = 200;
      result.msg = '친구 추천 완료';
      result.data = recommendation;
      res.status(200).json(result);
    } catch (error) {
      console.error(error);
      result.code = 500;
      result.msg = '서버 오류';
      res.status(500).json(result);
    }
  }
}
