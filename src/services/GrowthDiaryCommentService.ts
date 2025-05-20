import db from '../models/index.js';

export class GrowthDiaryCommentService {
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
      const newComment = await growthDiaryComment.create({
        content,
        user_id,
        diary_id,
        created_at: new Date(),
        updated_at: new Date(),
        is_deleted: false,
        edited: false,
      });

      return newComment;
    } catch (err) {
      console.error('Error creating comment:', err);
      throw new Error('Failed to create comment');
    }
  }
}
