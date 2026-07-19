import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 禁用默认的 body 解析，因为我们要读取原始文本
export const dynamic = 'force-dynamic';

// 在处理 Webhook 时才动态创建 Supabase 客户端，避免构建时环境变量缺失错误
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
    // 1. 只处理支付成功 (order.paid) 事件
    if (payload.event === 'order.paid') {
      const email = payload.customer?.email || payload.data?.customer?.email;
      const planId = payload.product?.id || payload.data?.product?.id;
      
      if (!email) return NextResponse.json({ error: 'No email found' }, { status: 400 });

      const supabase = getSupabaseAdmin();

      // 2. 根据 Creem 的产品 ID 确定计划名称和到期日
      let plan = 'monthly'; // 默认值
      let daysToAdd = 30;
      
      // 注意：需要替换为你 Creem 后台真实的产品 ID
      if (planId === 'prod_4ZI6kyf8A9qbLyDyYYb6Tx') { // 月订阅
        plan = 'monthly';
        daysToAdd = 30;
      } else if (planId === 'prod_1vKDDSUKmfkSefSmmhlHa') { // 年订阅
        plan = 'yearly';
        daysToAdd = 365;
      }

      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + daysToAdd);

      // 3. 查找或创建用户
      let userId = null;
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        userId = existing.id;
      } else {
        // 如果 profiles 表不存在该用户，需要创建
        const { data: newUser, error: createError } = await supabase
          .from('profiles')
          .insert({ email })
          .select('id')
          .single();
        if (createError || !newUser) throw new Error('User creation failed');
        userId = newUser.id;
      }

      // 4. 更新订阅状态
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

      console.log(`✅ Creem subscription activated for ${email}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
