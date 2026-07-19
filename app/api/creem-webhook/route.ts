import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.text();
  console.log('🚀 Creem Webhook RAW BODY:', body);

  let payload;
  try {
    payload = JSON.parse(body);
  } catch (e) {
    console.error('❌ Invalid JSON:', e);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('📦 Parsed payload:', JSON.stringify(payload).substring(0, 500)); // 打印前500字符

  // 这里暂时不处理业务，只返回成功
  return NextResponse.json({ received: true });
}
