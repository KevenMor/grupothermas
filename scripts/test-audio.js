#!/usr/bin/env node

/**
 * Script de teste para verificar o sistema de áudio
 * 
 * Este script testa:
 * 1. Upload de áudio para Firebase Storage
 * 2. Conversão de formatos
 * 3. Envio via Z-API
 * 4. Validação de URLs públicas
 */

const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')

// Configurações
const TEST_PHONE = '5511999999999' // Substitua pelo número de teste
const API_BASE = 'http://localhost:3000' // Ajuste conforme necessário

// Função para criar um arquivo de áudio de teste
function createTestAudioFile() {
  console.log('📝 Criando arquivo de áudio de teste...')
  
  // Criar um arquivo de áudio simples (1 segundo de silêncio em MP3)
  // Este é um exemplo básico - em produção você pode usar uma biblioteca como 'audio-generator'
  const testAudioPath = path.join(__dirname, 'test-audio.mp3')
  
  // Se o arquivo não existir, criar um arquivo de teste simples
  if (!fs.existsSync(testAudioPath)) {
    console.log('⚠️  Arquivo de teste não encontrado. Crie um arquivo MP3 de teste em scripts/test-audio.mp3')
    console.log('   Ou use um arquivo de áudio real para teste.')
    return null
  }
  
  return testAudioPath
}

// Função para testar upload de áudio
async function testAudioUpload(audioFilePath) {
  console.log('\n🔄 Testando upload de áudio...')
  
  try {
    const audioBuffer = fs.readFileSync(audioFilePath)
    const formData = new FormData()
    
    // Criar blob do arquivo
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
    formData.append('file', blob, 'test-audio.mp3')
    formData.append('type', 'audio')
    
    const response = await fetch(`${API_BASE}/api/atendimento/upload`, {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Upload falhou: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    console.log('✅ Upload bem-sucedido:', {
      fileName: result.fileName,
      fileUrl: result.fileUrl,
      fileSize: result.fileSize,
      convertedFrom: result.convertedFrom
    })
    
    return result.fileUrl
    
  } catch (error) {
    console.error('❌ Erro no upload:', error.message)
    return null
  }
}

// Função para testar URL pública
async function testPublicUrl(url) {
  console.log('\n🌐 Testando acesso público à URL...')
  
  try {
    const response = await fetch(url, { method: 'HEAD' })
    
    if (!response.ok) {
      throw new Error(`URL não acessível: ${response.status} ${response.statusText}`)
    }
    
    const contentType = response.headers.get('content-type')
    const contentLength = response.headers.get('content-length')
    
    console.log('✅ URL pública acessível:', {
      status: response.status,
      contentType,
      contentLength: contentLength ? `${contentLength} bytes` : 'N/A'
    })
    
    return true
    
  } catch (error) {
    console.error('❌ Erro ao testar URL:', error.message)
    return false
  }
}

// Função para testar envio via Z-API
async function testZAPISend(audioUrl) {
  console.log('\n📤 Testando envio via Z-API...')
  
  try {
    const payload = {
      phone: TEST_PHONE,
      type: 'audio',
      localPath: audioUrl
    }
    
    const response = await fetch(`${API_BASE}/api/atendimento/send-media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Envio falhou: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    console.log('✅ Envio via Z-API bem-sucedido:', {
      messageId: result.messageId,
      success: result.success
    })
    
    return true
    
  } catch (error) {
    console.error('❌ Erro no envio via Z-API:', error.message)
    return false
  }
}

// Função para testar reações
async function testReactions() {
  console.log('\n😀 Testando sistema de reações...')
  
  try {
    // Primeiro, precisamos de uma mensagem para reagir
    // Vamos enviar uma mensagem de texto primeiro
    const textPayload = {
      phone: TEST_PHONE,
      type: 'text',
      content: 'Mensagem de teste para reações'
    }
    
    const textResponse = await fetch(`${API_BASE}/api/atendimento/send-media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(textPayload)
    })
    
    if (!textResponse.ok) {
      throw new Error('Falha ao enviar mensagem de texto para teste de reações')
    }
    
    const textResult = await textResponse.json()
    const messageId = textResult.messageId
    
    console.log('📝 Mensagem de teste enviada:', messageId)
    
    // Agora testar reação
    const reactionPayload = {
      phone: TEST_PHONE,
      messageId: messageId,
      emoji: '👍',
      agentName: 'Teste',
      agentId: 'test-agent'
    }
    
    const reactionResponse = await fetch(`${API_BASE}/api/atendimento/send-reaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reactionPayload)
    })
    
    if (!reactionResponse.ok) {
      const errorText = await reactionResponse.text()
      throw new Error(`Reação falhou: ${reactionResponse.status} - ${errorText}`)
    }
    
    const reactionResult = await reactionResponse.json()
    console.log('✅ Reação enviada com sucesso:', {
      success: reactionResult.success,
      emoji: reactionResult.reaction?.emoji
    })
    
    return true
    
  } catch (error) {
    console.error('❌ Erro no teste de reações:', error.message)
    return false
  }
}

// Função principal
async function runTests() {
  console.log('🧪 Iniciando testes do sistema de áudio e reações...\n')
  
  // Teste 1: Upload de áudio
  const audioFilePath = createTestAudioFile()
  if (!audioFilePath) {
    console.log('⚠️  Pulando teste de áudio - arquivo não encontrado')
  } else {
    const audioUrl = await testAudioUpload(audioFilePath)
    
    if (audioUrl) {
      // Teste 2: URL pública
      const isPublic = await testPublicUrl(audioUrl)
      
      if (isPublic) {
        // Teste 3: Envio via Z-API
        await testZAPISend(audioUrl)
      }
    }
  }
  
  // Teste 4: Reações
  await testReactions()
  
  console.log('\n🏁 Testes concluídos!')
  console.log('\n📋 Checklist:')
  console.log('□ Upload de áudio funcionando')
  console.log('□ Conversão de formatos funcionando')
  console.log('□ URLs públicas acessíveis')
  console.log('□ Envio via Z-API funcionando')
  console.log('□ Sistema de reações funcionando')
  console.log('\n💡 Dicas:')
  console.log('- Verifique os logs do servidor para mais detalhes')
  console.log('- Teste com diferentes formatos de áudio (MP3, OGG, WAV)')
  console.log('- Confirme se a Z-API está configurada corretamente')
  console.log('- Verifique se as regras do Firebase Storage permitem acesso público')
}

// Executar testes
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = {
  testAudioUpload,
  testPublicUrl,
  testZAPISend,
  testReactions
} 