# Melhorias no Módulo de Chat Z-API

## Correções Implementadas

### 1. Suporte a Emojis
- Adicionado Twemoji para renderização correta de emojis
- Configurado fallback de fontes no Tailwind (Segoe UI Emoji, Apple Color Emoji)
- Uso de `dangerouslySetInnerHTML` com `twemoji.parse()` para conversão

### 2. Áudio
- Implementado autoplay de áudio quando enviado pelo atendente
- Adicionado `ref` para controle do elemento de áudio
- Atualização imediata da UI com objeto de mensagem local

### 3. Respostas (Reply)
- Implementada função `replyMessage()` usando endpoint `/message/reply-message` da Z-API
- Adicionados campos `replyTo` e `replyToContent` no modelo de mensagem
- Exibição visual da mensagem citada com estilo diferenciado

### 4. Documentos PDF
- Corrigido envio de documentos com `public_url: true` para gerar link público
- Exibição melhorada com nome do arquivo e ícone
- Suporte a diferentes tipos MIME baseados na extensão

### 5. Imagens no Painel
- Implementado preview de imagem com popup ao clicar
- Adição de objeto de mensagem local após envio para atualização imediata da UI

## Permissões Necessárias

Para o funcionamento correto do módulo de chat:

1. **Câmera e Microfone**: Permita o acesso quando solicitado pelo navegador para envio de mídia
2. **Notificações**: Habilite para receber alertas de novas mensagens
3. **Autoplay**: Alguns navegadores podem bloquear a reprodução automática de áudio 