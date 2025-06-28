# Dockerfile para aplicação Next.js principal
FROM node:18 AS builder

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm ci --only=production

# Copia todo o código fonte
COPY . .

# Executa o build
RUN npm run build

# Etapa de produção
FROM node:18 AS runner
WORKDIR /app

# Define variável de ambiente para produção
ENV NODE_ENV=production

# Copia apenas o necessário da etapa de build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next/
COPY --from=builder /app/public ./public/
COPY --from=builder /app/node_modules ./node_modules/
COPY --from=builder /app/next.config.js ./

# Cria usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Muda propriedade dos arquivos
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expõe porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"] 