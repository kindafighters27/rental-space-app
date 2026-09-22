import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userName, userEmail, date, startTime, endTime, duration, price } = body

    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [userEmail, 'kindafighters27@gmail.com'],
      subject: `【COCOKARA】仮予約を受け付けました (${date} ${startTime}〜)`,
      html: `
        <h2>仮予約を受け付けました</h2>
        <p><strong>お名前:</strong> ${userName} 様</p>
        <p><strong>メールアドレス:</strong> ${userEmail}</p>
        <p><strong>予約日:</strong> ${date}</p>
        <p><strong>利用時間:</strong> ${startTime} 〜 ${endTime} (${duration}時間)</p>
        <p><strong>予定料金:</strong> ¥${price.toLocaleString()}</p>
        <hr />
        <p>仮予約ありがとうございます。入力されたメールアドレスにメールを送りますので、それで予約完了とさせて頂きます。</p>
      `,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 })
  }
}