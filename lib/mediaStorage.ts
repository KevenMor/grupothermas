import { adminStorage, generateSignedUrl } from '@/lib/firebaseAdmin'

export interface MediaStorageResult {
  success: boolean
  storageUrl?: string
  publicUrl?: string
  fileName?: string
  fileSize?: number
  error?: string
}

/**
 * Download e salvamento automático de mídias no Firebase Storage
 * Segue o fluxo obrigatório: download -> salvar no Storage -> gerar link público
 */
export async function downloadAndSaveMedia(
  sourceUrl: string,
  mediaType: 'image' | 'audio' | 'video' | 'document',
  originalFileName?: string
): Promise<MediaStorageResult> {
  try {
    console.log(`=== DOWNLOAD E SALVAMENTO DE MÍDIA ===`)
    console.log('URL origem:', sourceUrl)
    console.log('Tipo:', mediaType)
    console.log('Nome original:', originalFileName)

    if (!adminStorage) {
      throw new Error('Firebase Storage não inicializado')
    }

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
    const publicUrl = await generateSignedUrl(storagePath, 365 * 24 * 60 * 60) // 1 ano

    console.log('URL pública gerada:', publicUrl)

    return {
      success: true,
      storageUrl: `gs://grupo-thermas-a99fc.firebasestorage.app/${storagePath}`,
      publicUrl: publicUrl,
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
export function isFirebaseStorageUrl(url: string): boolean {
  return url.includes('firebasestorage.app') || url.includes('firebase.com')
}

/**
 * Extrair informações de mídia de uma URL do Firebase Storage
 */
export function extractStorageInfo(url: string): { bucket: string; path: string } | null {
  try {
    const urlObj = new URL(url)
    if (urlObj.hostname.includes('firebasestorage.app')) {
      const pathParts = urlObj.pathname.split('/')
      const bucket = pathParts[1]
      const path = pathParts.slice(2).join('/')
      return { bucket, path }
    }
    return null
  } catch {
    return null
  }
} 