import { NextResponse, NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image', 'audio', 'video', 'document']
    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 })
    }

    console.log('Upload iniciado:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadType: type
    })

    // Criar diretório se não existir
    const uploadDir = join(process.cwd(), 'public', 'uploads', type)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
      console.log('Diretório criado:', uploadDir)
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    let extension = file.name.split('.').pop()?.toLowerCase() || 'unknown'
    
    // Para áudios sem extensão, usar wav como padrão
    if (type === 'audio' && (!extension || extension === 'unknown')) {
      extension = 'wav'
    }
    
    // Para documentos, preservar extensão original
    if (type === 'document' && extension === 'unknown') {
      extension = 'pdf' // fallback para PDF
    }
    
    const fileName = `${timestamp}.${extension}`
    const filePath = join(uploadDir, fileName)

    console.log('Salvando arquivo:', {
      fileName,
      filePath,
      extension
    })

    // Salvar arquivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Verificar se o arquivo foi salvo
    if (!existsSync(filePath)) {
      throw new Error('Arquivo não foi salvo corretamente')
    }

    // URL pública do arquivo - usar URL completa do servidor
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const fileUrl = `${baseUrl}/api/uploads/${type}/${fileName}`

    console.log('Upload concluído:', {
      fileName,
      fileUrl,
      fileSize: file.size,
      savedPath: filePath
    })

    return NextResponse.json({
      success: true,
      fileName,
      fileUrl,
      fileSize: file.size,
      fileType: file.type,
      localPath: `/uploads/${type}/${fileName}` // Caminho local para compatibilidade
    })

  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 