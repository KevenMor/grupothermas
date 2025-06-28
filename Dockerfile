# Dockerfile para audio-converter-service
FROM node:18-slim

# Instala ffmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Diretório de trabalho
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o restante do código
COPY . .

# Expõe porta
EXPOSE 3000

# Inicia o microserviço
CMD ["node", "audio-converter-service.js"] 