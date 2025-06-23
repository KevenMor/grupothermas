# 🔗 Configuração Webhook GPT Maker

## Como configurar o webhook no GPT Maker (conforme imagem):

### 1. Acesse as Preferências da Conversa
- Vá para **Preferências da conversa** no GPT Maker
- Clique na aba **Webhooks**

### 2. Configure o Evento
- **Tipo do evento**: `Nova mensagem` (ou outros eventos desejados)
- **Ação**: `Enviar Webhook`
- **URL**: Sua URL do sistema + `/api/gptmaker/webhook`

### 3. URLs de Exemplo

#### Desenvolvimento Local:
```
http://localhost:3000/api/gptmaker/webhook
```

#### Produção (Vercel):
```
https://seu-dominio.vercel.app/api/gptmaker/webhook
```

#### Produção (Domínio Customizado):
```
https://sistema.grupothermas.com.br/api/gptmaker/webhook
```

### 4. Eventos Suportados

O webhook está configurado para receber:

- ✅ `message.created` - Nova mensagem recebida
- ✅ `chat.updated` - Chat atualizado
- ✅ `chat.assigned` - Chat atribuído a agente
- ✅ `chat.escalated` - Chat escalado para humano

### 5. Segurança (Opcional)

Para maior segurança, configure:

```env
GPTMAKER_WEBHOOK_SECRET=sua_chave_secreta_aqui
```

O webhook verificará a assinatura HMAC SHA-256.

### 6. Teste do Webhook

Para testar se o webhook está funcionando:

1. Configure a URL no GPT Maker
2. Envie uma mensagem de teste
3. Verifique os logs do servidor:
   ```
   ✓ GPT Maker webhook event: message.created
   ✓ Message synced to Firestore: msg_123
   ```

### 7. Troubleshooting

#### Webhook não está sendo chamado:
- ✅ Verifique se a URL está acessível publicamente
- ✅ Confirme que retorna status 200
- ✅ Teste com ferramentas como ngrok para localhost

#### Mensagens não aparecem no Kanban:
- ✅ Verifique se o Firebase está conectado
- ✅ Confirme as regras do Firestore
- ✅ Verifique os logs do console

### 8. Exemplo de Payload

O webhook recebe dados no formato:

```json
{
  "type": "message.created",
  "data": {
    "message": {
      "id": "msg_123",
      "content": "Olá! Como posso ajudar?",
      "type": "text",
      "timestamp": "2024-01-20T10:30:00Z",
      "sender": {
        "type": "customer",
        "name": "João Silva"
      }
    },
    "chat": {
      "id": "chat_456",
      "customer": {
        "name": "João Silva",
        "phone": "+55 11 99999-9999"
      }
    }
  }
}
```

---

## ✅ Pronto!

Após configurar o webhook, todas as mensagens do GPT Maker aparecerão automaticamente no Kanban em tempo real! 