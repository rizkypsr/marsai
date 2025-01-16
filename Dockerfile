FROM node:20.15.0-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN yarn install

COPY . . 

RUN yarn build

CMD ["yarn", "start"]