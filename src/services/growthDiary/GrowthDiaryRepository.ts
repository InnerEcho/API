import db from '@/models/index.js';
import { Op } from 'sequelize';

export interface DiaryCreationAttributes {
  user_id: number;
  title: string;
  content: string;
  dominant_emotion: string | null;
  emotion_factor: string | null;
  primary_mission: string | null;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
  edited: boolean;
}

export class GrowthDiaryRepository {
  public async findDiariesForMonth(
    userId: number,
    start: string,
    end: string,
  ): Promise<any[]> {
    return db.GrowthDiary.findAll({
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
  }

  public async findDiaryById(
    userId: number,
    diaryId: number,
  ): Promise<any | null> {
    return db.GrowthDiary.findOne({
      where: {
        diary_id: diaryId,
        user_id: userId,
        is_deleted: false,
      },
    });
  }

  public async findDiaryByDate(
    userId: number,
    date: string,
  ): Promise<any | null> {
    return db.GrowthDiary.findOne({
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
  }

  public async createDiary(data: DiaryCreationAttributes): Promise<any> {
    return db.GrowthDiary.create(data);
  }

  public async findCompletedMissionByDate(
    userId: number,
    date: string,
  ): Promise<any | null> {
    return db.UserMission.findOne({
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
  }
}
