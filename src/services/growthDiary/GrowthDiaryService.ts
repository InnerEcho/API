import { GrowthDiaryBot } from '@/services/bots/GrowthDiaryBot.js';
import db from '@/models/index.js';
import { Op } from 'sequelize';
import dayjs from 'dayjs';
import { toCamelCase } from '@/utils/casing.js';
import { formatToKstIsoString } from '@/utils/date.js';
import { ChatHistoryService } from '@/services/chat/ChatHistoryService.js';
import type { IMessage } from '@/interface/index.js';
import { UserType } from '@/interface/index.js';

export class GrowthDiaryService {
  private chatHistoryService: ChatHistoryService;

  constructor(private growthDiaryBot: GrowthDiaryBot) {
    this.chatHistoryService = new ChatHistoryService();
  }

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
          'dominant_emotion',
          'emotion_factor',
          'primary_mission',
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
        emotion: diary.dominant_emotion ?? null,
        emotionFactor: diary.emotion_factor ?? null,
        primaryMission: diary.primary_mission ?? null,
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
    const todayHistory = await this.chatHistoryService.getTodayHistory(
      userId,
      plantId,
    );
    const { emotion: dominantEmotion, factor: emotionFactor } =
      this.getDominantEmotionFromHistory(todayHistory);
    const primaryMission = await this.findPrimaryMission(userId, today);

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
        dominant_emotion: dominantEmotion,
        emotion_factor: emotionFactor,
        primary_mission: primaryMission,
      });
    } else {
      // 새 일지 생성
      result = await db.GrowthDiary.create({
        user_id: userId,
        title,
        content,
        dominant_emotion: dominantEmotion,
        emotion_factor: emotionFactor,
        primary_mission: primaryMission,
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

  private getDominantEmotionFromHistory(
    history: IMessage[],
  ): { emotion: string | null; factor: string | null } {
    if (!history || history.length === 0) {
      return { emotion: null, factor: null };
    }

    const userMessages = history.filter(
      item =>
        item.userType === UserType.USER &&
        item.emotion &&
        item.emotion !== '중립',
    );

    if (userMessages.length === 0) {
      return { emotion: null, factor: null };
    }

    const counts = new Map<string, number>();
    userMessages.forEach(message => {
      const key = message.emotion as string;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    const maxCount = Math.max(...counts.values());
    let candidates = [...counts.entries()]
      .filter(([, count]) => count === maxCount)
      .map(([emotion]) => emotion);

    const happiness = '행복';
    let dominantEmotion: string | null = null;
    if (candidates.includes(happiness)) {
      dominantEmotion = happiness;
    } else if (candidates.length === 1) {
      dominantEmotion = candidates[0];
    } else {
      const sortedByRecency = [...userMessages].sort((a, b) => {
        return (
          new Date(b.sendDate).getTime() - new Date(a.sendDate).getTime()
        );
      });
      dominantEmotion =
        sortedByRecency.find(message =>
          candidates.includes(message.emotion as string),
        )?.emotion ?? candidates[0];
    }

    const latestForEmotion = [...userMessages]
      .filter(message => message.emotion === dominantEmotion)
      .sort(
        (a, b) =>
          new Date(b.sendDate).getTime() - new Date(a.sendDate).getTime(),
      )[0];

    return {
      emotion: dominantEmotion,
      factor: latestForEmotion?.factor ?? null,
    };
  }

  private async findPrimaryMission(
    userId: number,
    date: string,
  ): Promise<string | null> {
    try {
      const missionRecord = await db.UserMission.findOne({
        where: {
          user_id: userId,
          status: 'complete',
          [Op.and]: [
            db.Sequelize.where(
              db.Sequelize.fn('DATE', db.Sequelize.col('completed_at')),
              '=',
              date,
            ),
          ],
        },
        include: [
          {
            model: db.Mission,
            as: 'mission',
            attributes: ['title', 'code'],
            required: false,
          },
        ],
        order: [
          ['completed_at', 'ASC'],
          ['id', 'ASC'],
        ],
      });

      if (!missionRecord) {
        return null;
      }

      const mission = missionRecord.get('mission') as
        | { title?: string | null; code?: string | null }
        | null;

      return mission?.title ?? mission?.code ?? null;
    } catch (error) {
      console.error('Failed to resolve primary mission', error);
      return null;
    }
  }
}
