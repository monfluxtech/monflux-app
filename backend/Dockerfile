FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

RUN chmod +x start.sh

CMD ["sh", "start.sh"]
