# 🎵 Guia de Conversão de Áudio com FFmpeg.wasm

## 📋 Visão Geral

Este guia descreve a implementação da conversão real de áudio usando FFmpeg.wasm no frontend para garantir compatibilidade com a Z-API.

## ❌ Problema Original

- Áudio capturado pelo navegador: `audio/webm;codecs=opus`
- Upload salvava com extensão `.mp3` mas conteúdo ainda era WebM
- Z-API rejeitava: `"Formato de áudio não suportado: mp3?... Use apenas MP3, OGG ou Opus"`

## ✅ Solução Implementada

### 1. **FFmpeg.wasm no Frontend**

**Dependências instaladas:**
```bash
npm install @ffmpeg/ffmpeg @ffmpeg/util
```

**Arquivos FFmpeg baixados:**
- `public/ffmpeg/ffmpeg-core.js`
- `public/ffmpeg/ffmpeg-core.wasm`

### 2. **Utilitário de Conversão** (`lib/audioConverter.ts`)

```typescript
// Conversão WebM → MP3
export async function convertWebmToMp3(webmBlob: Blob): Promise<Blob>

// Conversão WebM → OGG
export async function convertWebmToOgg(webmBlob: Blob): Promise<Blob>

// Conversão múltipla (MP3 + OGG)
export async function convertAudioToMultipleFormats(webmBlob: Blob)

// Validação de suporte
export function isFFmpegSupported(): boolean

// Validação de blob
export function validateAudioBlob(blob: Blob, expectedType: string): boolean
```

### 3. **Configurações Otimizadas**

**MP3 (WhatsApp):**
- Codec: `libmp3lame`
- Bitrate: `128k`
- Sample Rate: `22050Hz`
- Canais: `1` (Mono)

**OGG/Opus (Alternativa):**
- Codec: `libopus`
- Bitrate: `64k`
- Sample Rate: `24000Hz`
- Canais: `1` (Mono)

### 4. **Fluxo de Conversão**

```typescript
// 1. Verificar suporte ao FFmpeg
if (!isFFmpegSupported()) {
  // Fallback para conversão básica
}

// 2. Converter para múltiplos formatos
const convertedFormats = await convertAudioToMultipleFormats(audioBlob)
const mp3Blob = convertedFormats.mp3Blob
const oggBlob = convertedFormats.oggBlob

// 3. Validar blobs convertidos
if (mp3Blob && !validateAudioBlob(mp3Blob, 'audio/mpeg')) {
  mp3Blob = null
}

// 4. Upload para Firebase Storage
const formData = new FormData()
formData.append('file', mp3Blob, `audio_${Date.now()}.mp3`)
formData.append('type', 'audio')

// 5. Enviar via Z-API
const payload = {
  phone: phone,
  type: 'audio',
  localPath: mp3Url, // URL pública do Firebase
  mp3Url: mp3Url,
  oggUrl: oggUrl
}
```

## 🔧 Configuração do Next.js

**`next.config.js`:**
```javascript
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
      }
      config.output.crossOriginLoading = 'anonymous'
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/ffmpeg/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ]
  },
}
```

## 🧪 Scripts de Teste

### 1. **Teste de Conversão** (`scripts/test-audio-conversion.js`)

```bash
# Executar teste completo
node scripts/test-audio-conversion.js
```

**Testa:**
- Validação de arquivo de entrada
- Conversão no frontend
- Upload para Firebase
- URL pública
- Envio via Z-API

### 2. **Endpoint de Teste** (`/api/test-audio-conversion`)

```bash
# Testar conversão
curl -X POST http://localhost:3000/api/test-audio-conversion \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## 📊 Logs e Debugging

### Logs Implementados:

```typescript
// Conversão
console.log('🔄 Iniciando conversão WebM → MP3...')
console.log('✅ Conversão concluída:', {
  tamanhoOriginal: webmBlob.size,
  tamanhoConvertido: mp3Blob.size,
  tipoOriginal: webmBlob.type,
  tipoConvertido: mp3Blob.type
})

// Upload
console.log('📤 Fazendo upload MP3...')
console.log('✅ Upload MP3 concluído:', mp3Url)

// Envio
console.log('📤 Enviando áudio via Z-API...')
console.log('✅ Áudio enviado com sucesso!', mediaResult)
```

### Validação de Content-Type:

```typescript
// Verificar se a URL está realmente acessível
const testResponse = await fetch(audioUrl, { method: 'HEAD' });
const contentType = testResponse.headers.get('content-type')

// Validar content-type
const validContentTypes = [
  'audio/mpeg', 'audio/mp3', 'audio/mpeg3', 'audio/x-mpeg-3',
  'audio/ogg', 'audio/opus', 'audio/ogg; codecs=opus'
]
```

## 🚀 Como Usar

### 1. **Gravação de Áudio**

```typescript
// No componente de gravação
const mediaRecorder = new MediaRecorder(stream, { 
  mimeType: 'audio/webm;codecs=opus' 
})

mediaRecorder.onstop = async () => {
  const audioBlob = new Blob(chunks, { type: 'audio/webm;codecs=opus' })
  await sendAudioDirectly(audioBlob, 'audio/webm;codecs=opus')
}
```

### 2. **Conversão Automática**

```typescript
// A conversão acontece automaticamente em sendAudioDirectly
const convertedFormats = await convertAudioToMultipleFormats(audioBlob)
// Retorna: { mp3Blob: Blob | null, oggBlob: Blob | null }
```

### 3. **Upload e Envio**

```typescript
// Upload para Firebase Storage
const formData = new FormData()
formData.append('file', mp3Blob, `audio_${Date.now()}.mp3`)
formData.append('type', 'audio')

// Envio via Z-API
const payload = {
  phone: phone,
  type: 'audio',
  localPath: mp3Url // URL pública do Firebase
}
```

## 🔍 Troubleshooting

### Problemas Comuns:

1. **FFmpeg não carrega:**
   ```bash
   # Verificar se os arquivos existem
   ls public/ffmpeg/
   # Deve mostrar: ffmpeg-core.js, ffmpeg-core.wasm
   ```

2. **Erro de CORS:**
   ```javascript
   // Verificar headers no next.config.js
   'Cross-Origin-Embedder-Policy': 'require-corp'
   'Cross-Origin-Opener-Policy': 'same-origin'
   ```

3. **Conversão falha:**
   ```typescript
   // Verificar logs no console
   console.log('❌ Erro na conversão FFmpeg:', ffmpegError)
   // Fallback para conversão básica
   ```

4. **Z-API rejeita:**
   ```bash
   # Verificar content-type do arquivo
   curl -I "URL_DO_ARQUIVO"
   # Deve retornar: audio/mpeg ou audio/ogg
   ```

### Validação Manual:

```bash
# 1. Testar conversão
node scripts/test-audio-conversion.js

# 2. Verificar arquivo convertido
file audio.mp3
# Deve mostrar: audio.mp3: Audio file with ID3 version 2.3.0

# 3. Testar URL pública
curl -I "https://firebasestorage.googleapis.com/..."
# Deve retornar 200 OK e content-type correto
```

## 📈 Métricas de Sucesso

### Indicadores:

- ✅ **Conversão:** WebM → MP3/OGG real
- ✅ **Content-Type:** `audio/mpeg` ou `audio/ogg`
- ✅ **Upload:** Firebase Storage com URL pública
- ✅ **Z-API:** Aceita e envia o áudio
- ✅ **WhatsApp:** Reproduz o áudio corretamente

### Logs Esperados:

```
🔄 Iniciando conversão WebM → MP3...
✅ Conversão concluída: { tamanhoOriginal: 12345, tamanhoConvertido: 6789 }
📤 Fazendo upload MP3...
✅ Upload MP3 concluído: https://firebasestorage.googleapis.com/...
📤 Enviando áudio via Z-API...
✅ Áudio enviado com sucesso! { messageId: "abc123" }
```

## 🎯 Resultado Final

- **Antes:** Arquivo com extensão `.mp3` mas conteúdo WebM
- **Depois:** Arquivo real MP3/OGG com content-type correto
- **Z-API:** Aceita e envia o áudio sem erros
- **WhatsApp:** Reproduz o áudio normalmente

---

**Status:** ✅ **IMPLEMENTADO E TESTADO**
**Versão:** 2.0.0
**Última atualização:** Dezembro 2024 