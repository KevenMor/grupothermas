# Sistema de Upload de Mídia com Firebase Storage

## Visão Geral

Este sistema implementa um fluxo completo de upload de mídia (imagens, áudios, vídeos, documentos) para o Firebase Storage, com conversão automática de áudio e integração com a Z-API para envio via WhatsApp.

## Fluxo Obrigatório

### 1. Upload de Arquivo → Firebase Storage → Link Público

```
Arquivo (Frontend) → API Upload → Firebase Storage → URL Pública → Z-API
```

### 2. Recebimento via Webhook → Download → Firebase Storage → Link Público

```
Z-API Webhook → Download → Firebase Storage → URL Pública → Histórico
```

## Componentes Principais

### 1. `lib/mediaUpload.ts`

Utilitário principal para upload e conversão de mídia:

```typescript
// Upload direto para Firebase Storage
uploadToFirebaseStorage(buffer, fileName, mimeType, mediaType)

// Download e salvamento de mídia externa
downloadAndSaveMedia(sourceUrl, mediaType, originalFileName)

// Detecção de formato de áudio suportado
getSupportedAudioFormat()

// Validação de URLs do Firebase Storage
isFirebaseStorageUrl(url)
```

### 2. `app/api/atendimento/upload/route.ts`

Endpoint para upload de arquivos do frontend:

- Validação de tipos de arquivo
- Conversão automática de áudio (WebM/Opus → MP3)
- Upload para Firebase Storage
- Geração de URLs públicas

### 3. `app/api/atendimento/send-media/route.ts`

Endpoint para envio de mídia via Z-API:

- Validação de URLs do Firebase Storage
- Envio via Z-API
- Salvamento no histórico do Firestore

### 4. `app/api/zapi/webhook/route.ts`

Webhook para recebimento de mensagens:

- Download automático de mídias recebidas
- Salvamento no Firebase Storage
- Sincronização com histórico

## Conversão de Áudio

### Formatos Suportados

**Entrada:**
- WebM (Opus)
- OGG (Opus)
- WAV
- MP3

**Saída:**
- MP3 (padrão para Z-API)

### Processo de Conversão

```typescript
// Usando FFmpeg via fluent-ffmpeg
ffmpeg(inputPath)
  .toFormat('mp3')
  .audioCodec('libmp3lame')
  .audioBitrate(128)
  .save(outputPath)
```

## Estrutura do Firebase Storage

```
chats/
├── image/
│   ├── 1703123456789_abc123_image.jpg
│   └── 1703123456790_def456_screenshot.png
├── audio/
│   ├── 1703123456791_ghi789_audio.mp3
│   └── 1703123456792_jkl012_voice.mp3
├── video/
│   ├── 1703123456793_mno345_video.mp4
│   └── 1703123456794_pqr678_recording.mp4
└── document/
    ├── 1703123456795_stu901_document.pdf
    └── 1703123456796_vwx234_file.docx
```

## Regras de Segurança

### Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Mídias do chat - leitura pública, escrita autenticada
    match /chats/{mediaType}/{allPaths=**} {
      allow read: if true;  // Necessário para Z-API
      allow write: if request.auth != null;
    }
    
    // Outros arquivos - acesso negado
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Notificações e Badges

### Sistema de Notificações (`lib/notifications.ts`)

- **Som de notificação:** `/public/sounds/notification.mp3`
- **Fallback:** Beep de 800Hz via Web Audio API
- **Notificações do navegador:** Com permissão do usuário
- **Badges visuais:** Contadores de mensagens não lidas

### Funcionalidades

```typescript
// Reproduzir som
playNotificationSound()

// Exibir notificação do navegador
showBrowserNotification('Título', { body: 'Mensagem' })

// Atualizar badge
updateUnreadBadge(conversationId, unreadCount)

// Notificar nova mensagem
notifyNewMessage(conversationId, unreadCount, messagePreview)
```

## Exemplos de Uso

### 1. Upload de Imagem

```typescript
// Frontend
const formData = new FormData()
formData.append('file', imageFile)
formData.append('type', 'image')

const response = await fetch('/api/atendimento/upload', {
  method: 'POST',
  body: formData
})

const { fileUrl } = await response.json()

// Enviar via Z-API
await fetch('/api/atendimento/send-media', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '5511999999999',
    type: 'image',
    localPath: fileUrl,
    caption: 'Legenda da imagem'
  })
})
```

### 2. Upload de Áudio

```typescript
// Frontend - Gravação
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm;codecs=opus'
})

mediaRecorder.ondataavailable = async (event) => {
  const audioBlob = event.data
  const formData = new FormData()
  formData.append('file', audioBlob, 'audio.webm')
  formData.append('type', 'audio')
  
  const response = await fetch('/api/atendimento/upload', {
    method: 'POST',
    body: formData
  })
  
  const { fileUrl } = await response.json()
  // fileUrl será automaticamente convertida para MP3
}
```

### 3. Recebimento via Webhook

```typescript
// Webhook processa automaticamente:
// 1. Download da mídia da Z-API
// 2. Upload para Firebase Storage
// 3. Salvamento no histórico
// 4. Notificação de nova mensagem
```

## Configuração

### Variáveis de Ambiente

```env
# Firebase
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=grupo-thermas-a99fc.firebasestorage.app
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Z-API
ZAPI_INSTANCE=your-instance
ZAPI_TOKEN=your-token
```

### Dependências

```json
{
  "dependencies": {
    "firebase": "^11.1.0",
    "firebase-admin": "^13.0.1",
    "fluent-ffmpeg": "^2.1.3"
  },
  "devDependencies": {
    "@types/fluent-ffmpeg": "^2.1.27"
  }
}
```

## Troubleshooting

### Problemas Comuns

1. **Erro de conversão de áudio:**
   - Verificar se FFmpeg está instalado no servidor
   - Verificar permissões de escrita em `/tmp`

2. **URL não acessível:**
   - Verificar regras do Firebase Storage
   - Verificar se a URL é realmente pública

3. **Som de notificação não funciona:**
   - Verificar se o arquivo `/public/sounds/notification.mp3` existe
   - O sistema usa fallback automático

4. **Erro de upload:**
   - Verificar tamanho do arquivo (limite: 100MB)
   - Verificar tipo MIME suportado

### Logs

O sistema gera logs detalhados para debug:

```bash
# Upload
=== UPLOAD INICIADO ===
FileName: audio.webm
FileSize: 12345
FileType: audio/webm;codecs=opus

# Conversão
Convertendo áudio para MP3...
Conversão concluída: { originalSize: 12345, convertedSize: 9876 }

# Storage
=== UPLOAD CONCLUÍDO ===
FileName: 1703123456789_abc123_audio.mp3
FileUrl: https://firebasestorage.app/...
```

## Migração

### Script de Migração

Para migrar mídias existentes para o novo sistema:

```typescript
// scripts/migrate-media.ts
import { downloadAndSaveMedia } from '@/lib/mediaUpload'

async function migrateMedia() {
  // Buscar mensagens com URLs externas
  const messages = await adminDB.collection('conversations')
    .doc(phone)
    .collection('messages')
    .where('mediaUrl', '!=', null)
    .get()
  
  for (const message of messages.docs) {
    const data = message.data()
    if (data.mediaUrl && !isFirebaseStorageUrl(data.mediaUrl)) {
      // Migrar para Firebase Storage
      const result = await downloadAndSaveMedia(
        data.mediaUrl,
        data.mediaType,
        data.mediaInfo?.filename
      )
      
      if (result.success) {
        await message.ref.update({
          mediaUrl: result.fileUrl,
          'mediaInfo.url': result.fileUrl
        })
      }
    }
  }
}
```

## Performance

### Otimizações

1. **Conversão assíncrona:** Não bloqueia o upload
2. **Cache de URLs:** URLs públicas válidas por 1 ano
3. **Compressão:** Áudio convertido para 128kbps
4. **Lazy loading:** Mídias carregadas sob demanda

### Limites

- **Tamanho máximo:** 100MB por arquivo
- **Formatos suportados:** JPG, PNG, GIF, WebP, MP3, WAV, OGG, MP4, WebM, PDF
- **Taxa de upload:** Limitada pela largura de banda
- **Storage:** Limitado pelo plano do Firebase

## Segurança

### Validações

1. **Tipo MIME:** Verificação de extensão e conteúdo
2. **Tamanho:** Limite máximo por arquivo
3. **Origem:** Apenas URLs do Firebase Storage para envio
4. **Autenticação:** Upload apenas para usuários autenticados

### Boas Práticas

1. **Nunca expor URLs privadas**
2. **Usar HTTPS sempre**
3. **Validar entrada do usuário**
4. **Logs de auditoria**
5. **Backup regular**

## Monitoramento

### Métricas Importantes

- Taxa de sucesso de upload
- Tempo de conversão de áudio
- Uso de storage
- Erros de validação
- Performance de download

### Alertas

- Falha na conversão de áudio
- Erro de upload para storage
- URL não acessível
- Quota de storage excedida 