import { GrowthDiaryBot } from '@/services/bots/GrowthDiaryBot.js';
import db from '@/models/index.js';
import { Op } from 'sequelize';
import dayjs from 'dayjs';
import { toCamelCase } from '@/utils/casing.js';
import { formatToKstIsoString } from '@/utils/date.js';

export class GrowthDiaryService {
  constructor(private growthDiaryBot: GrowthDiaryBot) {}

  public async getDiaryDatesForMonth(
    userId: number,
    yearMonth: string,
  ): Promise<any[]> {
    if (!userId || !yearMonth) {
      throw new Error('Missing required fields: userId or yearMonth');
    }

    const start = dayjs(`${yearMonth}-01`)
      .startOf('month')
      .format('YYYY-MM-DD HH:mm:ss');
    const end = dayjs(`${yearMonth}-01`)
      .endOf('month')
      .format('YYYY-MM-DD HH:mm:ss');

    try {
      const diaries = await db.GrowthDiary.findAll({
        attributes: [
          'diary_id',
          'title',
          'content',
          'edited',
          'created_at',
          [db.Sequelize.fn('DATE', db.Sequelize.col('created_at')), 'date'],
        ],
        where: {
          user_id: userId,
          is_deleted: false,
          created_at: {
            [db.Sequelize.Op.between]: [start, end],
          },
        },
        order: [['created_at', 'ASC']],
        raw: true,
      });

      // 각 일기에 대해 날짜와 미리보기 정보 포함
      return diaries.map((diary: any) => ({
        diaryId: diary.diary_id,
        date: diary.date,
        title: diary.title,
        contentPreview: diary.content
          ? diary.content.substring(0, 100) +
            (diary.content.length > 100 ? '...' : '')
          : '',
        edited: diary.edited,
        createdAt: formatToKstIsoString(diary.created_at),
      }));
    } catch (err) {
      console.error('Error fetching diary dates:', err);
      throw new Error('Failed to fetch diary dates');
    }
  }

  public async getDiaryById(userId: number, diaryId: number): Promise<any> {
    if (!userId || !diaryId) {
      throw new Error('Missing required fields: userId, diaryId');
    }

    try {
      const diary = await db.GrowthDiary.findOne({
        where: {
          diary_id: diaryId,
          user_id: userId,
          is_deleted: false,
        },
      });

      if (!diary) {
        throw new Error('Diary not found');
      }

      const plainDiary = diary.get({ plain: true });
      return toCamelCase(plainDiary);
    } catch (err) {
      console.error('Error fetching diary by id:', err);
      throw err;
    }
  }

  public async getDiaryByDate(userId: number, date: string): Promise<any> {
    if (!userId || !date) {
      throw new Error('Missing required fields: userId, date');
    }

    try {
      const diary = await db.GrowthDiary.findOne({
        where: {
          user_id: userId,
          is_deleted: false,
          [Op.and]: [
            db.Sequelize.where(
              db.Sequelize.fn('DATE', db.Sequelize.col('created_at')),
              '=',
              date,
            ),
          ],
        },
      });

      if (!diary) {
        return null;
      }

      const plainDiary = diary.get({ plain: true });
      return toCamelCase(plainDiary);
    } catch (err) {
      console.error('Error fetching diary:', err);
      throw new Error('Failed to fetch diary');
    }
  }

  async create(userId: number, plantId: number, message: string) {
    // 1. 챗봇 응답 생성
    const reply = await this.growthDiaryBot.processChat(
      userId,
      plantId,
      message,
    );

    // 2. DB 저장용 메시지 객체 생성
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // 2. 성장일지 title 및 content 정의
    const title = `${today} 일지`; // 예: "2025-05-20 일지"
    const content = reply.toString();

    // 3. 오늘 날짜의 일지가 있는지 확인
    const existingDiary = await db.GrowthDiary.findOne({
      where: {
        user_id: userId,
        is_deleted: false,
        [db.Sequelize.Op.and]: [
          db.Sequelize.where(
            db.Sequelize.fn('DATE', db.Sequelize.col('created_at')),
            '=',
            today,
          ),
        ],
      },
    });

    let result;
    if (existingDiary) {
      // 기존 일지 업데이트
      result = await existingDiary.update({
        content,
        updated_at: now,
        edited: true,
      });
    } else {
      // 새 일지 생성
      result = await db.GrowthDiary.create({
        user_id: userId,
        title,
        content,
        image_url: null,
        created_at: now,
        updated_at: now,
        is_deleted: false,
        edited: false,
      });
    }

    // 4. 결과 반환 (camelCase 변환)
    if (typeof result.get === 'function') {
      return toCamelCase(result.get({ plain: true }));
    }

    return toCamelCase(result);
  }
}
