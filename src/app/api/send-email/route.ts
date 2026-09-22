import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, userName, spaceName, date, startTime, endTime, price } = body

    // Resendの無料プラン制限に対応するため、登録済みアドレス1件に送信し、Gmail側で転送する
    const adminEmail = 'kindafighters27@gmail.com'

    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [adminEmail],
      subject: `【新規仮予約】${spaceName} - ${userName}様`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #059669;">新しい予約申し込み（仮予約）がありました。</h2>
          <p>以下の内容で予約リクエストが届いています。内容を確認の上、お客様へ手動でご対応をお願いします。</p>
          
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>スペース:</strong> ${spaceName}</p>
            <p><strong>お名前:</strong> ${userName}</p>
            <p><strong>お客様メールアドレス:</strong> ${to}</p>
            <p><strong>予約日:</strong> ${date}</p>
            <p><strong>利用時間:</strong> ${startTime} 〜 ${endTime}</p>
            <p><strong>料金:</strong> ¥${price?.toLocaleString()}</p>
          </div>

          <p style="font-size: 12px; color: #666;">
            ※このシステム通知は kindafighters27@gmail.com に届き、転送設定により senndouiorin@gmail.com へ共有されます。<br>
            ※お客様への確定メールは、上記のお客様アドレス宛に手動で送信してください。
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('メール送信エラー:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}