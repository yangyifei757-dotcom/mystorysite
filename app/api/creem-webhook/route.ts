import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

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

    // 查找或创建用户
    let userId = null;
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing?.id) {
      userId = existing.id;
    } else {
      // 手动生成 UUID 作为 id
      const newId = uuidv4();
      const { data: newUser, error: createError } = await supabase
        .from('profiles')
        .insert({ id: newId, email })
        .select('id')
        .single();

      if (createError) {
        return NextResponse.json({ error: 'Create user failed: ' + createError.message }, { status: 500 });
      }
      userId = newUser?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'No userId after create' }, { status: 500 });
    }

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
