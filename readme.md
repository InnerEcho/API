# 🌿 InnerEcho (Leafy)

> **"HCI 설계 기반의 AR 반려 식물 교감 시스템: 정서적 몰입을 통한 1인 가구 우울증 케어"**

## 📌 Project Overview (HCI Perspective)

본 프로젝트는 1인 가구의 우울증 문제 해결을 위해 **사용자와 시스템 간의 정서적 상호작용**이 긍정적 경험을 형성하는 과정을 연구하고 구현했습니다. 단순한 챗봇을 넘어 AR 반려식물, 미션 구조, 식물 캐릭터라는 HCI 설계 요소를 결합하여 사용자가 자신의 감정을 외부로 투사(Externalization)하고 상호작용에 깊이 몰입할 수 있는 환경을 제공합니다.

---

## 🏗 Core Architecture: Conversation Orchestrator

정서적 안정성과 대화 맥락 유지를 위해 **역할 분리형 에이전트 구조**를 설계했습니다.

* 
**Conversation Orchestrator**: 대화의 상태와 기억 계층(Memory Layer)을 조율합니다.


* 
**Memory Hierarchy**: Redis(단기)와 Vector DB(장기)를 활용한 하이브리드 메모리 시스템.


* 
**Safety Pipeline**: 응답 생성과 검토 단계를 분리하여 정서적 민감도를 관리합니다.



---

## 💡 Technical Deep Dive (Troubleshooting)

### 1. 실시간성 확보: WebRTC 스트리밍 파이프라인 전환

* 
**Problem**: 초기 Request-Response 기반 구조에서 음성 인식, 생성, 출력 단계의 지연이 누적되어 상호작용의 몰입(Flow)이 단절됨.


* 
**Cause Analysis**: 각 단계의 독립적 처리가 네트워크 오버헤드를 발생시키고 사용자를 '기다리게' 만듦.


* 
**Solution**: `OpenAI Realtime API`와 **WebRTC 기반 스트리밍 파이프라인**을 구축하여 음성 입력과 응답을 실시간 흐름으로 처리.


* 
**Result**: 응답 지연을 1초 미만으로 단축하여 대화의 연속성을 확보하고 HCI 관점의 '몰입형 상호작용' 달성.



### 2. 하이브리드 메모리: 정서 맥락 유지 비용 최적화

* 
**Problem**: 대화가 길어질수록 전체 이력을 전달하는 방식은 토큰 비용 상승과 응답 속도 저하를 초래함.


* 
**Cause Analysis**: 모든 과거 데이터를 context window에 담는 '무거운 맥락(Heavy Context)' 전달 방식의 한계.


* 
**Solution**: **단기(Redis)·장기(Vector DB) 맥락 분리 구조** 설계.


* 
`Redis`: 즉각적인 대화 흐름 관리.


* 
`Upstash Vector`: 장기적 감정 변화 및 상호작용 기록을 벡터화하여 필요 시 유사도 기반 검색 후 활용.




* 
**Result**: 대화 길이에 상관없이 일관된 응답 속도를 유지하며 장기적인 정서 흐름 안정화.



### 3. 정서적 안전망: 생성-검토 에이전트 분리 (Reflection Pattern)

* 
**Problem**: 단일 생성 흐름에서 우울증 사용자에게 부적절하거나 위험한 조언이 전달될 가능성 상존.


* 
**Cause Analysis**: 생성형 AI의 할루시네이션(Hallucination) 및 정서적 민감도 판단 부족.


* 
**Solution**: **Reflection Agent** 패턴 도입.


* 
`ChatAgent`: 공감 및 조언 생성 담당.


* 
`SafetyModerator`: 생성된 응답의 정서적 안정성 검토 및 필터링 수행.




* 
**Result**: 실시간성을 일부 희생하더라도 정서 케어에 필수적인 응답의 신중함과 안전성 확보.



---

## 🛠 Tech Stack & Rationale

* 
**Language/Runtime**: TypeScript, Node.js v22 (비동기 실시간 스트리밍 최적화).


* 
**Database**: MySQL (데이터 정합성), Redis (고속 캐싱), Upstash Vector (정서 성향 분석).


* 
**AI/LLM**: LangChain, OpenAI Realtime API (WebRTC).


* 
**Frontend/AR**: React Native, ViroReact (현실 공간 기반 몰입 경험).



---

## 🚀 Business Value & Impact

* 
**HCI 가치**: '반려 식물'이라는 매개체를 통한 감정 외화 기법으로 사용자 자기 효능감 회복 유도.


* 
**기술적 성과**: AI 에이전트의 안정성을 보장하는 검토 시스템 구축 및 실시간 음성 상호작용 환경 완성.


* 
**사회적 기여**: 1인 가구의 정서적 고립감을 완화하는 서비스형 정서 동반자 모델 제시.
