import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userName, userEmail, date, startTime, endTime, duration, price } = body

    // kindafighters27@gmail.com と sendouiorin@gmail.com の両方に送信
    const data = await resend.emails.send({
      from: 'COCOKARA レンタルスペース <onboarding@resend.dev>',
      to: ['kindafighters27@gmail.com', 'sendouiorin@gmail.com'],
      subject: `【新規予約】${date} ${startTime}〜${endTime} (${userName}様)`,
      html: `
        <h2>新しい予約が入りました</h2>
        <p><strong>お名前:</strong> ${userName} 様</p>
        <p><strong>メールアドレス:</strong> ${userEmail}</p>
        <p><strong>予約日:</strong> ${date}</p>
        <p><strong>利用時間:</strong> ${startTime} 〜 ${endTime} （${duration}時間）</p>
        <p><strong>予想料金:</strong> ¥${price.toLocaleString()}</p>
        <hr />
        <p>管理者ページより詳細をご確認ください。</p>
      `,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 })
  }
}