import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userName, userEmail, date, startTime, endTime, price } = body

    // duration（利用時間）がデータに含まれていない場合の安全対策
    const startH = parseInt(startTime?.split(':')[0] || '0')
    const endH = parseInt(endTime?.split(':')[0] || '0')
    const calculatedDuration = endH >= startH ? endH - startH : (endH + 24) - startH

    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: ['kindafighters27@gmail.com', 'senndouiorin@gmail.com'], // お二人だけに通知を送る
      subject: `【COCOKARA】新規の予約が入りました (${date} ${startTime}〜)`,
      html: `
        <h2>新規の予約申し込みがありました</h2>
        <p><strong>予約者のお名前:</strong> ${userName} 様</p>
        <p><strong>予約者のメール:</strong> ${userEmail}</p>
        <hr />
        <p><strong>予約日:</strong> ${date}</p>
        <p><strong>利用時間:</strong> ${startTime} 〜 ${endTime} (約${calculatedDuration}時間)</p>
        <p><strong>予定料金:</strong> ¥${price ? price.toLocaleString() : '0'}</p>
      `,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('メール送信エラー:', error)
    return NextResponse.json({ success: false, error }, { status: 500 })
  }
}