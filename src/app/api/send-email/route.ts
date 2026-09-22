import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// Resendを利用したメール送信API
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, booking, userEmail } = body

    let subject = ''
    let htmlContent = ''

    if (type === 'cancel') {
      subject = '【COCOKARA】お客様による予約キャンセルのお知らせ'
      htmlContent = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #e11d48;">予約キャンセルのお知らせ</h2>
          <p>お客様の手により以下の予約がキャンセルされました。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p><strong>予約日:</strong> ${booking.date}</p>
          <p><strong>時間:</strong> ${booking.start_time?.slice(0, 5)} 〜 ${booking.end_time?.slice(0, 5)}</p>
          <p><strong>お名前:</strong> ${booking.user_name}</p>
          <p><strong>メールアドレス:</strong> ${booking.email}</p>
          <p><strong>利用料金:</strong> ¥${(booking.total_price || 0).toLocaleString()}</p>
        </div>
      `
    } else {
      // 予約時の通知（既存機能）
      subject = '【COCOKARA】新規ご予約受付のお知らせ'
      htmlContent = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #059669;">新しい予約が入りました！</h2>
          <p><strong>予約日:</strong> ${booking.date}</p>
          <p><strong>時間:</strong> ${booking.start_time?.slice(0, 5)} 〜 ${booking.end_time?.slice(0, 5)}</p>
          <p><strong>お名前:</strong> ${booking.user_name}</p>
          <p><strong>メールアドレス:</strong> ${booking.email}</p>
          <p><strong>利用料金:</strong> ¥${(booking.total_price || 0).toLocaleString()}</p>
        </div>
      `
    }

    const data = await resend.emails.send({
      from: 'COCOKARA レンタルスペース <onboarding@resend.dev>',
      to: ['kindafighters27@gmail.com'],
      subject: subject,
      html: htmlContent,
    })

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('メール送信エラー:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}