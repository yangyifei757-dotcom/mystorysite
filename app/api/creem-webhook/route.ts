import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log('1. Received payload, eventType:', payload.eventType);

    if (payload.eventType !== 'subscription.paid') {
      console.log('1a. Not subscription.paid, skipping');
      return NextResponse.json({ received: true, skipped: true });
    }

    const email = payload.object?.customer?.email;
    const planId = payload.object?.product?.id;
    console.log('2. Email:', email, 'PlanId:', planId);

    if (!email) {
      console.log('2a. No email, returning 400');
      return NextResponse.json({ error: 'No email' }, { status: 400 });
    }

    // 检查环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('3. Supabase URL exists:', !!supabaseUrl, 'Service Key exists:', !!serviceKey);

    if (!supabaseUrl || !serviceKey) {
      console.log('3a. Missing env vars');
      return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    console.log('4. Supabase client created');

    // 查找或创建用户
    const { data: existing, error: findError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
    
    console.log('5. Find user result:', existing?.id, 'Error:', findError?.message);

    let userId = existing?.id;
    if (!userId) {
      const { data: newUser, error: createError } = await supabase
        .from('profiles')
        .insert({ email })
        .select('id')
        .single();
      console.log('6. Create user result:', newUser?.id, 'Error:', createError?.message);
      
      if (createError || !newUser) {
        console.log('6a. User creation failed');
        return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
      }
      userId = newUser.id;
    }

    // 更新订阅
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    const { error: upsertError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan: 'monthly',
        status: 'active',
        current_period_end: periodEnd.toISOString(),
        provider: 'creem',
      });
    
    console.log('7. Upsert result, Error:', upsertError?.message);

    if (upsertError) {
      console.log('7a. Upsert failed');
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    console.log('8. Success!');
    return NextResponse.json({ received: true, success: true });

  } catch (err: any) {
    console.error('CRASH:', err.message, err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
