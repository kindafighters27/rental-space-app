import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ space_id?: string; date?: string }>
}) {
  const params = await searchParams
  const spaceId = params.space_id
  const date = params.date

  // スペース情報の取得
  let space = null
  if (spaceId) {
    const { data } = await supabase
      .from('spaces')
      .select('*')
      .eq('id', spaceId)
      .single()
    space = data
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-800">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
          ← カレンダーに戻る
        </Link>

        <h1 className="text-xl font-bold mb-4">予約申し込み</h1>

        {space ? (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h2 className="font-bold text-gray-800">{space.name}</h2>
            <p className="text-sm text-gray-600 mt-1">
              料金: ¥{Number(space.price_per_hour).toLocaleString()} / 時間
            </p>
            <p className="text-sm font-bold text-emerald-600 mt-2">
              選択日: {date}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">スペース情報が見つかりません。</p>
        )}

        {/* 簡易予約入力フォーム */}
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              お名前
            </label>
            <input
              type="text"
              placeholder="山田 太郎"
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              利用時間帯
            </label>
            <select className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option>10:00 〜 12:00</option>
              <option>12:00 〜 14:00</option>
              <option>14:00 〜 16:00</option>
              <option>16:00 〜 18:00</option>
              <option>18:00 〜 20:00</option>
            </select>
          </div>

          <button
            type="button"
            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition"
          >
            予約を確定する
          </button>
        </form>
      </div>
    </main>
  )
}