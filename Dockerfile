FROM node:17

WORKDIR /app

COPY package*.json ./
COPY server.js ./

RUN npm ci --only=production

CMD [ "node", "server.js" ]