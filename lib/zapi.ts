import { adminDB } from './firebaseAdmin';

interface ZAPIConfig {
  zapiApiKey: string;
  zapiInstanceId: string;
  zapiClientToken?: string;
}

interface MediaInfo {
  type: string;
  url?: string;
  caption?: string;
  title?: string;
  filename?: string;
  mimeType?: string;
  displayName?: string;
}

interface MessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  localMessageObj?: any;
}

/**
 * Obtém as configurações da Z-API do Firebase
 */
export async function getZAPIConfig(): Promise<ZAPIConfig> {
  const configDoc = await adminDB.collection('admin_config').doc('ai_settings').get();
  
  if (!configDoc.exists) {
    console.error('Configurações Z-API não encontradas');
    throw new Error('Configurações Z-API não encontradas');
  }

  const config = configDoc.data() as any;

  if (!config.zapiApiKey || !config.zapiInstanceId) {
    console.error('Z-API não configurada corretamente', { 
      hasApiKey: !!config.zapiApiKey, 
      hasInstanceId: !!config.zapiInstanceId 
    });
    throw new Error('Z-API não configurada corretamente');
  }

  return {
    zapiApiKey: config.zapiApiKey,
    zapiInstanceId: config.zapiInstanceId,
    zapiClientToken: config.zapiClientToken
  };
}

/**
 * Envia uma mensagem de texto via Z-API
 */
export async function sendTextMessage(
  phone: string, 
  message: string, 
  agentName?: string
): Promise<MessageResponse> {
  try {
    const config = await getZAPIConfig();
    
    // Headers da requisição
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.zapiClientToken && config.zapiClientToken.trim()) {
      headers['Client-Token'] = config.zapiClientToken.trim();
    }

    // Incluir nome do atendente na mensagem para o cliente
    const messageWithAgent = agentName ? `*${agentName}:*\n${message}` : message;
    
    const zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-text`;
    
    console.log('Enviando texto para Z-API:', {
      url: zapiUrl,
      phone,
      message: messageWithAgent
    });

    const zapiResponse = await fetch(zapiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ phone, message: messageWithAgent })
    });

    const zapiResultText = await zapiResponse.text();
    let zapiResult: any = {};
    try { zapiResult = JSON.parse(zapiResultText); } catch { zapiResult = zapiResultText; }
    
    console.log('Resposta da Z-API (texto):', zapiResult);

    if (!zapiResponse.ok) {
      throw new Error(`Erro Z-API: ${zapiResultText}`);
    }
    
    // Criar objeto de mensagem local para atualização imediata da UI
    const localMessageObj = {
      id: `local_${Date.now()}`,
      content: message,
      timestamp: new Date().toISOString(),
      role: 'agent',
      status: 'sent',
      agentName: agentName || 'Atendente'
    };
    
    return { 
      success: true, 
      messageId: zapiResult.messageId,
      localMessageObj
    };
  } catch (error) {
    console.error('Erro ao enviar mensagem de texto:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Envia uma resposta a uma mensagem específica via Z-API
 */
export async function replyMessage(
  phone: string, 
  quotedMsgId: string, 
  message: string, 
  agentName?: string
): Promise<MessageResponse> {
  try {
    const config = await getZAPIConfig();
    
    // Headers da requisição
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.zapiClientToken && config.zapiClientToken.trim()) {
      headers['Client-Token'] = config.zapiClientToken.trim();
    }

    // Incluir nome do atendente na mensagem para o cliente
    const messageWithAgent = agentName ? `*${agentName}:*\n${message}` : message;
    
    const zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/message/reply-message`;
    
    console.log('Enviando reply para Z-API:', {
      url: zapiUrl,
      phone,
      quotedMsgId,
      message: messageWithAgent
    });

    const zapiResponse = await fetch(zapiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        chatId: phone, 
        quotedMsgId, 
        message: messageWithAgent 
      })
    });

    const zapiResultText = await zapiResponse.text();
    let zapiResult: any = {};
    try { zapiResult = JSON.parse(zapiResultText); } catch { zapiResult = zapiResultText; }
    
    console.log('Resposta da Z-API (reply):', zapiResult);

    if (!zapiResponse.ok) {
      throw new Error(`Erro Z-API: ${zapiResultText}`);
    }
    
    // Criar objeto de mensagem local para atualização imediata da UI
    const localMessageObj = {
      id: `local_${Date.now()}`,
      content: message,
      timestamp: new Date().toISOString(),
      role: 'agent',
      status: 'sent',
      agentName: agentName || 'Atendente',
      replyTo: quotedMsgId
    };
    
    return { 
      success: true, 
      messageId: zapiResult.messageId,
      localMessageObj
    };
  } catch (error) {
    console.error('Erro ao enviar resposta:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Envia uma imagem via Z-API
 */
export async function sendImage(
  phone: string, 
  base64: string, 
  caption?: string,
  replyTo?: string
): Promise<MessageResponse> {
  try {
    const config = await getZAPIConfig();
    
    // Headers da requisição
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.zapiClientToken && config.zapiClientToken.trim()) {
      headers['Client-Token'] = config.zapiClientToken.trim();
    }

    const zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-image`;
    
    const payload: any = { 
      phone, 
      image: base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`
    };
    
    if (caption) payload.caption = caption;
    if (replyTo) payload.messageId = replyTo;
    
    console.log('Enviando imagem para Z-API:', {
      url: zapiUrl,
      phone,
      hasImage: !!base64,
      caption,
      replyTo
    });

    const zapiResponse = await fetch(zapiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const zapiResultText = await zapiResponse.text();
    let zapiResult: any = {};
    try { zapiResult = JSON.parse(zapiResultText); } catch { zapiResult = zapiResultText; }
    
    console.log('Resposta da Z-API (imagem):', zapiResult);

    if (!zapiResponse.ok) {
      throw new Error(`Erro Z-API: ${zapiResultText}`);
    }
    
    // Criar objeto de mensagem local para atualização imediata da UI
    const localMessageObj = {
      id: `local_${Date.now()}`,
      content: caption || '',
      timestamp: new Date().toISOString(),
      role: 'agent',
      status: 'sent',
      mediaType: 'image',
      mediaUrl: base64,
      mediaInfo: {
        type: 'image',
        caption
      },
      replyTo
    };
    
    return { 
      success: true, 
      messageId: zapiResult.messageId,
      localMessageObj
    };
  } catch (error) {
    console.error('Erro ao enviar imagem:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Envia um áudio via Z-API
 */
export async function sendAudio(
  phone: string, 
  base64: string,
  replyTo?: string
): Promise<MessageResponse> {
  try {
    const config = await getZAPIConfig();
    
    // Headers da requisição
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.zapiClientToken && config.zapiClientToken.trim()) {
      headers['Client-Token'] = config.zapiClientToken.trim();
    }

    const zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-audio`;
    
    const payload: any = { 
      phone, 
      audio: base64.startsWith('data:') ? base64 : `data:audio/mpeg;base64,${base64}`
    };
    
    if (replyTo) payload.messageId = replyTo;
    
    console.log('Enviando áudio para Z-API:', {
      url: zapiUrl,
      phone,
      hasAudio: !!base64,
      replyTo
    });

    const zapiResponse = await fetch(zapiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const zapiResultText = await zapiResponse.text();
    let zapiResult: any = {};
    try { zapiResult = JSON.parse(zapiResultText); } catch { zapiResult = zapiResultText; }
    
    console.log('Resposta da Z-API (áudio):', zapiResult);

    if (!zapiResponse.ok) {
      throw new Error(`Erro Z-API: ${zapiResultText}`);
    }
    
    // Criar objeto de mensagem local para atualização imediata da UI
    const localMessageObj = {
      id: `local_${Date.now()}`,
      content: '',
      timestamp: new Date().toISOString(),
      role: 'agent',
      status: 'sent',
      mediaType: 'audio',
      mediaUrl: base64,
      mediaInfo: {
        type: 'audio'
      },
      replyTo
    };
    
    return { 
      success: true, 
      messageId: zapiResult.messageId,
      localMessageObj
    };
  } catch (error) {
    console.error('Erro ao enviar áudio:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Envia um documento via Z-API
 */
export async function sendDocument(
  phone: string, 
  base64: string, 
  fileName: string,
  mimeType: string = 'application/pdf',
  replyTo?: string
): Promise<MessageResponse> {
  try {
    const config = await getZAPIConfig();
    
    // Headers da requisição
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.zapiClientToken && config.zapiClientToken.trim()) {
      headers['Client-Token'] = config.zapiClientToken.trim();
    }

    const zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-document`;
    
    // Garantir que o base64 tenha o prefixo correto
    const documentBase64 = base64.startsWith('data:') 
      ? base64 
      : `data:${mimeType};base64,${base64}`;
    
    const payload: any = { 
      phone, 
      document: documentBase64,
      fileName,
      public_url: true // Importante: gera URL pública para o documento
    };
    
    if (replyTo) payload.messageId = replyTo;
    
    console.log('Enviando documento para Z-API:', {
      url: zapiUrl,
      phone,
      fileName,
      mimeType,
      hasDocument: !!base64,
      replyTo
    });

    const zapiResponse = await fetch(zapiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const zapiResultText = await zapiResponse.text();
    let zapiResult: any = {};
    try { zapiResult = JSON.parse(zapiResultText); } catch { zapiResult = zapiResultText; }
    
    console.log('Resposta da Z-API (documento):', zapiResult);

    if (!zapiResponse.ok) {
      throw new Error(`Erro Z-API: ${zapiResultText}`);
    }
    
    // Criar objeto de mensagem local para atualização imediata da UI
    const localMessageObj = {
      id: `local_${Date.now()}`,
      content: '',
      timestamp: new Date().toISOString(),
      role: 'agent',
      status: 'sent',
      mediaType: 'document',
      mediaUrl: zapiResult.url || base64,
      mediaInfo: {
        type: 'document',
        filename: fileName,
        mimeType,
        url: zapiResult.url
      },
      replyTo
    };
    
    return { 
      success: true, 
      messageId: zapiResult.messageId,
      localMessageObj
    };
  } catch (error) {
    console.error('Erro ao enviar documento:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Atualiza o status de uma mensagem no Firestore
 */
export async function updateMessageStatus(
  chatId: string, 
  messageId: string, 
  status: string
): Promise<boolean> {
  try {
    await adminDB
      .collection('conversations')
      .doc(chatId)
      .collection('messages')
      .doc(messageId)
      .update({ status });
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status da mensagem:', error);
    return false;
  }
} 