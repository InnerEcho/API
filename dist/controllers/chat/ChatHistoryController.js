export class ChatHistoryController {
  chatHistoryService;
  constructor(chatHistoryService) {
    this.chatHistoryService = chatHistoryService;
  }

  /**
   * 🌱 채팅 기록 조회
   */
  async getChatHistory(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const userId = req.user.userId;
      const {
        plantId
      } = req.params;

      // plantId 유효성 검사
      const parsedPlantId = parseInt(plantId);
      if (isNaN(parsedPlantId) || parsedPlantId <= 0) {
        result.code = 400;
        result.msg = 'Invalid plant ID';
        res.status(400).json(result);
        return;
      }
      const response = await this.chatHistoryService.getChatHistoryFromDb(userId, parsedPlantId);
      result.code = 200;
      result.data = response;
      result.msg = 'Ok';
      res.status(200).json(result);
    } catch (err) {
      console.error('Get chat history error:', err);

      // 특정 에러 처리
      if (err.message === 'Plant not found') {
        result.code = 404;
        result.msg = 'Plant not found';
        res.status(404).json(result);
        return;
      }
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  }
}