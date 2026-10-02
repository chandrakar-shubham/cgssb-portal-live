FROM node:22-alpine

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install --no-audit --no-fund

COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787

CMD ["node", "dist/server.js"]
