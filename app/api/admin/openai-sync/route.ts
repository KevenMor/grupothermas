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
    const { agent, trainingPrompt, model, temperature, maxTokens } = body;

    if (!agent || !trainingPrompt) {
      return NextResponse.json(
        { error: 'Dados do agente e prompt de treinamento são obrigatórios' },
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

    // Criar ou atualizar o assistente no OpenAI
    try {
      // Primeiro, listar assistentes existentes para verificar se já existe
      const assistants = await openai.beta.assistants.list();
      let assistantId = null;

      // Procurar por assistente existente com o mesmo nome
      const existingAssistant = assistants.data.find(
        (a) => a.name === agent.name
      );

      if (existingAssistant) {
        // Atualizar assistente existente
        const updatedAssistant = await openai.beta.assistants.update(
          existingAssistant.id,
          {
            name: agent.name,
            instructions: trainingPrompt,
            model: model || 'gpt-4',
            tools: [
              {
                type: 'function',
                function: {
                  name: 'get_company_info',
                  description: 'Obter informações sobre a empresa',
                  parameters: {
                    type: 'object',
                    properties: {
                      query: {
                        type: 'string',
                        description: 'Consulta sobre a empresa'
                      }
                    },
                    required: ['query']
                  }
                }
              }
            ]
          }
        );
        assistantId = updatedAssistant.id;
      } else {
        // Criar novo assistente
        const newAssistant = await openai.beta.assistants.create({
          name: agent.name,
          instructions: trainingPrompt,
          model: model || 'gpt-4',
          tools: [
            {
              type: 'function',
              function: {
                name: 'get_company_info',
                description: 'Obter informações sobre a empresa',
                parameters: {
                  type: 'object',
                  properties: {
                    query: {
                      type: 'string',
                      description: 'Consulta sobre a empresa'
                    }
                  },
                  required: ['query']
                }
              }
            }
          ]
        });
        assistantId = newAssistant.id;
      }

      // Salvar ID do assistente no Firebase para referência futura
      // TODO: Implementar salvamento do assistantId

      return NextResponse.json({
        success: true,
        message: 'Sincronizado com OpenAI com sucesso',
        assistantId,
        model: model || 'gpt-4',
        temperature: temperature || 0.7,
        maxTokens: maxTokens || 1000
      });

    } catch (openaiError) {
      console.error('Erro na API OpenAI:', openaiError);
      return NextResponse.json(
        { error: 'Erro ao sincronizar com OpenAI. Verifique a chave da API.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro ao sincronizar com OpenAI:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 