# Fluxo Obrigatório de Mídias - Sistema Grupo Thermas

## Visão Geral

Este documento descreve o fluxo obrigatório implementado para envio e registro de imagens e áudios no chat, garantindo que todas as mídias sejam sempre salvas no Firebase Storage e exibidas consistentemente no painel.

## Fluxo Implementado

### 1. Upload Sempre no Firebase Storage

- **Toda imagem ou áudio** enviado (pelo atendente OU recebido via WhatsApp) é salvo no Firebase Storage
- O upload gera um **link público** válido por 1 ano
- **Localização**: `app/api/atendimento/upload/route.ts`

### 2. Envio para o WhatsApp

- Sempre que for encaminhar uma imagem/áudio para o cliente, usa o **link público gerado pelo Storage** como URL da mídia
- Para áudios: converte e salva preferencialmente em MP3 para máxima compatibilidade
- **Localização**: `app/api/atendimento/send-media/route.ts`

### 3. Histórico no Painel

- Exibe a imagem/áudio no painel usando o link público salvo no Storage
- Todos os arquivos ficam disponíveis para consulta no histórico da conversa
- Nunca depende do link temporário da Z-API ou armazenamento local
- **Localização**: `app/atendimento/_components/ChatMessageItem.tsx`

### 4. Sincronização Reversa

- Quando o cliente enviar imagem ou áudio pelo WhatsApp:
  - Baixa do WhatsApp/Z-API automaticamente
  - Salva também no Firebase Storage
  - Exibe no painel sempre pelo link do Storage
- **Localização**: `app/api/zapi/webhook/route.ts` e `app/api/zapi/ai-webhook/route.ts`

## Componentes Principais

### 1. Utilitário de Storage (`lib/mediaStorage.ts`)

```typescript
// Download e salvamento automático de mídias
export async function downloadAndSaveMedia(
  sourceUrl: string,
  mediaType: 'image' | 'audio' | 'video' | 'document',
  originalFileName?: string
): Promise<MediaStorageResult>

// Verificar se URL é do Firebase Storage
export function isFirebaseStorageUrl(url: string): boolean
```

### 2. Endpoint de Upload (`app/api/atendimento/upload/route.ts`)

- Valida tipos de arquivo permitidos
- Gera nomes únicos para arquivos
- Salva no Firebase Storage com metadados
- Retorna URL pública válida por 1 ano

### 3. Endpoint de Envio (`app/api/atendimento/send-media/route.ts`)

- Valida que a URL é do Firebase Storage
- Testa acessibilidade da URL
- Envia via Z-API usando link público
- Salva no histórico do Firestore

### 4. Webhooks (`app/api/zapi/webhook/route.ts`)

- Processa mensagens recebidas do WhatsApp
- Download automático de mídias para Firebase Storage
- Atualiza URLs no Firestore para links do Storage

## Migração de Mídias Antigas

### Endpoint de Migração (`app/api/media/history/route.ts`)

```bash
# Buscar histórico de mídias de uma conversa
GET /api/media/history?phone=5515998765432&limit=50

# Migrar mídia específica
POST /api/media/history
{
  "phone": "5515998765432",
  "mediaUrl": "https://z-api.com/temp/media.jpg",
  "mediaType": "image",
  "filename": "imagem.jpg"
}
```

### Script de Migração (`scripts/migrate-media.js`)

```bash
# Executar migração completa
node scripts/migrate-media.js
```

## Formatos Suportados

### Imagens
- JPEG, PNG, GIF, WebP
- Content-Type: `image/jpeg`, `image/png`, etc.

### Áudios
- MP3, WAV, OGG/Opus
- Conversão automática para MP3 quando necessário
- Content-Type: `audio/mpeg`, `audio/wav`, `audio/ogg`

### Vídeos
- MP4, WebM
- Content-Type: `video/mp4`, `video/webm`

### Documentos
- PDF, DOC, DOCX
- Content-Type: `application/pdf`, etc.

## Estrutura no Firebase Storage

```
grupo-thermas-a99fc.firebasestorage.app/
├── image/
│   ├── 1703123456789_abc123.jpg
│   └── 1703123456790_def456.png
├── audio/
│   ├── 1703123456791_ghi789.mp3
│   └── 1703123456792_jkl012.ogg
├── video/
│   └── 1703123456793_mno345.mp4
└── document/
    └── 1703123456794_pqr678.pdf
```

## Metadados Salvos

Cada arquivo no Storage inclui metadados:

```json
{
  "originalUrl": "https://z-api.com/temp/media.jpg",
  "originalFileName": "imagem.jpg",
  "mediaType": "image",
  "uploadedAt": "2024-01-15T10:30:00.000Z",
  "fileSize": 1024000
}
```

## URLs Públicas

- **Validade**: 1 ano (365 dias)
- **Formato**: Signed URLs do Firebase Storage
- **Exemplo**: `https://firebasestorage.googleapis.com/v0/b/grupo-thermas-a99fc.appspot.com/o/image%2F1703123456789_abc123.jpg?alt=media&token=...`

## Logs e Monitoramento

### Logs Implementados

```typescript
// Upload
console.log('=== UPLOAD INICIADO ===')
console.log('=== UPLOAD CONCLUÍDO ===')

// Download e salvamento
console.log('=== DOWNLOAD E SALVAMENTO DE MÍDIA ===')

// Envio via Z-API
console.log('=== ENVIANDO IMAGEM ===')
console.log('=== ENVIANDO ÁUDIO ===')
console.log('=== ENVIANDO VÍDEO ===')
console.log('=== ENVIANDO DOCUMENTO ===')
```

### Tratamento de Erros

- Validação de URLs antes do envio
- Fallback para URLs originais em caso de erro
- Logs detalhados para troubleshooting
- Mensagens de erro amigáveis no frontend

## Benefícios do Fluxo

1. **Histórico Completo**: Todas as mídias ficam salvas permanentemente
2. **Consistência**: Mesma URL para exibição e envio
3. **Performance**: Links públicos otimizados
4. **Segurança**: Controle total sobre os arquivos
5. **Escalabilidade**: Storage gerenciado pelo Firebase
6. **Compatibilidade**: Suporte a múltiplos formatos

## Troubleshooting

### Problemas Comuns

1. **URL não acessível**
   - Verificar se a URL é pública
   - Testar com HEAD request
   - Verificar CORS se necessário

2. **Formato não suportado**
   - Verificar lista de formatos permitidos
   - Converter para formato compatível
   - Verificar Content-Type

3. **Erro no upload**
   - Verificar permissões do Firebase Storage
   - Verificar tamanho do arquivo
   - Verificar conexão com internet

### Comandos Úteis

```bash
# Verificar logs do servidor
npm run dev

# Executar migração de mídias
node scripts/migrate-media.js

# Testar endpoint de upload
curl -X POST -F "file=@test.jpg" -F "type=image" http://localhost:3000/api/atendimento/upload

# Verificar histórico de mídias
curl "http://localhost:3000/api/media/history?phone=5515998765432"
```

## Próximos Passos

1. **Monitoramento**: Implementar métricas de uso do Storage
2. **Limpeza**: Script para remover arquivos antigos
3. **Compressão**: Otimização automática de imagens
4. **CDN**: Configurar CDN para melhor performance
5. **Backup**: Estratégia de backup dos arquivos

---

**Desenvolvido para Grupo Thermas**  
**Versão**: 1.0  
**Data**: Janeiro 2024 