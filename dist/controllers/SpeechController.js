export class PlantSpeechController {
  constructor(speechService) {
    this.speechService = speechService;
  }

  /**
   * STT 처리
   */
  async speechToText(req, res) {
    const result = {
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
      const {
        user_id,
        plant_id
      } = req.body;
      const response = await this.speechService.speechToText(req.file.path, user_id, plant_id);
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
  async textToSpeech(req, res) {
    try {
      const {
        message
      } = req.query;
      const {
        audioStream,
        mimeType
      } = await this.speechService.textToSpeech(message);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Content-Disposition', 'inline; filename=speech.ogg');
      audioStream.on('end', () => console.log('✅ Streaming finished to client.'));
      audioStream.on('error', err => console.error('❌ Stream error:', err));
      audioStream.pipe(res);
    } catch (err) {
      console.error('TTS Stream Error:', err);
      res.status(500).json({
        code: 500,
        msg: 'TTS stream error'
      });
    }
  }
}