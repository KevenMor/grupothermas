FROM node:18 AS builder

# Instala ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

# Etapa de produção
FROM node:18 AS runner
WORKDIR /app

# Copia apenas o necessário da etapa de build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/.next ./.next/
COPY --from=builder /app/public ./public/
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/next.config.js ./

EXPOSE 8080

CMD ["npm", "start"] 