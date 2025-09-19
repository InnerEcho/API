import express from 'express';
import { FriendService } from '@/services/FriendService.js';
import { FriendController } from '@/controllers/FriendController.js';

const router = express.Router();
const friendService= new FriendService();
const friendController = new FriendController(friendService);

// 친구 요청 생성
router.post(
  '/friendRequest',
  friendController.sendFriendRequest.bind(friendController)
);

// 친구 요청 수락
router.post(
  '/requestAccept',
  friendController.acceptFriendRequest.bind(friendController)
);

// 친구 요청 거절
router.post(
  '/requestReject',
  friendController.rejectFriendRequest.bind(friendController)
);

// 친구 목록 나열
router.get(
  '/friendslist',
  friendController.getFriendList.bind(friendController)
);

// // 특정 사용자 친구 목록 조회
// router.get(
//   '/:user_email',
//   friendController.getFriends.bind(friendController)
// );

export default router;
