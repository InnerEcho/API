// services/FriendsService.ts
import db from "@/models/index.js";
const { User, Plant, UserFriends } = db;
import { Op } from "sequelize";

export class FriendService {
  // 친구 요청 생성
  public async create(user_email: string, friend_email: string) {
    const friend = await User.findOne({
      where: { user_email: friend_email }
    });

    if (!friend) {
      throw new Error("친구 사용자가 존재하지 않습니다.");
    }

    const plant = await Plant.findOne({
      where: { user_id: friend.user_id }, // user_id로 조회
      order: [['plant_id', 'ASC']] // 여러 식물이 있을 경우 첫 번째 식물 선택
    });
  
    if (!plant) {
      throw new Error("친구의 식물이 존재하지 않습니다.");
    }

    const friend_nickname = plant.nickname; // Users 테이블에서 nickname 가져오기
    const request = await UserFriends.create({
      user_email,
      friend_email,
      friend_nickname,
      status: "pending"
    });

    return request;
  }

  // 친구 요청 조회 (예: 중복 확인)
  public async findOne(user_email: string, friend_email: string) {
    return await UserFriends.findOne({
      where: {
        // 양방향 확인
        [Op.or]: [
          { user_email, friend_email },
          { user_email: friend_email, friend_email: user_email }
        ]
      }
    });
  }

  // 친구 요청 상태 업데이트
  public async updateStatus(
    user_email: string,
    friend_email: string,
    status: "pending" | "accepted" | "rejected"
  ) {
    const request = await UserFriends.findOne({
      where: { user_email, friend_email, status: "pending" }
    });

    if (!request) return null;

    request.status = status;
    await request.save();
    return request;
  }

  public async getFriendList(myEmail: string) {
    const friends = await UserFriends.findAll({
      where: {
        status: "accepted",
        [Op.or]: [
          { user_email: myEmail },
          { friend_email: myEmail }
        ]
      }
    });
  
    // 친구 목록을 배열로 반환
    return friends.map((f: InstanceType<typeof UserFriends>) =>
      f.user_email === myEmail ? f.friend_email : f.user_email
    );
    
  }
  
}
