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

    // 1. 查找或创建 Auth 用户
    let userId = null;

    // 先尝试通过 email 查找已有用户
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const foundUser = existingUsers?.users?.find((u: any) => u.email === email);

    if (foundUser?.id) {
      userId = foundUser.id;
    } else {
      // 创建新的 Auth 用户
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });

      if (createError || !newUser?.user?.id) {
        return NextResponse.json({ 
          error: 'Create auth user failed: ' + (createError?.message || 'No id returned') 
        }, { status: 500 });
      }

      userId = newUser.user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'No userId after create' }, { status: 500 });
    }

    // 2. 更新 profiles 表中的 email（Supabase 自动创建了记录，但 email 可能为空）
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ email })
      .eq('id', userId);

    // 如果更新失败（记录不存在），则尝试插入
    if (updateError && updateError.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({ id: userId, email });
      
      if (insertError && insertError.code !== '23505') {
        return NextResponse.json({ 
          error: 'Profile insert failed: ' + insertError.message 
        }, { status: 500 });
      }
    }

    // 3. 更新订阅状态
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
