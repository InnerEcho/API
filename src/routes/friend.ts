import express from 'express';
import { FriendService } from '@/services/friend/FriendService.js';
import { FriendRecommendationService } from '@/services/friend/FriendRecommendationService.js';
import { FriendController } from '@/controllers/friend/FriendController.js';
import { verifyTokenV2 } from '@/middlewares/authV2.js';

const router = express.Router();
const friendService = new FriendService();
const friendRecommendationService = new FriendRecommendationService();
const friendController = new FriendController(friendService, friendRecommendationService);

router.get('/', verifyTokenV2, friendController.listFriends.bind(friendController));

router.get('/recommend', verifyTokenV2, friendController.recommendOpposites.bind(friendController));

router.get(
  '/requests/inbound',
  verifyTokenV2,
  friendController.getInboundRequests.bind(friendController),
);

router.get(
  '/requests/outbound',
  verifyTokenV2,
  friendController.getOutboundRequests.bind(friendController),
);

router.post(
  '/requests',
  verifyTokenV2,
  friendController.sendFriendRequest.bind(friendController),
);

router.post(
  '/requests/:requestId/accept',
  verifyTokenV2,
  friendController.acceptFriendRequest.bind(friendController),
);

router.post(
  '/requests/:requestId/reject',
  verifyTokenV2,
  friendController.rejectFriendRequest.bind(friendController),
);

router.delete(
  '/requests/:requestId',
  verifyTokenV2,
  friendController.cancelFriendRequest.bind(friendController),
);

router.delete(
  '/:friendId',
  verifyTokenV2,
  friendController.deleteFriend.bind(friendController),
);

export default router;
