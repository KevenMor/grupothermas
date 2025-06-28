import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import ffmpeg from 'fluent-ffmpeg'
import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

export interface MediaUploadResult {
  success: boolean
  fileName?: string
  fileUrl?: string
  fileSize?: number
  fileType?: string
  storagePath?: string
  error?: string
  convertedFrom?: string
}

/**
 * Converte arquivo de áudio WebM/Opus para MP3 usando FFmpeg
 */
async function convertAudioToMp3(inputBuffer: Buffer, inputFormat: string): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // Criar arquivos temporários
      const tempInputPath = join(tmpdir(), `temp_input_${Date.now()}.${inputFormat}`)
      const tempOutputPath = join(tmpdir(), `temp_output_${Date.now()}.mp3`)
      
      // Salvar buffer de entrada em arquivo temporário
      await writeFile(tempInputPath, inputBuffer)
      
      ffmpeg(tempInputPath)
        .toFormat('mp3')
        .audioCodec('libmp3lame')
        .audioBitrate(128)
        .audioChannels(1) // Mono para melhor compatibilidade
        .audioFrequency(22050) // Frequência padrão para WhatsApp
        .on('error', async (err) => {
          console.error('Erro na conversão de áudio para MP3:', err)
          // Limpar arquivos temporários
          try {
            await unlink(tempInputPath)
            await unlink(tempOutputPath)
          } catch (cleanupError) {
            console.warn('Erro ao limpar arquivos temporários:', cleanupError)
          }
          reject(err)
        })
        .on('end', async () => {
          try {
            // Ler arquivo convertido
            const fs = require('fs')
            const convertedBuffer = fs.readFileSync(tempOutputPath)
            
            // Limpar arquivos temporários
            await unlink(tempInputPath)
            await unlink(tempOutputPath)
            
            console.log('Conversão para MP3 concluída:', {
              inputSize: inputBuffer.length,
              outputSize: convertedBuffer.length,
              inputFormat,
              outputFormat: 'mp3'
            })
            
            // Validação: checar magic bytes do MP3
            const isMp3 = convertedBuffer.slice(0,3).toString('hex') === '494433' || (convertedBuffer[0] === 0xFF && (convertedBuffer[1] & 0xE0) === 0xE0)
            if (!isMp3) {
              console.error('Arquivo convertido não é um MP3 válido!')
              return {
                success: false,
                error: 'Conversão para MP3 falhou: arquivo inválido.'
              }
            }
            
            resolve(Buffer.from(convertedBuffer))
          } catch (error) {
            reject(error)
          }
        })
        .save(tempOutputPath)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Converte arquivo de áudio para OGG/Opus usando FFmpeg
 */
async function convertAudioToOgg(inputBuffer: Buffer, inputFormat: string): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // Criar arquivos temporários
      const tempInputPath = join(tmpdir(), `temp_input_${Date.now()}.${inputFormat}`)
      const tempOutputPath = join(tmpdir(), `temp_output_${Date.now()}.ogg`)
      
      // Salvar buffer de entrada em arquivo temporário
      await writeFile(tempInputPath, inputBuffer)
      
      ffmpeg(tempInputPath)
        .toFormat('ogg')
        .audioCodec('libopus')
        .audioBitrate(64) // Bitrate menor para OGG/Opus
        .audioChannels(1) // Mono
        .audioFrequency(24000) // Frequência otimizada para Opus
        .on('error', async (err) => {
          console.error('Erro na conversão de áudio para OGG:', err)
          // Limpar arquivos temporários
          try {
            await unlink(tempInputPath)
            await unlink(tempOutputPath)
          } catch (cleanupError) {
            console.warn('Erro ao limpar arquivos temporários:', cleanupError)
          }
          reject(err)
        })
        .on('end', async () => {
          try {
            // Ler arquivo convertido
            const fs = require('fs')
            const convertedBuffer = fs.readFileSync(tempOutputPath)
            
            // Limpar arquivos temporários
            await unlink(tempInputPath)
            await unlink(tempOutputPath)
            
            console.log('Conversão para OGG concluída:', {
              inputSize: inputBuffer.length,
              outputSize: convertedBuffer.length,
              inputFormat,
              outputFormat: 'ogg'
            })
            
            resolve(Buffer.from(convertedBuffer))
          } catch (error) {
            reject(error)
          }
        })
        .save(tempOutputPath)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Detecta o formato de áudio suportado pelo navegador
 */
export function getSupportedAudioFormat(): string {
  const audio = new Audio()
  
  if (audio.canPlayType('audio/webm;codecs=opus')) {
    return 'webm'
  } else if (audio.canPlayType('audio/mp3')) {
    return 'mp3'
  } else if (audio.canPlayType('audio/ogg;codecs=opus')) {
    return 'ogg'
  } else {
    return 'mp3' // Fallback
  }
}

/**
 * Faz upload de um buffer de arquivo (imagem, áudio) no Firebase Storage
 * e retorna a URL pública.
 */
export async function uploadToFirebaseStorage(
  fileBuffer: Buffer, 
  fileName: string, 
  mimeType: string,
  mediaType: 'image' | 'audio' | 'video' | 'document'
): Promise<MediaUploadResult> {
  try {
    console.log(`=== UPLOAD PARA FIREBASE STORAGE ===`)
    console.log('FileName:', fileName)
    console.log('MimeType:', mimeType)
    console.log('MediaType:', mediaType)
    console.log('BufferSize:', fileBuffer.length)

    // Para áudio, converter para MP3 e OGG se necessário
    let finalBuffer = fileBuffer
    let finalFileName = fileName
    let finalMimeType = mimeType
    let convertedFrom: string | undefined

    if (mediaType === 'audio') {
      const fileExtension = fileName.split('.').pop()?.toLowerCase()
      
      // Se não for MP3 ou OGG, converter
      if (fileExtension !== 'mp3' && fileExtension !== 'ogg' && mimeType !== 'audio/mpeg' && mimeType !== 'audio/ogg') {
        console.log('Convertendo áudio para MP3...')
        
        let inputFormat = 'webm'
        if (fileExtension === 'wav' || mimeType.includes('wav')) {
          inputFormat = 'wav'
        } else if (fileExtension === 'ogg' || mimeType.includes('ogg')) {
          inputFormat = 'ogg'
        }
        
        try {
          // Tentar converter para MP3 primeiro (mais compatível)
          finalBuffer = await convertAudioToMp3(fileBuffer, inputFormat)
          finalFileName = fileName.replace(/\.[^/.]+$/, '.mp3')
          finalMimeType = 'audio/mpeg'
          convertedFrom = `${inputFormat} -> mp3`
          
          console.log('Conversão para MP3 concluída:', {
            originalSize: fileBuffer.length,
            convertedSize: finalBuffer.length,
            originalFormat: inputFormat,
            finalFormat: 'mp3'
          })
          
          // Validação: checar magic bytes do MP3
          const isMp3 = finalBuffer.slice(0,3).toString('hex') === '494433' || (finalBuffer[0] === 0xFF && (finalBuffer[1] & 0xE0) === 0xE0)
          if (!isMp3) {
            console.error('Arquivo convertido não é um MP3 válido!')
            return {
              success: false,
              error: 'Conversão para MP3 falhou: arquivo inválido.'
            }
          }
        } catch (conversionError) {
          console.error('Erro na conversão para MP3, tentando OGG:', conversionError)
          
          try {
            // Fallback para OGG/Opus
            finalBuffer = await convertAudioToOgg(fileBuffer, inputFormat)
            finalFileName = fileName.replace(/\.[^/.]+$/, '.ogg')
            finalMimeType = 'audio/ogg'
            convertedFrom = `${inputFormat} -> ogg`
            
            console.log('Conversão para OGG concluída:', {
              originalSize: fileBuffer.length,
              convertedSize: finalBuffer.length,
              originalFormat: inputFormat,
              finalFormat: 'ogg'
            })
          } catch (oggError) {
            console.error('Erro na conversão para OGG:', oggError)
            // Continuar com o arquivo original se ambas as conversões falharem
            console.warn('Continuando com arquivo original devido a erro na conversão')
          }
        }
      }
    }

    // Definir caminho no Storage
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const storageFileName = `${timestamp}_${randomSuffix}_${finalFileName}`
    const storagePath = `chats/${mediaType}/${storageFileName}`

    console.log('Salvando no Storage:', {
      storageFileName,
      storagePath,
      finalMimeType,
      bufferSize: finalBuffer.length
    })

    // Upload do arquivo
    const storageRef = ref(storage, storagePath)
    const metadata = { 
      contentType: finalMimeType,
      customMetadata: {
        originalFileName: fileName,
        mediaType: mediaType,
        uploadedAt: new Date().toISOString(),
        fileSize: finalBuffer.length.toString(),
        ...(convertedFrom && { convertedFrom })
      }
    }
    
    await uploadBytes(storageRef, finalBuffer, metadata)
    
    // Gera URL pública (válida permanentemente)
    const url = await getDownloadURL(storageRef)
    
    console.log('Upload concluído com sucesso:', {
      fileName: storageFileName,
      fileUrl: url,
      fileSize: finalBuffer.length
    })

    return {
      success: true,
      fileName: storageFileName,
      fileUrl: url,
      fileSize: finalBuffer.length,
      fileType: finalMimeType,
      storagePath,
      convertedFrom
    }

  } catch (error) {
    console.error('Erro no upload para Firebase Storage:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Download e salvamento automático de mídias no Firebase Storage
 * Segue o fluxo obrigatório: download -> salvar no Storage -> gerar link público
 */
export async function downloadAndSaveMedia(
  sourceUrl: string,
  mediaType: 'image' | 'audio' | 'video' | 'document',
  originalFileName?: string
): Promise<MediaUploadResult> {
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
    const fileName = originalFileName || `${timestamp}_${randomSuffix}.${extension}`

    // 4. Fazer upload para Firebase Storage
    const uploadResult = await uploadToFirebaseStorage(buffer, fileName, contentType, mediaType)
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Erro no upload para Firebase Storage')
    }

    return uploadResult

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