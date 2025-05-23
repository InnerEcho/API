import db from '../models/index.js';
export class GrowthDiaryCommentService {
    async getComments(user_id, diary_id) {
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
        }
        catch (err) {
            console.error('Error fetching comments:', err);
            throw new Error('Failed to fetch comments');
        }
    }
    async createComment(content, user_id, diary_id) {
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
        }
        catch (err) {
            console.error('Error creating comment:', err);
            throw new Error('Failed to create comment');
        }
    }
}
