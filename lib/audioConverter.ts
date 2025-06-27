import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

let ffmpeg: FFmpeg | null = null

/**
 * Inicializa o FFmpeg
 */
export async function initFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) {
    return ffmpeg
  }

  console.log('🔄 Inicializando FFmpeg...')
  
  ffmpeg = new FFmpeg()
  
  // Carregar FFmpeg
  await ffmpeg.load({
    coreURL: await toBlobURL(`/ffmpeg/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`/ffmpeg/ffmpeg-core.wasm`, 'application/wasm'),
  })
  
  console.log('✅ FFmpeg inicializado com sucesso')
  return ffmpeg
}

/**
 * Converte áudio WebM/Opus para MP3 usando FFmpeg
 */
export async function convertWebmToMp3(webmBlob: Blob): Promise<Blob> {
  try {
    console.log('🔄 Iniciando conversão WebM → MP3...')
    console.log('Tamanho do blob original:', webmBlob.size, 'bytes')
    console.log('Tipo MIME original:', webmBlob.type)
    
    const ffmpegInstance = await initFFmpeg()
    
    // Escrever arquivo de entrada
    const inputFileName = `input_${Date.now()}.webm`
    const outputFileName = `output_${Date.now()}.mp3`
    
    console.log('📝 Escrevendo arquivo de entrada:', inputFileName)
    await ffmpegInstance.writeFile(inputFileName, await fetchFile(webmBlob))
    
    // Executar conversão
    console.log('⚙️ Executando conversão...')
    await ffmpegInstance.exec([
      '-i', inputFileName,
      '-c:a', 'libmp3lame',     // Codec MP3
      '-b:a', '128k',           // Bitrate 128kbps
      '-ar', '22050',           // Sample rate 22kHz (padrão WhatsApp)
      '-ac', '1',               // Mono
      '-y',                     // Sobrescrever arquivo de saída
      outputFileName
    ])
    
    // Ler arquivo convertido
    console.log('📖 Lendo arquivo convertido...')
    const data = await ffmpegInstance.readFile(outputFileName)
    
    // Criar blob MP3 - FileData pode ser string ou Uint8Array
    let mp3Blob: Blob
    if (typeof data === 'string') {
      // Se for string, converter para Uint8Array
      const encoder = new TextEncoder()
      const uint8Array = encoder.encode(data)
      mp3Blob = new Blob([uint8Array], { type: 'audio/mpeg' })
    } else {
      // Se for Uint8Array, usar diretamente
      mp3Blob = new Blob([data], { type: 'audio/mpeg' })
    }
    
    // Limpar arquivos temporários
    try {
      await ffmpegInstance.deleteFile(inputFileName)
      await ffmpegInstance.deleteFile(outputFileName)
    } catch (cleanupError) {
      console.warn('Erro ao limpar arquivos temporários:', cleanupError)
    }
    
    console.log('✅ Conversão concluída:', {
      tamanhoOriginal: webmBlob.size,
      tamanhoConvertido: mp3Blob.size,
      tipoOriginal: webmBlob.type,
      tipoConvertido: mp3Blob.type
    })
    
    return mp3Blob
    
  } catch (error) {
    console.error('❌ Erro na conversão WebM → MP3:', error)
    throw new Error(`Falha na conversão de áudio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Converte áudio WebM/Opus para OGG usando FFmpeg
 */
export async function convertWebmToOgg(webmBlob: Blob): Promise<Blob> {
  try {
    console.log('🔄 Iniciando conversão WebM → OGG...')
    console.log('Tamanho do blob original:', webmBlob.size, 'bytes')
    console.log('Tipo MIME original:', webmBlob.type)
    
    const ffmpegInstance = await initFFmpeg()
    
    // Escrever arquivo de entrada
    const inputFileName = `input_${Date.now()}.webm`
    const outputFileName = `output_${Date.now()}.ogg`
    
    console.log('📝 Escrevendo arquivo de entrada:', inputFileName)
    await ffmpegInstance.writeFile(inputFileName, await fetchFile(webmBlob))
    
    // Executar conversão
    console.log('⚙️ Executando conversão...')
    await ffmpegInstance.exec([
      '-i', inputFileName,
      '-c:a', 'libopus',        // Codec Opus
      '-b:a', '64k',            // Bitrate 64kbps
      '-ar', '24000',           // Sample rate 24kHz (otimizado para Opus)
      '-ac', '1',               // Mono
      '-y',                     // Sobrescrever arquivo de saída
      outputFileName
    ])
    
    // Ler arquivo convertido
    console.log('📖 Lendo arquivo convertido...')
    const data = await ffmpegInstance.readFile(outputFileName)
    
    // Criar blob OGG - FileData pode ser string ou Uint8Array
    let oggBlob: Blob
    if (typeof data === 'string') {
      // Se for string, converter para Uint8Array
      const encoder = new TextEncoder()
      const uint8Array = encoder.encode(data)
      oggBlob = new Blob([uint8Array], { type: 'audio/ogg' })
    } else {
      // Se for Uint8Array, usar diretamente
      oggBlob = new Blob([data], { type: 'audio/ogg' })
    }
    
    // Limpar arquivos temporários
    try {
      await ffmpegInstance.deleteFile(inputFileName)
      await ffmpegInstance.deleteFile(outputFileName)
    } catch (cleanupError) {
      console.warn('Erro ao limpar arquivos temporários:', cleanupError)
    }
    
    console.log('✅ Conversão concluída:', {
      tamanhoOriginal: webmBlob.size,
      tamanhoConvertido: oggBlob.size,
      tipoOriginal: webmBlob.type,
      tipoConvertido: oggBlob.type
    })
    
    return oggBlob
    
  } catch (error) {
    console.error('❌ Erro na conversão WebM → OGG:', error)
    throw new Error(`Falha na conversão de áudio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Converte áudio para múltiplos formatos (MP3 e OGG)
 */
export async function convertAudioToMultipleFormats(webmBlob: Blob): Promise<{
  mp3Blob: Blob | null
  oggBlob: Blob | null
}> {
  const result = {
    mp3Blob: null as Blob | null,
    oggBlob: null as Blob | null
  }
  
  try {
    console.log('🔄 Convertendo áudio para múltiplos formatos...')
    
    // Tentar converter para MP3
    try {
      result.mp3Blob = await convertWebmToMp3(webmBlob)
      console.log('✅ Conversão para MP3 bem-sucedida')
    } catch (mp3Error) {
      console.warn('⚠️ Falha na conversão para MP3:', mp3Error)
    }
    
    // Tentar converter para OGG
    try {
      result.oggBlob = await convertWebmToOgg(webmBlob)
      console.log('✅ Conversão para OGG bem-sucedida')
    } catch (oggError) {
      console.warn('⚠️ Falha na conversão para OGG:', oggError)
    }
    
    if (!result.mp3Blob && !result.oggBlob) {
      throw new Error('Falha em todas as conversões de áudio')
    }
    
    return result
    
  } catch (error) {
    console.error('❌ Erro na conversão múltipla:', error)
    throw error
  }
}

/**
 * Detecta se o navegador suporta FFmpeg
 */
export function isFFmpegSupported(): boolean {
  return typeof WebAssembly !== 'undefined' && typeof SharedArrayBuffer !== 'undefined'
}

/**
 * Valida se um blob é realmente um arquivo de áudio válido
 */
export function validateAudioBlob(blob: Blob, expectedType: string): boolean {
  // Verificar tipo MIME
  if (!blob.type.includes(expectedType.split('/')[1])) {
    console.warn('Tipo MIME não corresponde ao esperado:', {
      expected: expectedType,
      actual: blob.type
    })
    return false
  }
  
  // Verificar tamanho mínimo (1KB)
  if (blob.size < 1024) {
    console.warn('Arquivo muito pequeno para ser um áudio válido:', blob.size)
    return false
  }
  
  return true
} 