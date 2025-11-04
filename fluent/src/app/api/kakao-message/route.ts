import { NextRequest, NextResponse } from 'next/server';

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_CHANNEL_SECRET = process.env.KAKAO_CHANNEL_SECRET;
const KAKAO_CHANNEL_ID = process.env.KAKAO_CHANNEL_ID;

/**
 * Kakao Talk Channel API - Send Business Messages
 * 
 * This allows FluentTech to send business messages via Kakao Talk Channel.
 * Requirements:
 * 1. Kakao Talk Channel created and approved
 * 2. Message templates registered and approved
 * 3. Channel API enabled in Kakao Developers Console
 */

/**
 * Get Kakao access token for Channel API
 */
async function getKakaoAccessToken(): Promise<string | null> {
  try {
    const response = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: KAKAO_REST_API_KEY || '',
        client_secret: KAKAO_CHANNEL_SECRET || '',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to get access token:', error);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

/**
 * Send message using Kakao Talk Channel API
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, templateId, templateArgs } = await req.json();

    // Validate required fields
    if (!userId || !templateId) {
      return NextResponse.json(
        { 
          error: 'userId and templateId are required',
          example: {
            userId: 'kakao_user_id_from_database',
            templateId: 'your_approved_template_id',
            templateArgs: { name: 'John', amount: '50,000' }
          }
        },
        { status: 400 }
      );
    }

    // Check configuration
    if (!KAKAO_REST_API_KEY || !KAKAO_CHANNEL_SECRET || !KAKAO_CHANNEL_ID) {
      return NextResponse.json(
        { 
          error: 'Kakao API keys not fully configured',
          missing_keys: {
            KAKAO_REST_API_KEY: !KAKAO_REST_API_KEY,
            KAKAO_CHANNEL_SECRET: !KAKAO_CHANNEL_SECRET,
            KAKAO_CHANNEL_ID: !KAKAO_CHANNEL_ID
          },
          setup_guide: 'See docs/kakao_business_message.md for setup instructions'
        },
        { status: 500 }
      );
    }

    // Get access token
    const accessToken = await getKakaoAccessToken();
    
    if (!accessToken) {
      return NextResponse.json(
        { 
          error: 'Failed to get access token from Kakao',
          hint: 'Check your KAKAO_REST_API_KEY and KAKAO_CHANNEL_SECRET',
        },
        { status: 500 }
      );
    }

    // Prepare message data
    const messageData = {
      object_type: 'text',
      text: templateArgs?.message || '안녕하세요. FluentTech에서 메시지를 보냅니다.',
      link: {
        web_url: process.env.NEXT_PUBLIC_URL || 'https://fluent-five.vercel.app',
        mobile_web_url: process.env.NEXT_PUBLIC_URL || 'https://fluent-five.vercel.app',
      },
    };

    // Send message via Kakao Talk Channel API
    const response = await fetch(
      `https://kapi.kakao.com/v2/api/talk/memo/send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          receiver_uuids: JSON.stringify([userId]),
          template_object: JSON.stringify(messageData),
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('Kakao API Error:', result);
      return NextResponse.json(
        { 
          error: 'Failed to send message via Kakao',
          details: result,
          hint: 'Ensure the user has added your Kakao Talk Channel'
        },
        { status: response.status }
      );
    }

    // TODO: Save MessageConfirm status to billing collection
    // This would require yyyymm and student_name parameters to be passed
    // For now, MessageConfirm step won't be automatically saved
    
    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: result,
    });
    
  } catch (error) {
    console.error('Error in Kakao Channel API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Health check and configuration status
 */
export async function GET() {
  try {
    const hasKeys = !!(KAKAO_REST_API_KEY && KAKAO_CHANNEL_SECRET && KAKAO_CHANNEL_ID);
    
    // Try to get access token to verify configuration
    let accessTokenTest = false;
    if (hasKeys) {
      const token = await getKakaoAccessToken();
      accessTokenTest = !!token;
    }

    return NextResponse.json({
      configured: hasKeys,
      access_token_test: accessTokenTest,
      channel_configured: !!KAKAO_CHANNEL_ID,
      message: hasKeys && accessTokenTest 
        ? 'Kakao Talk Channel API is ready'
        : 'Configure API keys in .env.local',
      environment: {
        has_rest_api_key: !!KAKAO_REST_API_KEY,
        has_channel_secret: !!KAKAO_CHANNEL_SECRET,
        has_channel_id: !!KAKAO_CHANNEL_ID,
      },
      documentation: 'https://developers.kakao.com/docs/latest/en/kakaotalk-channel/common',
      setup_guide: '/docs/kakao_business_message.md'
    });
  } catch (error) {
    console.error('Error in Kakao GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
