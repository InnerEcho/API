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
  // state 저장 호출출
  async emotionSave(req, res) {
    try {
      const {
        user_Id,
        plant_Id,
        message,
        emotion
      } = req.body;

      // ChatService의 create 메서드 호출
      await this.chatService.create(user_Id, plant_Id, message, emotion);

      // 필요하다면 추가 로직 및 응답 처리
      res.status(200).json({
        code: 200,
        msg: 'Success'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        code: 500,
        msg: 'Server Error'
      });
    }
  }
}