FROM node:17-alpine3.12

WORKDIR /app

COPY package.json .

RUN npm install -g prisma
RUN npm install

COPY . .

RUN prisma generate

CMD ["npm", "start"]

