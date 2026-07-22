import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (payload.eventType !== 'subscription.paid') {
      return NextResponse.json({ received: true, skipped: true });
    }

    const email = payload.object?.customer?.email;
    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. 先查找 profiles 表中是否已有该邮箱的用户
    let userId = null;
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing?.id) {
      userId = existing.id;
    } else {
      // 2. 没有找到，通过 Supabase Admin API 创建一个 Auth 用户
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { source: 'creem_webhook' },
      });

      if (createError || !newUser?.user?.id) {
        return NextResponse.json({ 
          error: 'Create auth user failed: ' + (createError?.message || 'No id returned') 
        }, { status: 500 });
      }

      userId = newUser.user.id;

      // 3. 在 profiles 表中创建对应记录
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: userId, email });

      if (profileError) {
        return NextResponse.json({ 
          error: 'Create profile failed: ' + profileError.message 
        }, { status: 500 });
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'No userId after create' }, { status: 500 });
    }

    // 4. 更新订阅状态
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

    if (upsertError) {
      return NextResponse.json({ error: 'Upsert failed: ' + upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ received: true, success: true });

  } catch (err: any) {
    return NextResponse.json({ error: 'Crash: ' + err.message }, { status: 500 });
  }
}
