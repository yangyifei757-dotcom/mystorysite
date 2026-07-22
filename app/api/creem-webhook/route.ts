import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
}

export async function POST(request: Request) {
  const payload = await request.json();
  console.log('Creem Webhook received:', JSON.stringify(payload));

  try {
    // 监听 subscription.paid 事件（首次支付 + 续费）
    if (payload.event === 'subscription.paid') {
      const email = payload.customer?.email || payload.data?.customer?.email || payload.subscription?.customer_email;
      const planId = payload.product?.id || payload.data?.product?.id || payload.subscription?.product_id;
      
      if (!email) {
        console.error('No email found in payload');
        return NextResponse.json({ error: 'No email found' }, { status: 400 });
      }

      const supabase = getSupabaseAdmin();

      // 根据产品 ID 确定计划
      let plan = 'monthly';
      let daysToAdd = 30;
      
      if (planId === 'prod_4ZI6kyf8A9qbLyDyYYb6Tx') {
        plan = 'monthly';
        daysToAdd = 30;
      } else if (planId === 'prod_1vKDDSUKmfkSefSmmhlHa') {
        plan = 'yearly';
        daysToAdd = 365;
      }

      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + daysToAdd);

      // 查找或创建用户
      let userId = null;
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        userId = existing.id;
      } else {
        const { data: newUser, error: createError } = await supabase
          .from('profiles')
          .insert({ email })
          .select('id')
          .single();
        if (createError || !newUser) throw new Error('User creation failed');
        userId = newUser.id;
      }

      // 更新订阅状态
      const { error: upsertError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan,
          status: 'active',
          current_period_end: periodEnd.toISOString(),
          provider: 'creem',
        });

      if (upsertError) throw upsertError;

      console.log(`✅ Creem subscription activated for ${email} (plan: ${plan})`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
