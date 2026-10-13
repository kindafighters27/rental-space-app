import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, startTime, endTime, name, email, phone, coupon, notes, totalPrice } = body;

    // オーナー宛てへの「新規予約通知」メール（1通のみ）
    await resend.emails.send({
      from: 'COCOKARA システム通知 <onboarding@resend.dev>',
      to: ['kindafaighters27@gmail.com'], // ※登録されているご自身のメールアドレス
      subject: `【新規仮予約】${name}様 (${date} ${startTime}〜)`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <h3>ホームページから新しい仮予約が入りました。</h3>
          <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>■ お名前:</strong> ${name} 様</p>
            <p style="margin: 5px 0;"><strong>■ メール:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>■ 電話番号:</strong> ${phone || '未登録'}</p>
            <p style="margin: 5px 0;"><strong>■ ご予約日:</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>■ 時間:</strong> ${startTime} 〜 ${endTime}</p>
            <p style="margin: 5px 0;"><strong>■ 金額:</strong> ¥${Number(totalPrice).toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>■ クーポン:</strong> ${coupon || 'なし'}</p>
            <p style="margin: 5px 0;"><strong>■ 備考:</strong> ${notes || 'なし'}</p>
          </div>
          <p>管理画面を確認し、店舗からお客様へご連絡の上、ご対応をお願いいたします。</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('メール送信エラー:', error);
    return NextResponse.json({ error: 'メール送信に失敗しました' }, { status: 500 });
  }
}