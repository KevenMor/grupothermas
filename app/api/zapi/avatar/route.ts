import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    if (!phone) {
      return NextResponse.json({ error: 'phone é obrigatório' }, { status: 400 });
    }
    // Buscar configs da Z-API
    const zapiApiKey = process.env.ZAPI_TOKEN;
    const zapiInstanceId = process.env.ZAPI_INSTANCE_ID;
    if (!zapiApiKey || !zapiInstanceId) {
      return NextResponse.json({ error: 'Z-API não configurada' }, { status: 500 });
    }
    // Endpoint oficial Z-API para buscar avatar
    const zapiUrl = `https://api.z-api.io/instances/${zapiInstanceId}/token/${zapiApiKey}/avatar?phone=${encodeURIComponent(phone)}`;
    const zapiRes = await fetch(zapiUrl);
    if (!zapiRes.ok) {
      return NextResponse.json({ error: 'Erro ao buscar avatar na Z-API' }, { status: 500 });
    }
    const data = await zapiRes.json();
    // Esperado: { avatar: 'url' }
    return NextResponse.json({ avatarUrl: data.avatar || data.url || null });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno ao buscar avatar' }, { status: 500 });
  }
} 