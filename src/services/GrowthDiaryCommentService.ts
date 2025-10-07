import db from '../models/index.js';

export class GrowthDiaryCommentService {
  public async getComments(user_id: number, diary_id: number): Promise<any> {
    if (!user_id || !diary_id) {
      throw new Error('Missing required fields: user_id, diary_id');
    }

    const growthDiaryComment = db.GrowthDiaryComment;

    try {
      const comments = await growthDiaryComment.findAll({
        where: {
          user_id,
          diary_id,
          is_deleted: false, // soft delete 처리된 항목 제외
        },
        order: [['created_at', 'ASC']], // 작성순으로 정렬
      });

      return comments;
    } catch (err) {
      console.error('Error fetching comments:', err);
      throw new Error('Failed to fetch comments');
    }
  }

  public async createComment(
    content: string,
    user_id: number,
    diary_id: number,
  ): Promise<any> {
    if (!content || !user_id || !diary_id) {
      throw new Error('Missing required fields: content, user_id, diary_id');
    }

    const growthDiaryComment = db.GrowthDiaryComment;

    try {
      const date = new Date();

      const newComment = await db.GrowthDiaryComment.create({
        content,
        user_id,
        diary_id,
        created_at: date,
        updated_at: date,
        is_deleted: false,
        edited: false,
      });

      return newComment;
    } catch (err) {
      console.error('Error creating comment:', err);
      throw new Error('Failed to create comment');
    }
  }

  public async updateComment(
    content: string,
    user_id: number,
    diary_id: number,
    comment_id: number,
  ): Promise<any> {
    if (!content || !user_id || !diary_id || !comment_id) {
      throw new Error(
        'Missing required fields: content, user_id, diary_id, comment_id',
      );
    }

    try {
      const date = new Date();

      const [affectedRows] = await db.GrowthDiaryComment.update(
        { content: content, updated_at: date, edited: true },
        {
          where: {
            user_id,
            diary_id,
            comment_id,
            is_deleted: false,
          },
        },
      );

      if (affectedRows === 0) {
        throw new Error('Comment not found');
      }

      // 업데이트된 댓글 정보 반환
      const updatedComment = await db.GrowthDiaryComment.findOne({
        where: {
          comment_id,
          user_id,
          diary_id,
        },
      });

      return updatedComment;
    } catch (err) {
      console.error('Error updating comment:', err);
      throw err;
    }
  }

  public async deleteComment(
    user_id: number,
    diary_id: number,
    comment_id: number,
  ): Promise<any> {
    if (!user_id || !diary_id || !comment_id) {
      throw new Error(
        'Missing required fields: user_id, diary_id, comment_id',
      );
    }

    try {
      const date = new Date();

      const [affectedRows] = await db.GrowthDiaryComment.update(
        { is_deleted: true, updated_at: date },
        {
          where: {
            user_id,
            diary_id,
            comment_id,
            is_deleted: false, // 이미 삭제된 건 다시 삭제하지 않음
          },
        },
      );

      if (affectedRows === 0) {
        throw new Error('Comment not found');
      }

      return { success: true };
    } catch (err) {
      console.error('Error deleting comment:', err);
      throw err;
    }
  }
}
