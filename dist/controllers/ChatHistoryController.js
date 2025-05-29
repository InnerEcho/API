import { ChatHistoryService } from "../services/ChatHistoryService.js";
class ChatHistoryController {
  constructor(chatHistoryService) {
    this.chatHistoryService = chatHistoryService;
  }

  /**
   * 🌱 채팅 기록 조회
   */
  async getChatHistory(req, res) {
    try {
      const {
        user_id,
        plant_id
      } = req.body;
      const histories = await this.chatHistoryService.getChatHistory(user_id, plant_id);
      res.status(200).json({
        code: 200,
        data: histories,
        msg: 'Ok'
      });
    } catch (error) {
      console.error('Error fetching chat history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chat history'
      });
    }
  }
}
export default new ChatHistoryController(new ChatHistoryService());