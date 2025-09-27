# Species 데이터 마이그레이션 및 시드 사용법

## 개요
species 테이블에 대한 마이그레이션과 시드 데이터를 구성했습니다.

## 구조
- **마이그레이션**: 스키마만 생성 (`migrations/20250927072114-create-species-table.js`)
- **필수 데이터 시드**: 운영 환경에서도 필요한 기본 데이터 (`seeders/20250927072134-essential-species-data.js`)
- **개발용 시드**: 개발 환경에서만 사용하는 더미 데이터 (`seeders/20250927072136-dev-species-data.js`)

## 사용법

### 1. 마이그레이션 실행
```bash
# 마이그레이션 실행
npm run migrate

# 마이그레이션 롤백
npm run migrate:undo
```

### 2. 시드 데이터 실행

#### 필수 데이터 (운영 환경 포함)
```bash
# 필수 데이터만 시드
npm run seed:essential

# 모든 시드 실행 (필수 + 개발용)
npm run seed
```

#### 개발용 더미 데이터 (개발 환경만)
```bash
# Linux/Mac
npm run seed:dev

# Windows
npm run seed:dev:win
```

### 3. 시드 데이터 롤백
```bash
# 모든 시드 롤백
npm run seed:undo

# 개발용 시드만 롤백 (Linux/Mac)
npm run seed:dev:undo

# 개발용 시드만 롤백 (Windows)
npm run seed:dev:undo:win
```

## 특징

### 1. 중복 방지
- `INSERT IGNORE`를 사용하여 중복 데이터 삽입 방지
- 동일한 `species_name`이 이미 존재하면 무시

### 2. 환경 분리
- 개발용 시드는 `NODE_ENV=development`일 때만 실행
- 운영 환경에서는 개발용 더미 데이터가 삽입되지 않음

### 3. 필수 데이터
- 몬스테라, 고무나무, 산세베리아, 스투키, 필로덴드론
- 운영 환경에서도 필요한 기본 식물 데이터

### 4. 개발용 더미 데이터
- `개발용_테스트_식물_1` ~ `개발용_테스트_식물_5`
- 개발 환경에서만 사용하는 테스트 데이터

## 주의사항
- 필수 데이터는 운영 환경에서 삭제하지 않음
- 개발용 더미 데이터는 `NODE_ENV` 체크로 운영 환경 반영 방지
- 시드 실행 전에 마이그레이션이 완료되어야 함
