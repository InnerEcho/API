export class PlantSpeechController {
  constructor(speechService) {
    this.speechService = speechService;
  }

  /**
   * STT 처리
   */
  async speechToText(req, res) {
    let result = {
      code: 400,
      data: null,
      msg: 'Failed'
    };
    try {
      if (!req.file) {
        result.msg = 'Not Exist Audio File';
        res.status(400).json(result);
        return;
      }
      const userId = req.user.userId;
      const {
        plant_id: plantId
      } = req.body;
      const response = await this.speechService.speechToText(req.file.path, userId, plantId);
      result.code = 200;
      result.data = response;
      result.msg = 'Ok';
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      result.code = 500;
      result.msg = 'Server Error';
      res.status(500).json(result);
    }
  }

  // controllers/SpeechController.ts
  async textToSpeech(req, res) {
    try {
      const {
        message
      } = req.body;
      if (!message || typeof message !== 'string') {
        res.status(400).json({
          code: 400,
          msg: 'Missing or invalid message'
        });
        return;
      }
      const {
        audioBlob,
        mimeType
      } = await this.speechService.textToSpeech(message);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', 'inline; filename=speech.ogg');
      res.send(audioBlob); // Blob 데이터를 직접 전송
      console.log('✅ Blob data sent to client.');
    } catch (err) {
      console.error('TTS Error:', err);
      res.status(500).json({
        code: 500,
        msg: 'TTS error'
      });
    }
  }
}