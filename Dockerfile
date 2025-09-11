# Dockerfile

# ==================================
# 스테이지 1: 빌드 환경 (Builder)
# ==================================
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ==================================
# 스테이지 2: 최종 프로덕션 이미지 (Production)
# ==================================
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm install --omit=dev

COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/src/docs/leafy.yaml ./src/docs/leafy.yaml
COPY --from=build /usr/src/app/src/public/plantdata.json ./src/public/plantdata.json

EXPOSE 3000

# 컨테이너 시작 시 실행할 명령어
CMD ["node", "dist/app.js"]