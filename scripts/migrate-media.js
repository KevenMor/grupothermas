const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getStorage } = require('firebase-admin/storage')
const fetch = require('node-fetch')

// Configuração do Firebase Admin
const serviceAccount = require('../firebase-service-account.json')

if (!initializeApp.length) {
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'grupo-thermas-a99fc.firebasestorage.app'
  })
}

const adminDB = getFirestore()
const adminStorage = getStorage()

/**
 * Download e salvamento automático de mídias no Firebase Storage
 */
async function downloadAndSaveMedia(sourceUrl, mediaType, originalFileName) {
  try {
    console.log(`=== DOWNLOAD E SALVAMENTO DE MÍDIA ===`)
    console.log('URL origem:', sourceUrl)
    console.log('Tipo:', mediaType)
    console.log('Nome original:', originalFileName)

    // 1. Download da mídia da URL origem
    console.log('Fazendo download da mídia...')
    const response = await fetch(sourceUrl)
    
    if (!response.ok) {
      throw new Error(`Falha no download: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const contentLength = response.headers.get('content-length')
    const fileSize = contentLength ? parseInt(contentLength) : 0

    console.log('Headers da resposta:', {
      contentType,
      contentLength,
      fileSize
    })

    // 2. Obter buffer do arquivo
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('Download concluído. Tamanho:', buffer.length, 'bytes')

    // 3. Determinar extensão e nome do arquivo
    let extension = 'unknown'
    let fileName = ''

    // Tentar extrair extensão do Content-Type
    if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) {
      extension = 'jpg'
    } else if (contentType.includes('image/png')) {
      extension = 'png'
    } else if (contentType.includes('image/gif')) {
      extension = 'gif'
    } else if (contentType.includes('image/webp')) {
      extension = 'webp'
    } else if (contentType.includes('audio/mpeg') || contentType.includes('audio/mp3')) {
      extension = 'mp3'
    } else if (contentType.includes('audio/wav')) {
      extension = 'wav'
    } else if (contentType.includes('audio/ogg') || contentType.includes('audio/opus')) {
      extension = 'ogg'
    } else if (contentType.includes('video/mp4')) {
      extension = 'mp4'
    } else if (contentType.includes('video/webm')) {
      extension = 'webm'
    } else if (contentType.includes('application/pdf')) {
      extension = 'pdf'
    } else if (contentType.includes('application/msword')) {
      extension = 'doc'
    } else if (contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      extension = 'docx'
    }

    // Se não conseguiu determinar pela extensão, tentar pela URL
    if (extension === 'unknown') {
      const urlPath = new URL(sourceUrl).pathname
      const urlExtension = urlPath.split('.').pop()?.toLowerCase()
      if (urlExtension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp3', 'wav', 'ogg', 'opus', 'mp4', 'webm', 'pdf', 'doc', 'docx'].includes(urlExtension)) {
        extension = urlExtension
      }
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    fileName = `${timestamp}_${randomSuffix}.${extension}`

    // 4. Definir caminho no Storage
    const storagePath = `${mediaType}/${fileName}`

    console.log('Salvando no Storage:', {
      fileName,
      storagePath,
      extension,
      contentType,
      fileSize: buffer.length
    })

    // 5. Salvar no Firebase Storage
    const bucket = adminStorage.bucket('grupo-thermas-a99fc.firebasestorage.app')
    const fileRef = bucket.file(storagePath)
    
    await fileRef.save(buffer, {
      contentType: contentType,
      metadata: {
        originalUrl: sourceUrl,
        originalFileName: originalFileName || fileName,
        mediaType: mediaType,
        uploadedAt: new Date().toISOString()
      }
    })

    console.log('Arquivo salvo no Storage com sucesso')

    // 6. Gerar URL pública (signed URL válida por 1 ano)
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 ano
    })

    console.log('URL pública gerada:', url)

    return {
      success: true,
      storageUrl: `gs://grupo-thermas-a99fc.firebasestorage.app/${storagePath}`,
      publicUrl: url,
      fileName: fileName,
      fileSize: buffer.length
    }

  } catch (error) {
    console.error('Erro no download e salvamento de mídia:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Verificar se uma URL já é do Firebase Storage
 */
function isFirebaseStorageUrl(url) {
  return url.includes('firebasestorage.app') || url.includes('firebase.com')
}

/**
 * Migrar todas as mídias antigas para o Firebase Storage
 */
async function migrateAllMedia() {
  try {
    console.log('=== INICIANDO MIGRAÇÃO DE MÍDIAS ===')
    
    // Buscar todas as conversas
    const conversationsSnapshot = await adminDB.collection('conversations').get()
    
    let totalMigrated = 0
    let totalErrors = 0
    
    for (const convDoc of conversationsSnapshot.docs) {
      const conversation = convDoc.data()
      const phone = conversation.phone || convDoc.id
      
      console.log(`\n--- Processando conversa: ${phone} ---`)
      
      // Buscar mensagens com mídia
      const messagesSnapshot = await convDoc.ref
        .collection('messages')
        .where('mediaType', 'in', ['image', 'audio', 'video', 'document'])
        .get()
      
      console.log(`Encontradas ${messagesSnapshot.size} mensagens com mídia`)
      
      for (const msgDoc of messagesSnapshot.docs) {
        const message = msgDoc.data()
        
        if (message.mediaUrl && !isFirebaseStorageUrl(message.mediaUrl)) {
          console.log(`\nMigrando mídia: ${message.mediaUrl}`)
          
          try {
            const storageResult = await downloadAndSaveMedia(
              message.mediaUrl,
              message.mediaType,
              message.mediaInfo?.filename || `media_${Date.now()}`
            )
            
            if (storageResult.success) {
              // Atualizar mensagem no Firestore
              await msgDoc.ref.update({
                mediaUrl: storageResult.publicUrl,
                'mediaInfo.url': storageResult.publicUrl,
                'mediaInfo.storageUrl': storageResult.storageUrl,
                'mediaInfo.migratedAt': new Date().toISOString()
              })
              
              console.log(`✅ Mídia migrada com sucesso: ${storageResult.publicUrl}`)
              totalMigrated++
            } else {
              console.error(`❌ Erro ao migrar mídia: ${storageResult.error}`)
              totalErrors++
            }
          } catch (error) {
            console.error(`❌ Erro ao processar migração: ${error.message}`)
            totalErrors++
          }
        } else {
          console.log(`⏭️ Mídia já está no Firebase Storage: ${message.mediaUrl}`)
        }
      }
    }
    
    console.log(`\n=== MIGRAÇÃO CONCLUÍDA ===`)
    console.log(`Total migrado: ${totalMigrated}`)
    console.log(`Total de erros: ${totalErrors}`)
    
  } catch (error) {
    console.error('Erro na migração:', error)
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  migrateAllMedia()
    .then(() => {
      console.log('Migração finalizada')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Erro na migração:', error)
      process.exit(1)
    })
}

module.exports = {
  migrateAllMedia,
  downloadAndSaveMedia,
  isFirebaseStorageUrl
} 