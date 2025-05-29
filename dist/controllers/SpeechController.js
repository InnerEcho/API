import { PlantSpeechService } from '../services/SpeechService.js';
class PlantSpeechController {
    constructor(plantSpeechService) {
        this.plantSpeechService = plantSpeechService;
    }
    /**
     * STT 처리
     */
    async speechToText(req, res) {
        const result = { code: 400, data: null, msg: 'Failed' };
        try {
            const { user_id, plant_id } = req.body;
            if (!req.file || !req.file.path) {
                result.msg = 'Not Exist Audio File';
                res.status(400).json(result);
                return;
            }
            const transcriptionMessage = await this.plantSpeechService.speechToText(req.file.path, user_id, plant_id);
            result.code = 200;
            result.data = transcriptionMessage;
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
    /**
     * TTS 처리
     */
    async textToSpeech(req, res) {
        try {
            const { message: userMessage } = req.body;
            const audioBuffer = await this.plantSpeechService.textToSpeech(userMessage);
            res.set({
                'Content-Type': 'audio/ogg',
                'Content-Disposition': 'inline; filename="speech.ogg"',
                'Content-Length': audioBuffer.length,
            });
            res.send(audioBuffer);
        }
        catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    }
}
export default new PlantSpeechController(new PlantSpeechService());
//# sourceMappingURL=SpeechController.js.map