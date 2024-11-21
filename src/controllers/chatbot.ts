import { Request, Response } from 'express';
//웹페이지 크롤링을 위한 cheerio 패키지 참조하기
//npm i cheerio 설치필요
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';

//텍스트 분할기 객체 참조하기
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { pull } from 'langchain/hub';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { StringOutputParser } from '@langchain/core/output_parsers';

//시스템,휴먼 메시지 객체를 참조합니다.
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

//챗봇과의 대화이력정보 관리를 위한 메모리 기반 InMemoryChatMessageHistory 객체 참조하기
import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';

//대화이력 관리를 위한 세부 주요 객체 참조하기
import {
  RunnableWithMessageHistory,
  RunnablePassthrough,
  RunnableSequence,
} from '@langchain/core/runnables';
import { IMemberMessage, ResponseData, UserType } from 'interface/chatbot';



//메모리 영역에 실제 대화이력이  저장되는 전역변수 선언 및 구조정의
//Record<string:사용자세션아이디, InMemoryChatMessageHistory:사용자별대화이력객체>
const messageHistories: Record<string, InMemoryChatMessageHistory> = {};

export const plantChatBot = async (
  req: Request,
  res: Response,
): Promise<void> => {
  //API 호출 기본 결과값 설정
  let apiResult: ResponseData = {
    code: 400,
    data: null,
    msg: 'Failed',
  };

  try {
    //클라이언트에서 POST방식 요청해오는 경우 처리
    if (req.method == 'POST') {
      //Step1:프론트엔드에서 사용자 프롬프트 추출하기
      const prompt = req.body.message; //사용자 입력 메시지 추출
      const nickName = req.body.nickName; //사용자 대화명 추출

      //Step2:LLM 모델 생성하기
      const llm = new ChatOpenAI({
        model: 'gpt-4o',
        apiKey: process.env.OPENAI_API_KEY,
      });

      //result = AIMessage{content:"챗봇응답메시지문자열",...}
      //const result = await llm.invoke(prompt);

      //챗봇에게 대화이력기반 채팅을 할것을 알려주고 대화이력정보를 챗봇 제공하며
      //사용자메시지를 포함한 채팅전용 템플릿을 생성합니다.
      const promptTemplate = ChatPromptTemplate.fromMessages([
        [
          'system',
          '너는 반려식물이야. 따뜻한 말투로 대답해주고 공감해줘. 이전 대화는 기억해서 대답해줘. 대답은 공백포함 70자 이내로 존댓말로 말해줘. ',
        ],
        ['placeholder', '{chat_history}'],
        ['human', '{input}'],
      ]);

      //LLM OuptPutParser를 생성합니다.
      const outputParser = new StringOutputParser();

      //llm 모델 체인 생성(llm기본작업)
      const llmChain = promptTemplate.pipe(llm).pipe(outputParser);

      //대화이력관리를 위한 체인생성(대화이력관리작업)
      //RunnableWithMessageHistory({runnable:llm모델정보,getMessageHistory:()=>{지정된사용자의대화이력반환}},
      //,inputMessagesKey:사용자입력프롬프트값전달,historyMessagesKey:지정된사용자의대화이력정보를 llm에게전달)
      const historyChain = new RunnableWithMessageHistory({
        runnable: llmChain,
        getMessageHistory: async sessionId => {
          //메모리 영역에 해당 세션 아이디 사용자의 대화이력이 없으면 대화이력 관리 객체를 생성해준다.
          if (messageHistories[sessionId] == undefined) {
            messageHistories[sessionId] = new InMemoryChatMessageHistory();
          }
          return messageHistories[sessionId];
        },
        inputMessagesKey: 'input',
        historyMessagesKey: 'chat_history',
      });

      //사용자 세션 아이디 값 구성하기
      //현재 챗봇을 호출한 사용자 아이디값을 세션아이디로 설정해줍니다.
      //추후 프론트엔드서 전달된 사용자아디값을 세션아이디 값으로 설정해주면 되세요..
      const config = {
        configurable: { sessionId: nickName },
      };

      //대화이력관리 기반 챗봇 llm 호출하기
      //historyChain.invoke({input:사용자입력메시지프롬프트},config:현재접속한 사용자정보);
      const resultMessage = await historyChain.invoke(
        { input: prompt },
        config,
      );

      //프론트엔드로 반환되는 메시지 데이터 생성하기
      const resultMsg: IMemberMessage = {
        user_type: UserType.BOT,
        nick_name: 'bot',
        message: resultMessage,
        send_date: new Date(),
      };

      apiResult.code = 200;
      apiResult.data = resultMsg;
      apiResult.msg = 'Ok';
    }
  } catch (err) {
    //Step2:API 호출결과 설정
    apiResult.code = 500;
    apiResult.data = null;
    apiResult.msg = 'Server Error Failed';
  }

  res.json(apiResult);
};

// export const chatBot = async (req: Request, res: Response): Promise<void> => {
//   let apiResult: ResponseData = {
//     code: 400,
//     data: null,
//     msg: "Failed",
//   };

//   try {
//     if (req.method === "POST") {
//       const message = req.body.message;

//       //Step1:Indexing 웹페이지 로더 객체 생성하고 페이지 로딩하기
//       //Step1-1: 웹페이지 로딩하기
//       const loader = new CheerioWebBaseLoader(
//         "https://www.nongsaro.go.kr/portal/ps/psv/psvr/psvre/curationDtl.ps?menuId=PS03352&srchCurationNo=1696"
//       );
//       const docs = await loader.load();

//       //Step1-2: 텍스트 분할기 객체 생성 및 텍스트 분할하기(Chunk)
//       const textSplitter = new RecursiveCharacterTextSplitter({
//         chunkSize: 1000,
//         chunkOverlap: 200,
//       });

//       //텍스트 분할처리하기
//       const splitedDoc = await textSplitter.splitDocuments(docs);

//       //Step1-3 : 임베딩처리(split된 단어를 벡터 데이터화 처리)하고 벡터저장소에 저장하기
//       //임베딩시에는 반드시 지정된 임베딩 모델을 통해 임베딩처리합니다.
//       const vectorStore = await MemoryVectorStore.fromDocuments(
//         splitedDoc,
//         new OpenAIEmbeddings()
//       );

//       //Step2: 임베딩된 데이터 조회하기 (리트리버실시)
//       //검색기 생성하기
//       const retriever = vectorStore.asRetriever();
//       //사용자 질문을 이용해 벡터저장소를 조회하고 조회결괄 반환받는다.
//       const retrieverResult = await retriever.invoke(message);

//       //Step3:RAG 기반(증강된 검색데이터를 통한) LLM 호출하기
//       const gptModel = new ChatOpenAI({
//         model: "gpt-3.5-turbo",
//         temperature: 0.2,
//         apiKey: process.env.OPENAI_API_KEY,
//       });

//       //rag전용 프롬프트 템플릿 생성
//       const ragPrompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");

//       //rag전용 프롬프트 기반 체인 생성하기
//       const ragChain = await createStuffDocumentsChain({
//         llm: gptModel,
//         prompt: ragPrompt,
//         outputParser: new StringOutputParser(),
//       });

//       //체인 실행해서 rag 조회결과를 llm에 전달하고 결과 받아오기
//       const resultMessage = await ragChain.invoke({
//         question: message,
//         context: retrieverResult,
//       });

//       //RESTFul API 챗봇 응답 메시지 포맷 정의하기
//       const resultMsg: IMemberMessage = {
//         user_type: UserType.BOT,
//         nick_name: "bot",
//         message: resultMessage,
//         send_date: new Date(),
//       };

//       apiResult.code = 200;
//       apiResult.data = resultMsg;
//       apiResult.msg = "Ok";
//     }
//   } catch (err) {
//     console.log(err);
//     const resultMsg: IMemberMessage = {
//       user_type: UserType.BOT,
//       nick_name: "bot",
//       message: "챗봇에러발생",
//       send_date: new Date(),
//     };

//     apiResult.code = 500;
//     apiResult.data = resultMsg;
//     apiResult.msg = "Server Error Failed";
//   }

//   res.json(apiResult);
// };
