import { NextRequest, NextResponse } from 'next/server'
import { adminDB } from '@/lib/firebaseAdmin'
import { downloadAndSaveMedia, isFirebaseStorageUrl } from '@/lib/mediaStorage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone é obrigatório' }, { status: 400 })
    }

    console.log('=== BUSCANDO HISTÓRICO DE MÍDIAS ===')
    console.log('Phone:', phone)
    console.log('Limit:', limit)

    // Buscar mensagens com mídia
    const conversationRef = adminDB.collection('conversations').doc(phone)
    const messagesSnapshot = await conversationRef
      .collection('messages')
      .where('mediaType', 'in', ['image', 'audio', 'video', 'document'])
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get()

    const mediaHistory = []
    
    for (const doc of messagesSnapshot.docs) {
      const message = doc.data()
      
      if (message.mediaUrl && !isFirebaseStorageUrl(message.mediaUrl)) {
        console.log('Mídia não está no Firebase Storage:', message.mediaUrl)
        
        // Download e salvamento automático
        try {
          const storageResult = await downloadAndSaveMedia(
            message.mediaUrl,
            message.mediaType,
            message.mediaInfo?.filename || `media_${Date.now()}`
          )
          
          if (storageResult.success) {
            console.log('Mídia migrada para Firebase Storage:', storageResult.publicUrl)
            
            // Atualizar mensagem no Firestore
            await doc.ref.update({
              mediaUrl: storageResult.publicUrl,
              'mediaInfo.url': storageResult.publicUrl,
              'mediaInfo.storageUrl': storageResult.storageUrl,
              'mediaInfo.migratedAt': new Date().toISOString()
            })
            
            mediaHistory.push({
              id: doc.id,
              ...message,
              mediaUrl: storageResult.publicUrl,
              mediaInfo: {
                ...message.mediaInfo,
                url: storageResult.publicUrl,
                storageUrl: storageResult.storageUrl,
                migratedAt: new Date().toISOString()
              }
            })
          } else {
            console.error('Erro ao migrar mídia:', storageResult.error)
            mediaHistory.push({
              id: doc.id,
              ...message,
              migrationError: storageResult.error
            })
          }
        } catch (error) {
          console.error('Erro ao processar migração:', error)
          mediaHistory.push({
            id: doc.id,
            ...message,
            migrationError: error instanceof Error ? error.message : 'Erro desconhecido'
          })
        }
      } else {
        mediaHistory.push({
          id: doc.id,
          ...message
        })
      }
    }

    console.log(`Histórico de mídias encontrado: ${mediaHistory.length} itens`)

    return NextResponse.json({
      success: true,
      mediaHistory,
      total: mediaHistory.length
    })

  } catch (error) {
    console.error('Erro ao buscar histórico de mídias:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phone, mediaUrl, mediaType, filename } = await request.json()
    
    if (!phone || !mediaUrl || !mediaType) {
      return NextResponse.json({ 
        error: 'Phone, mediaUrl e mediaType são obrigatórios' 
      }, { status: 400 })
    }

    console.log('=== MIGRANDO MÍDIA PARA FIREBASE STORAGE ===')
    console.log('Phone:', phone)
    console.log('MediaUrl:', mediaUrl)
    console.log('MediaType:', mediaType)
    console.log('Filename:', filename)

    // Verificar se já está no Firebase Storage
    if (isFirebaseStorageUrl(mediaUrl)) {
      return NextResponse.json({
        success: true,
        message: 'Mídia já está no Firebase Storage',
        mediaUrl
      })
    }

    // Download e salvamento no Firebase Storage
    const storageResult = await downloadAndSaveMedia(
      mediaUrl,
      mediaType,
      filename
    )

    if (!storageResult.success) {
      return NextResponse.json({
        success: false,
        error: storageResult.error
      }, { status: 400 })
    }

    console.log('Mídia migrada com sucesso:', storageResult.publicUrl)

    return NextResponse.json({
      success: true,
      message: 'Mídia migrada para Firebase Storage com sucesso',
      originalUrl: mediaUrl,
      storageUrl: storageResult.storageUrl,
      publicUrl: storageResult.publicUrl,
      fileName: storageResult.fileName,
      fileSize: storageResult.fileSize
    })

  } catch (error) {
    console.error('Erro ao migrar mídia:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 