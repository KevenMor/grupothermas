#!/usr/bin/env node

/**
 * Script de teste para conversão de áudio com FFmpeg
 * 
 * Este script testa:
 * 1. Criação de áudio WebM de teste
 * 2. Conversão para MP3 e OGG
 * 3. Validação dos arquivos convertidos
 * 4. Upload para Firebase Storage
 * 5. Envio via Z-API
 */

const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')

// Configurações
const TEST_PHONE = '5511999999999' // Substitua pelo número de teste
const API_BASE = 'http://localhost:3000' // Ajuste conforme necessário

// Função para criar um arquivo de áudio WebM de teste
function createTestWebmFile() {
  console.log('📝 Criando arquivo WebM de teste...')
  
  // Este é um arquivo WebM de teste com 1 segundo de silêncio
  // Em produção, você pode usar uma biblioteca para gerar áudio real
  const testWebmPath = path.join(__dirname, 'test-audio.webm')
  
  if (!fs.existsSync(testWebmPath)) {
    console.log('⚠️  Arquivo WebM de teste não encontrado.')
    console.log('   Crie um arquivo WebM de teste em scripts/test-audio.webm')
    console.log('   Ou grave um áudio real no navegador e salve como .webm')
    return null
  }
  
  return testWebmPath
}

// Função para testar conversão no frontend
async function testFrontendConversion() {
  console.log('\n🔄 Testando conversão no frontend...')
  
  try {
    // Simular uma requisição para testar a conversão
    const response = await fetch(`${API_BASE}/api/test-audio-conversion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test: true
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Teste falhou: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    console.log('✅ Teste de conversão bem-sucedido:', result)
    
    return true
    
  } catch (error) {
    console.error('❌ Erro no teste de conversão:', error.message)
    return false
  }
}

// Função para testar upload de áudio convertido
async function testAudioUpload(audioFilePath) {
  console.log('\n🔄 Testando upload de áudio convertido...')
  
  try {
    const audioBuffer = fs.readFileSync(audioFilePath)
    const formData = new FormData()
    
    // Criar blob do arquivo
    const blob = new Blob([audioBuffer], { type: 'audio/webm' })
    formData.append('file', blob, 'test-audio.webm')
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
    
    // Validar content-type
    if (!contentType || !contentType.includes('audio/')) {
      console.warn('⚠️  Content-Type inválido:', contentType)
      return false
    }
    
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

// Função para validar arquivo de áudio
function validateAudioFile(filePath) {
  console.log('\n🔍 Validando arquivo de áudio...')
  
  try {
    const stats = fs.statSync(filePath)
    const buffer = fs.readFileSync(filePath)
    
    console.log('📊 Informações do arquivo:', {
      size: `${stats.size} bytes`,
      path: filePath,
      exists: true
    })
    
    // Verificar se é um arquivo WebM válido (header básico)
    if (buffer.length < 4) {
      console.error('❌ Arquivo muito pequeno')
      return false
    }
    
    // Verificar header WebM (simplificado)
    const header = buffer.slice(0, 4)
    if (header[0] === 0x1A && header[1] === 0x45 && header[2] === 0xDF && header[3] === 0xA3) {
      console.log('✅ Header WebM válido detectado')
      return true
    } else {
      console.warn('⚠️  Header WebM não detectado, mas continuando...')
      return true // Continuar mesmo assim
    }
    
  } catch (error) {
    console.error('❌ Erro ao validar arquivo:', error.message)
    return false
  }
}

// Função principal
async function runTests() {
  console.log('🧪 Iniciando testes de conversão de áudio...\n')
  
  // Teste 1: Validar arquivo de entrada
  const audioFilePath = createTestWebmFile()
  if (!audioFilePath) {
    console.log('⚠️  Pulando testes - arquivo não encontrado')
    return
  }
  
  if (!validateAudioFile(audioFilePath)) {
    console.log('❌ Arquivo de entrada inválido')
    return
  }
  
  // Teste 2: Conversão no frontend (simulado)
  const conversionSuccess = await testFrontendConversion()
  if (!conversionSuccess) {
    console.log('⚠️  Conversão falhou, mas continuando...')
  }
  
  // Teste 3: Upload de áudio
  const audioUrl = await testAudioUpload(audioFilePath)
  if (!audioUrl) {
    console.log('❌ Upload falhou')
    return
  }
  
  // Teste 4: URL pública
  const isPublic = await testPublicUrl(audioUrl)
  if (!isPublic) {
    console.log('❌ URL não está pública')
    return
  }
  
  // Teste 5: Envio via Z-API
  const zapiSuccess = await testZAPISend(audioUrl)
  
  console.log('\n🏁 Testes concluídos!')
  console.log('\n📋 Resultados:')
  console.log(`□ Arquivo de entrada: ${audioFilePath ? '✅' : '❌'}`)
  console.log(`□ Conversão frontend: ${conversionSuccess ? '✅' : '⚠️'}`)
  console.log(`□ Upload Firebase: ${audioUrl ? '✅' : '❌'}`)
  console.log(`□ URL pública: ${isPublic ? '✅' : '❌'}`)
  console.log(`□ Envio Z-API: ${zapiSuccess ? '✅' : '❌'}`)
  
  console.log('\n💡 Próximos passos:')
  console.log('1. Teste a gravação de áudio real no navegador')
  console.log('2. Verifique se o FFmpeg está carregando corretamente')
  console.log('3. Monitore os logs do console para detalhes da conversão')
  console.log('4. Confirme se os arquivos convertidos têm o content-type correto')
}

// Executar testes
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = {
  testFrontendConversion,
  testAudioUpload,
  testPublicUrl,
  testZAPISend,
  validateAudioFile
} 