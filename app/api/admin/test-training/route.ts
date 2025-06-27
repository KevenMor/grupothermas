import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Inicializar OpenAI com fallback
const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada');
  }
  return new OpenAI({ apiKey });
};

export async function POST(request: NextRequest) {
  try {
    // TODO: Implementar autenticação real
    // const session = await getServerSession(authOptions);
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    // }

    const body = await request.json();
    const { trainingPrompt, testMessage } = body;

    if (!trainingPrompt || !testMessage) {
      return NextResponse.json(
        { error: 'Prompt de treinamento e mensagem de teste são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar configurações OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Chave da API OpenAI não configurada. Configure OPENAI_API_KEY no Railway.' },
        { status: 500 }
      );
    }

    const openai = getOpenAI();

    try {
      // Criar chat de teste com o prompt de treinamento
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: trainingPrompt
          },
          {
            role: 'user',
            content: testMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const response = completion.choices[0]?.message?.content || 'Sem resposta';

      // Log do teste
      console.log('Teste de treinamento:', {
        testMessage,
        response,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        response,
        testMessage,
        model: 'gpt-4',
        usage: completion.usage
      });

    } catch (openaiError) {
      console.error('Erro na API OpenAI:', openaiError);
      return NextResponse.json(
        { error: 'Erro ao testar com OpenAI. Verifique a chave da API.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro ao testar treinamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 