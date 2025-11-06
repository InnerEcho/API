import express from 'express';
import { FriendService } from '@/services/friend/FriendService.js';
import { FriendRecommendationService } from '@/services/friend/FriendRecommendationService.js';
import { FriendController } from '@/controllers/friend/FriendController.js';
import { verifyTokenV2 } from '@/middlewares/authV2.js';

const router = express.Router();
const friendService= new FriendService();
const friendRecommendationService = new FriendRecommendationService();
const friendController = new FriendController(friendService, friendRecommendationService);

// 친구 요청 생성
router.post(
  '/friendRequest',
  verifyTokenV2,
  friendController.sendFriendRequest.bind(friendController)
);

// 친구 요청 수락
router.post(
  '/requestAccept',
  verifyTokenV2,
  friendController.acceptFriendRequest.bind(friendController)
);

// 친구 요청 거절
router.post(
  '/requestReject',
  verifyTokenV2,
  friendController.rejectFriendRequest.bind(friendController)
);

// 친구 목록 나열
router.get(
  '/friendslist',
  verifyTokenV2,
  friendController.getFriendList.bind(friendController)
);

router.get(
  '/recommend',
  verifyTokenV2,
  friendController.recommendOpposites.bind(friendController)
);

// 친구 삭제
router.post(
  '/friendremove',
  verifyTokenV2,
  friendController.deleteFriend.bind(friendController)
);

// // 특정 사용자 친구 목록 조회
// router.get(
//   '/:user_email',
//   friendController.getFriends.bind(friendController)
// );

export default router;
