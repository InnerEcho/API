import 'dotenv/config';
import { Request, Response } from 'express';
import { ApiResult } from '../interface/api';
import { IMessage, UserType } from '../interface/chatbot';
import { SpeechClient } from '@google-cloud/speech';
import fs from 'fs';

export const speechToText = async (
  req: Request,
  res: Response,
): Promise<any> => {
  let apiResult: ApiResult = {
    code: 400,
    data: null,
    msg: 'Failed',
  };

  try {
    const userId = req.body.user_id; //사용자 이름 추출
    const plantId = req.body.plant_id; //식물 이름 추출

    // 업로드된 파일 확인
    if (!req.file || !req.file.path) {
      apiResult.msg = 'Not Exist Audio File';
      res.json(apiResult);
      return;
    }

    // Google Cloud SpeechClient 생성 (환경 변수 사용)
    const client = new SpeechClient();

    // 파일 경로 가져오기
    const filePath = req.file.path;

    // 파일을 Buffer로 읽기
    const fileContent = fs.readFileSync(filePath);

    // Define the audio and config objects
    const audio = {
      content: fileContent.toString('base64'), // 오디오 파일을 Base64 인코딩하여 content에 추가
    };

    const config = {
      encoding: 'OGG_OPUS' as const, // Opus 인코딩을 사용
      sampleRateHertz: 16000, // 녹음 시 설정했던 샘플링 레이트
      languageCode: 'ko-KR',
    };

    const request = {
      audio,
      config,
    };

    // Call the recognize method
    const [response] = await client.recognize(request);

    // Extract the transcription from the response
    const transcription = response.results
      ?.map(result => result.alternatives?.[0].transcript)
      .join('\n');

    console.log(`Transcription: ${transcription}`);

    //프론트엔드로 반환되는 메시지 데이터 생성하기
    const plantResultMsg: IMessage = {
      user_id: userId,
      plant_id: plantId,
      message: transcription,
      user_type: UserType.BOT,
      send_date: new Date(),
    };

    apiResult.code = 200;
    apiResult.data = plantResultMsg;
    apiResult.msg = 'Ok';
  } catch (err) {
    apiResult.code = 500;
    apiResult.data = null;
    apiResult.msg = 'Server Error';
    console.error('음성 인식 처리 중 오류 발생:', err); 
  }

  res.json(apiResult);
};
