import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, userName, spaceName, date, startTime, endTime, price } = body

    // 管理者2名のアドレス
    const adminEmails = ['kindafighters27@gmail.com', 'senndouiorin@gmail.com']

    // お客様には送らず、管理者2名にのみ「新規仮予約のお知らせ」メールを送信する
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev', // またはご自身の認証済みドメイン
      to: adminEmails,
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
            ※このメールはレンタルスペース予約システムからの自動通知です。<br>
            ※お客様への確定メールは、上記のアドレス宛に手動で送信してください。
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