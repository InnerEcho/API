import db from "../models/index.js";
import { Op } from 'sequelize';
import dayjs from 'dayjs';
export class GrowthDiaryService {
  constructor(growthDiaryBot) {
    this.growthDiaryBot = growthDiaryBot;
  }
  async getDiaryDatesForMonth(user_id, year_month) {
    if (!user_id || !year_month) {
      throw new Error('Missing required fields: user_id or year_month');
    }
    const start = dayjs(`${year_month}-01`).startOf('month').format('YYYY-MM-DD HH:mm:ss');
    const end = dayjs(`${year_month}-01`).endOf('month').format('YYYY-MM-DD HH:mm:ss');
    try {
      const diaries = await db.GrowthDiary.findAll({
        attributes: [[db.Sequelize.fn('DATE', db.Sequelize.col('created_at')), 'date']],
        where: {
          user_id,
          is_deleted: false,
          created_at: {
            [db.Sequelize.Op.between]: [start, end]
          }
        },
        group: [db.Sequelize.fn('DATE', db.Sequelize.col('created_at'))],
        raw: true
      });

      // diaries는 [{ date: '2025-06-01' }, { date: '2025-06-05' }, ...]
      return diaries.map(d => d.date);
    } catch (err) {
      console.error('Error fetching diary dates:', err);
      throw new Error('Failed to fetch diary dates');
    }
  }
  async getDiaryByDate(user_id, date) {
    if (!user_id || !date) {
      throw new Error('Missing required fields: user_id, date');
    }
    const growthDiary = db.GrowthDiary;
    try {
      const diary = await db.GrowthDiary.findOne({
        where: {
          user_id,
          is_deleted: false,
          [Op.and]: [db.Sequelize.where(db.Sequelize.fn('DATE', db.Sequelize.col('created_at')), '=', date)]
        }
      });
      return diary;
    } catch (err) {
      console.error('Error fetching diary:', err);
      throw new Error('Failed to fetch diary');
    }
  }
  async create(user_id, plant_id, message) {
    // 1. 챗봇 응답 생성
    const reply = await this.growthDiaryBot.processChat(user_id, plant_id, message);

    // 2. DB 저장용 메시지 객체 생성
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // 2. 성장일지 title 및 content 정의
    const title = `${today} 일지`; // 예: "2025-05-20 일지"
    const content = reply.toString();

    // 3. 오늘 날짜의 일지가 있는지 확인
    const existingDiary = await db.GrowthDiary.findOne({
      where: {
        user_id: user_id,
        is_deleted: false,
        [db.Sequelize.Op.and]: [db.Sequelize.where(db.Sequelize.fn('DATE', db.Sequelize.col('created_at')), '=', today)]
      }
    });
    let result;
    if (existingDiary) {
      // 기존 일지 업데이트
      result = await existingDiary.update({
        content,
        updated_at: now,
        edited: true
      });
    } else {
      // 새 일지 생성
      result = await db.GrowthDiary.create({
        user_id: user_id,
        title,
        content,
        image_url: null,
        created_at: now,
        updated_at: now,
        is_deleted: false,
        edited: false
      });
    }

    // 4. 결과 반환
    return result;
  }
}