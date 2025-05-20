import { Request, Response } from "express";
import PlantSpeechService from "../services/SpeechService.js";
import { ApiResult } from "../interface/api.js";

class PlantSpeechController {
  /**
   * STT 처리
   */
  public async speechToText(req: Request, res: Response): Promise<void> {
    const result: ApiResult = { code: 400, data: null, msg: "Failed" };

    try {
      const { user_id, plant_id } = req.body as { user_id: number; plant_id: number };

      if (!req.file || !req.file.path) {
        result.msg = "Not Exist Audio File";
        res.status(400).json(result);
        return;
      }

      const transcriptionMessage = await PlantSpeechService.speechToText(req.file.path, user_id, plant_id);
      result.code = 200;
      result.data = transcriptionMessage;
      result.msg = "Ok";
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      result.code = 500;
      result.msg = "ServerError";
      res.status(500).json(result);
    }
  }

  /**
   * TTS 처리
   */
  public async textToSpeech(req: Request, res: Response): Promise<void> {
    try {
      const { message: userMessage } = req.body as { message: string };
      const audioBuffer = await PlantSpeechService.textToSpeech(userMessage);

      res.set({
        "Content-Type": "audio/ogg",
        "Content-Disposition": 'inline; filename="speech.ogg"',
        "Content-Length": audioBuffer.length,
      });

      res.send(audioBuffer);
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  }
}

export default new PlantSpeechController();
