FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --production

COPY backend/ .

EXPOSE 5000

RUN chmod +x start.sh

CMD ["sh", "start.sh"]
# cache-bust 1781834590
