import db from "../../models/index.js";
import { toCamelCase } from "../../utils/casing.js";
export class GrowthDiaryCommentService {
  async getComments(userId, diaryId) {
    if (!userId || !diaryId) {
      throw new Error('Missing required fields: userId, diaryId');
    }
    const growthDiaryComment = db.GrowthDiaryComment;
    try {
      const comments = await growthDiaryComment.findAll({
        where: {
          user_id: userId,
          diary_id: diaryId,
          is_deleted: false // soft delete 처리된 항목 제외
        },
        order: [['created_at', 'ASC']] // 작성순으로 정렬
      });
      const plainComments = comments.map(comment => comment.get({
        plain: true
      }));
      return toCamelCase(plainComments);
    } catch (err) {
      console.error('Error fetching comments:', err);
      throw new Error('Failed to fetch comments');
    }
  }
  async createComment(content, userId, diaryId) {
    if (!content || !userId || !diaryId) {
      throw new Error('Missing required fields: content, userId, diaryId');
    }
    const growthDiaryComment = db.GrowthDiaryComment;
    try {
      const date = new Date();
      const newComment = await db.GrowthDiaryComment.create({
        content,
        user_id: userId,
        diary_id: diaryId,
        created_at: date,
        updated_at: date,
        is_deleted: false,
        edited: false
      });
      return toCamelCase(newComment.get({
        plain: true
      }));
    } catch (err) {
      console.error('Error creating comment:', err);
      throw new Error('Failed to create comment');
    }
  }
  async updateComment(content, userId, diaryId, commentId) {
    if (!content || !userId || !diaryId || !commentId) {
      throw new Error('Missing required fields: content, userId, diaryId, commentId');
    }
    try {
      const date = new Date();
      const [affectedRows] = await db.GrowthDiaryComment.update({
        content: content,
        updated_at: date,
        edited: true
      }, {
        where: {
          user_id: userId,
          diary_id: diaryId,
          comment_id: commentId,
          is_deleted: false
        }
      });
      if (affectedRows === 0) {
        throw new Error('Comment not found');
      }

      // 업데이트된 댓글 정보 반환
      const updatedComment = await db.GrowthDiaryComment.findOne({
        where: {
          comment_id: commentId,
          user_id: userId,
          diary_id: diaryId
        }
      });
      if (!updatedComment) {
        throw new Error('Comment not found');
      }
      return toCamelCase(updatedComment.get({
        plain: true
      }));
    } catch (err) {
      console.error('Error updating comment:', err);
      throw err;
    }
  }
  async deleteComment(userId, diaryId, commentId) {
    if (!userId || !diaryId || !commentId) {
      throw new Error('Missing required fields: userId, diaryId, commentId');
    }
    try {
      const date = new Date();
      const [affectedRows] = await db.GrowthDiaryComment.update({
        is_deleted: true,
        updated_at: date
      }, {
        where: {
          user_id: userId,
          diary_id: diaryId,
          comment_id: commentId,
          is_deleted: false // 이미 삭제된 건 다시 삭제하지 않음
        }
      });
      if (affectedRows === 0) {
        throw new Error('Comment not found');
      }
      return {
        success: true
      };
    } catch (err) {
      console.error('Error deleting comment:', err);
      throw err;
    }
  }
}