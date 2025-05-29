export class PlantChatBotController {
  constructor(chatService) {
    this.chatService = chatService;
  }
  /**
   * 🌱 식물 챗봇과의 대화 처리
   */
  async chat(req, res) {
    const result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      const {
        message,
        user_id,
        plant_id
      } = req.body;
      const response = await this.chatService.create(user_id, plant_id, message);
      result.code = 200;
      result.data = response;
      result.msg = 'Ok';
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      result.code = 500;
      result.msg = 'ServerError';
      res.status(500).json(result);
    }
  }
}