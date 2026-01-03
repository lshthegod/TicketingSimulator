FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache tzdata \
  && cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime \
  && echo "Asia/Seoul" > /etc/timezone

ENV TZ=Asia/Seoul

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["node", "dist/main"]