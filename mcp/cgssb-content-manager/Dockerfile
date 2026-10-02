FROM node:22-alpine

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install --omit=dev

COPY src ./src
RUN npx tsc -p tsconfig.json

ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787

CMD ["node", "dist/server.js"]
