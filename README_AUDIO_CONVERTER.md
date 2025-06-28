# Audio Converter Service

Microserviço Node.js para conversão de áudio (webm/opus → MP3) e upload para Firebase Storage.

## Como funciona
- Recebe arquivo de áudio (webm/opus) via POST `/convert-audio` (multipart/form-data, campo `file`)
- Converte para MP3 usando ffmpeg
- Faz upload para Firebase Storage na pasta `chats/audio/`
- Retorna URL pública do MP3

## Variáveis de Ambiente
- `FIREBASE_PROJECT_ID` – ID do projeto Firebase
- `FIREBASE_CLIENT_EMAIL` – E-mail do service account
- `FIREBASE_PRIVATE_KEY` – Chave privada do service account (atenção ao \n)
- `FIREBASE_STORAGE_BUCKET` – Nome do bucket do Firebase Storage (apenas o nome, ex: 'grupo-thermas-a99fc')
- `PORT` – Porta do serviço (padrão: 3000)

## Build e Deploy (Docker)
```bash
# Build da imagem
sudo docker build -t audio-converter-service .

# Rodar o container
sudo docker run -d \
  -p 3000:3000 \
  -e FIREBASE_PROJECT_ID=seu-projeto \
  -e FIREBASE_CLIENT_EMAIL=seu-email@projeto.iam.gserviceaccount.com \
  -e FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" \
  -e FIREBASE_STORAGE_BUCKET=grupo-thermas-a99fc \
  --name audio-converter-service \
  audio-converter-service
```

## Exemplo de Request
```bash
curl -X POST http://localhost:3000/convert-audio \
  -F "file=@/caminho/para/audio.webm"
```

**Resposta:**
```json
{
  "success": true,
  "url": "https://storage.googleapis.com/seu-bucket/chats/audio/audio_123456789.mp3?..."
}
```

## Observações
- O serviço exige ffmpeg nativo (já instalado no Dockerfile).
- O arquivo convertido é sempre MP3 válido, pronto para uso com Z-API/WhatsApp.
- O link gerado é público e pode ser usado diretamente no painel ou API. 