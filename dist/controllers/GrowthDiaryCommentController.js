import { GrowthDiaryCommentService } from "../services/GrowthDiaryCommentService.js";
export class GrowthDiaryCommentController {
    async create(req, res) {
        const result = { code: 400, data: null, msg: 'Failed' };
        try {
            const { content, user_id, diary_id } = req.body;
            const growthDiaryCommentService = new GrowthDiaryCommentService();
            const response = await growthDiaryCommentService.createComment(content, user_id, diary_id);
            result.code = 200;
            result.data = response;
            result.msg = 'Ok';
            res.status(200).json(result);
        }
        catch (err) {
            console.error(err);
            result.code = 500;
            result.msg = 'ServerError';
            res.status(500).json(result);
        }
    }
}
