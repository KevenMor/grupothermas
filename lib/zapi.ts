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
  url?: string;
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
    
    // Usar o endpoint correto da Z-API para reply
    const zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-text`;
    
    console.log('Enviando reply para Z-API:', {
      url: zapiUrl,
      phone,
      quotedMsgId,
      message: messageWithAgent
    });

    // Payload conforme documentação oficial
    const payload = {
      phone,
      message: messageWithAgent, // Texto da resposta
      messageId: quotedMsgId     // ID da mensagem a ser respondida
    };

    const zapiResponse = await fetch(zapiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
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
  base64OrUrl: string, 
  caption?: string,
  replyTo?: { id: string, text: string, author: 'agent' | 'customer' }
): Promise<MessageResponse> {
  try {
    const config = await getZAPIConfig();
    // Headers da requisição
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.zapiClientToken && config.zapiClientToken.trim()) {
      headers['Client-Token'] = config.zapiClientToken.trim();
    }
    const zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-image`;
    let payload: any = { phone };
    // Sempre envie o campo 'image' para a Z-API, seja base64 ou link público
    payload.image = base64OrUrl;
    if (caption) payload.caption = caption;
    if (replyTo?.id) payload.messageId = replyTo.id;
    console.log('Enviando imagem para Z-API:', {
      url: zapiUrl,
      phone,
      payload, // log detalhado do payload
      caption,
      replyTo: replyTo?.id
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
      mediaUrl: base64OrUrl,
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
  base64OrUrl: string,
  replyTo?: { id: string, text: string, author: 'agent' | 'customer' }
): Promise<MessageResponse> {
  try {
    const config = await getZAPIConfig();
    
    // Headers conforme documentação Z-API
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json'
    };
    if (config.zapiClientToken && config.zapiClientToken.trim()) {
      headers['Client-Token'] = config.zapiClientToken.trim();
    }

    const zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-audio`;
    
    // Payload conforme documentação Z-API
    const payload: any = { 
      phone: phone,
      audio: base64OrUrl,
      viewOnce: false,
      waveform: true
    };
    
    // Adicionar reply se especificado
    if (replyTo?.id) {
      payload.messageId = replyTo.id;
    }
    
    console.log('=== ENVIANDO ÁUDIO VIA Z-API ===');
    console.log('URL:', zapiUrl);
    console.log('Phone:', phone);
    console.log('Audio URL:', base64OrUrl);
    console.log('Headers:', headers);
    console.log('Payload completo:', JSON.stringify(payload, null, 2));

    const zapiResponse = await fetch(zapiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const zapiResultText = await zapiResponse.text();
    let zapiResult: any = {};
    
    try { 
      zapiResult = JSON.parse(zapiResultText); 
    } catch (parseError) { 
      console.error('Erro ao fazer parse da resposta Z-API:', parseError);
      zapiResult = { raw: zapiResultText };
    }
    
    console.log('=== RESPOSTA Z-API ÁUDIO ===');
    console.log('Status:', zapiResponse.status);
    console.log('Status Text:', zapiResponse.statusText);
    console.log('Response:', zapiResult);

    if (!zapiResponse.ok) {
      throw new Error(`Erro Z-API (${zapiResponse.status}): ${zapiResultText}`);
    }
    
    // Criar objeto de mensagem local para atualização imediata da UI
    const localMessageObj = {
      id: `local_${Date.now()}`,
              content: '🎵 Áudio',
      timestamp: new Date().toISOString(),
      role: 'agent',
      status: 'sent',
      mediaType: 'audio',
      mediaUrl: base64OrUrl,
      mediaInfo: {
        type: 'audio',
        url: base64OrUrl
      },
      replyTo
    };
    
    return { 
      success: true, 
      messageId: zapiResult.messageId || zapiResult.id,
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
 * Envia um documento via Z-API usando URL pública
 */
export async function sendDocument(
  phone: string, 
  fileUrl: string, 
  fileName: string,
  mimeType: string = 'application/pdf',
  replyTo?: { id: string, text: string, author: 'agent' | 'customer' }
): Promise<MessageResponse> {
  try {
    const config = await getZAPIConfig();
    // Descobrir a extensão do arquivo
    const extension = fileName.split('.').pop()?.toLowerCase() || 'pdf';
    const zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-document/${extension}`;
    // Payload correto para Z-API usando URL pública
    const payload: any = { 
      phone, 
      document: fileUrl, // URL pública do documento
      fileName
    };
    if (replyTo?.id) {
      payload.messageId = replyTo.id;
    }
    console.log('Enviando documento para Z-API:', {
      url: zapiUrl,
      phone,
      fileName,
      fileUrl,
      mimeType,
      replyTo: replyTo?.id,
      payloadKeys: Object.keys(payload)
    });
    // LOG: Mostra o Client-Token lido do Firestore
    console.log('Client-Token usado:', config.zapiClientToken)
    // Monta os headers
    const headers: any = { 'Content-Type': 'application/json' }
    if (config.zapiClientToken && config.zapiClientToken !== 'null') {
      headers['Client-Token'] = config.zapiClientToken
    }
    // LOG: Mostra os headers enviados
    console.log('Headers enviados para Z-API:', headers)
    const zapiResponse = await fetch(zapiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const zapiResultText = await zapiResponse.text();
    let zapiResult: any = {};
    try { 
      zapiResult = JSON.parse(zapiResultText); 
    } catch (parseError) { 
      console.error('Erro ao fazer parse da resposta da Z-API:', parseError);
      zapiResult = { raw: zapiResultText };
    }
    console.log('Resposta da Z-API (documento):', {
      status: zapiResponse.status,
      statusText: zapiResponse.statusText,
      result: zapiResult
    });
    if (!zapiResponse.ok) {
      throw new Error(`Erro Z-API (${zapiResponse.status}): ${zapiResultText}`);
    }
    if (!zapiResult.messageId) {
      console.warn('Z-API não retornou messageId:', zapiResult);
    }
    const documentUrl = zapiResult.url || zapiResult.documentUrl || zapiResult.publicUrl || fileUrl;
    if (!documentUrl) {
      console.warn('Z-API não retornou URL pública para o documento:', zapiResult);
    }
    const localMessageObj = {
      id: `local_${Date.now()}`,
      content: '',
      timestamp: new Date().toISOString(),
      role: 'agent',
      status: 'sent',
      mediaType: 'document',
      mediaUrl: documentUrl,
      mediaInfo: {
        type: 'document',
        filename: fileName,
        mimeType,
        url: documentUrl
      },
      replyTo
    };
    return { 
      success: true, 
      messageId: zapiResult.messageId,
      url: documentUrl,
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

// O Client-Token da Z-API é buscado do Firestore (admin_config/ai_settings) e enviado automaticamente nos headers das requisições.
// Se precisar atualizar, basta salvar o novo token no painel admin IA. 