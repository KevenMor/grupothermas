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
  replyTo?: { id: string, text: string, author: 'agent' | 'customer' },
  contentType?: string,
  caption?: string
): Promise<MessageResponse> {
  try {
    console.log('=== SEND AUDIO FUNCTION START ===');
    console.log('Phone:', phone);
    console.log('Audio URL (full):', base64OrUrl);
    console.log('Audio URL length:', base64OrUrl.length);
    console.log('ReplyTo:', replyTo);
    console.log('ContentType:', contentType);
    console.log('Caption:', caption);
    
    const config = await getZAPIConfig();
    console.log('=== Z-API CONFIG ===');
    console.log('Instance ID:', config.zapiInstanceId);
    console.log('API Key (first 10 chars):', config.zapiApiKey.substring(0, 10) + '...');
    console.log('Client Token exists:', !!config.zapiClientToken);
    
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json'
    };
    if (config.zapiClientToken && config.zapiClientToken.trim()) {
      headers['Client-Token'] = config.zapiClientToken.trim();
    }
    
    console.log('=== HEADERS ===');
    console.log('Headers:', JSON.stringify(headers, null, 2));
    
    const zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-audio`;
    console.log('=== Z-API URL ===');
    console.log('Z-API URL:', zapiUrl);
    
    const match = base64OrUrl.match(/\.([a-zA-Z0-9]+)(?=\?|$)/)
    const urlExtension = match ? match[1].toLowerCase() : ''
    const supportedFormats = ['mp3', 'ogg', 'opus']
    
    console.log('=== URL VALIDATION ===');
    console.log('Regex match:', match);
    console.log('URL Extension:', urlExtension);
    console.log('Supported formats:', supportedFormats);
    console.log('Extension supported:', supportedFormats.includes(urlExtension));
    
    // Validate URL format
    console.log('=== URL FORMAT VALIDATION ===');
    try {
      const urlObj = new URL(base64OrUrl);
      console.log('URL is valid:', urlObj.href);
      console.log('URL protocol:', urlObj.protocol);
      console.log('URL hostname:', urlObj.hostname);
      console.log('URL pathname:', urlObj.pathname);
      console.log('URL search params count:', urlObj.searchParams.size);
      
      // Check if URL is too long (Z-API might have limits)
      if (base64OrUrl.length > 2000) {
        console.warn('URL is very long:', base64OrUrl.length, 'characters');
        console.warn('This might cause issues with Z-API');
      }
      
      // Check for problematic characters in the URL
      const problematicChars = ['%', '&', '=', '?', '#', '+'];
      const hasProblematicChars = problematicChars.some(char => base64OrUrl.includes(char));
      console.log('URL has problematic characters:', hasProblematicChars);
      
    } catch (urlError) {
      console.error('Invalid URL format:', urlError);
      throw new Error('URL format is invalid');
    }
    
    if (!urlExtension || !supportedFormats.includes(urlExtension)) {
      console.error('=== VALIDATION FAILED ===');
      console.error('URL:', base64OrUrl);
      console.error('Extension:', urlExtension);
      throw new Error(`Formato de áudio não suportado: ${urlExtension}. Use apenas MP3, OGG ou Opus.`)
    }
    
    // Payload limpo
    const payload: any = { 
      phone: phone,
      audio: base64OrUrl
    };
    if (caption !== undefined) payload.caption = caption;
    
    // Nunca envie campos undefined
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) delete payload[key];
    });
    
    console.log('=== PAYLOAD BEFORE CLEANUP ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    console.log('=== FINAL PAYLOAD ===');
    console.log('Payload keys:', Object.keys(payload));
    console.log('Payload phone:', payload.phone);
    console.log('Payload audio URL length:', payload.audio ? payload.audio.length : 'undefined');
    console.log('Payload audio URL (first 100 chars):', payload.audio ? payload.audio.substring(0, 100) + '...' : 'undefined');
    console.log('Payload caption:', payload.caption);
    
    // Test if the audio URL is actually accessible
    console.log('=== TESTING AUDIO URL ACCESSIBILITY ===');
    try {
      const testResponse = await fetch(base64OrUrl, { method: 'HEAD' });
      console.log('Test response status:', testResponse.status);
      console.log('Test response headers:', Object.fromEntries(testResponse.headers.entries()));
      
      if (!testResponse.ok) {
        console.error('Audio URL is not accessible!');
        throw new Error(`Audio URL not accessible: ${testResponse.status}`);
      }
      
      const actualContentType = testResponse.headers.get('content-type');
      console.log('Actual content-type from URL:', actualContentType);
      
      // Also try to get the first few bytes to verify it's actually an audio file
      const audioTestResponse = await fetch(base64OrUrl, { 
        method: 'GET',
        headers: { 'Range': 'bytes=0-1023' } // Get first 1KB
      });
      
      if (audioTestResponse.ok) {
        const audioBuffer = await audioTestResponse.arrayBuffer();
        console.log('Audio file first 1KB size:', audioBuffer.byteLength);
        console.log('Audio file accessible and downloadable');
      } else {
        console.warn('Could not download audio file for testing');
      }
      
    } catch (testError) {
      console.error('Error testing audio URL:', testError);
      // Don't fail here, just log the warning
    }
    
    console.log('=== MAKING Z-API REQUEST ===');
    console.log('Method: POST');
    console.log('URL:', zapiUrl);
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('Body length:', JSON.stringify(payload).length);
    
    const zapiResponse = await fetch(zapiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    console.log('=== Z-API RESPONSE RECEIVED ===');
    console.log('Status:', zapiResponse.status);
    console.log('Status Text:', zapiResponse.statusText);
    console.log('Response Headers:', Object.fromEntries(zapiResponse.headers.entries()));
    
    const zapiResultText = await zapiResponse.text();
    console.log('=== Z-API RESPONSE BODY ===');
    console.log('Response body length:', zapiResultText.length);
    console.log('Response body:', zapiResultText);
    
    let zapiResult: any = {};
    try { 
      zapiResult = JSON.parse(zapiResultText); 
      console.log('=== PARSED JSON RESULT ===');
      console.log('Parsed result:', JSON.stringify(zapiResult, null, 2));
    } catch (parseError) { 
      console.log('=== PARSE ERROR ===');
      console.log('Parse error:', parseError);
      zapiResult = { raw: zapiResultText };
    }
    
    if (!zapiResponse.ok) {
      console.error('=== Z-API ERROR DETAILED ===');
      console.error('Status:', zapiResponse.status);
      console.error('Status Text:', zapiResponse.statusText);
      console.error('Response:', zapiResult);
      console.error('URL:', zapiUrl);
      console.error('Payload sent:', JSON.stringify(payload, null, 2));
      console.error('Audio format:', urlExtension);
      console.error('Content type:', contentType);
      console.error('Timestamp:', new Date().toISOString());
      throw new Error(`Erro Z-API (${zapiResponse.status}): ${zapiResultText}`);
    }
    
    console.log('=== SUCCESS ===');
    console.log('Message ID:', zapiResult.messageId || zapiResult.id);
    
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
        url: base64OrUrl,
        format: urlExtension,
        contentType
      },
      replyTo
    };
    
    console.log('=== RETURNING SUCCESS ===');
    return { 
      success: true, 
      messageId: zapiResult.messageId || zapiResult.id,
      localMessageObj
    };
  } catch (error) {
    console.error('=== SEND AUDIO ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
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
 * Envia um vídeo via Z-API
 */
export async function sendVideo(
  phone: string,
  videoUrl: string,
  fileName?: string,
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
    const zapiUrl = `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiApiKey}/send-video`;
    let payload: any = { phone };
    payload.video = videoUrl;
    if (caption) payload.caption = caption;
    if (fileName) payload.fileName = fileName;
    if (replyTo?.id) payload.messageId = replyTo.id;
    console.log('Enviando vídeo para Z-API:', {
      url: zapiUrl,
      phone,
      payload,
      caption,
      fileName,
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
    console.log('Resposta da Z-API (vídeo):', zapiResult);
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
      mediaType: 'video',
      mediaUrl: videoUrl,
      mediaInfo: {
        type: 'video',
        caption,
        fileName
      },
      replyTo
    };
    return {
      success: true,
      messageId: zapiResult.messageId,
      localMessageObj
    };
  } catch (error) {
    console.error('Erro ao enviar vídeo:', error);
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