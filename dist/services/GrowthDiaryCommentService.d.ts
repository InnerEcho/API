export declare class GrowthDiaryCommentService {
    getComments(user_id: number, diary_id: number): Promise<any>;
    createComment(content: string, user_id: number, diary_id: number): Promise<any>;
    updateComment(content: string, user_id: number, diary_id: number, comment_id: number): Promise<any>;
    deleteComment(user_id: number, diary_id: number, comment_id: number): Promise<any>;
}
