'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Booking = {
  id: string
  space_id: string
  user_name: string
  user_email: string
  booking_date: string
  start_time: string
  end_time: string
  created_at: string
  space_name?: string
}

type Space = {
  id: string
  name: string
  description: string
  price_per_hour: number
  image_url: string
}

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)

  // 新規スペース入力用の状態
  const [newSpaceName, setNewSpaceName] = useState('')
  const [newSpaceDesc, setNewSpaceDesc] = useState('')
  const [newSpacePrice, setNewSpacePrice] = useState(3000)
  const [newSpaceImage, setNewSpaceImage] = useState('/space1.JPG')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    // 1. スペース一覧を取得
    const { data: spacesData, error: spaceError } = await supabase
      .from('COCOKARA予約アプリ')
      .select('*')

    if (spaceError) console.error('Error fetching spaces:', spaceError)
    else setSpaces(spacesData || [])

    // 2. 予約一覧を取得
    const { data: bookingsData, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .order('booking_date', { ascending: true })

    if (bookingError) {
      console.error('Error fetching bookings:', bookingError)
    } else {
      const spacesMap = new Map((spacesData || []).map((s) => [s.id, s.name]))
      const formattedBookings = (bookingsData || []).map((b) => ({
        ...b,
        space_name: spacesMap.get(b.space_id) || '不明なスペース',
      }))
      setBookings(formattedBookings)
    }

    setLoading(false)
  }

  // 予約の削除
  const handleDeleteBooking = async (id: string) => {
    if (!confirm('この予約を削除してもよろしいですか？')) return
    const { error } = await supabase.from('bookings').delete().eq('id', id)
    if (error) alert('削除に失敗しました')
    else setBookings(bookings.filter((b) => b.id !== id))
  }

  // スペースの新規登録
  const handleAddSpace = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { error } = await supabase.from('COCOKARA予約アプリ').insert([
      {
        name: newSpaceName,
        description: newSpaceDesc,
        price_per_hour: Number(newSpacePrice),
        image_url: newSpaceImage,
      },
    ])

    setIsSubmitting(false)

    if (error) {
      console.error('Space insert error:', error)
      alert('スペースの追加に失敗しました。RLSポリシー等を確認してください。')
    } else {
      alert('新しいスペースを追加しました！')
      setNewSpaceName('')
      setNewSpaceDesc('')
      setNewSpacePrice(3000)
      fetchData() // 再読み込み
    }
  }

  // スペースの削除
  const handleDeleteSpace = async (id: string) => {
    if (!confirm('このスペースを削除してもよろしいですか？（紐づく予約も削除されます）')) return
    const { error } = await supabase.from('COCOKARA予約アプリ').delete().eq('id', id)
    if (error) alert('削除に失敗しました')
    else fetchData()
  }

  return (
    <main className="p-8 max-w-6xl mx-auto min-h-screen text-white space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">COCOKARA 予約・スペース管理画面</h1>
        <a
          href="/"
          className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 px-4 rounded-lg transition"
        >
          ← トップページへ戻る
        </a>
      </div>

      {/* 1. 予約一覧セクション */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-blue-400">📅 現在の予約一覧</h2>
        {loading ? (
          <p className="text-gray-400">読み込み中...</p>
        ) : bookings.length === 0 ? (
          <p className="text-gray-400 bg-gray-900 p-4 rounded-xl border border-gray-800">現在予約はありません。</p>
        ) : (
          <div className="overflow-x-auto bg-gray-900 border border-gray-700 rounded-xl shadow-md">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-800 text-gray-400 uppercase border-b border-gray-700">
                <tr>
                  <th className="py-3 px-4">利用日</th>
                  <th className="py-3 px-4">時間</th>
                  <th className="py-3 px-4">スペース名</th>
                  <th className="py-3 px-4">お名前</th>
                  <th className="py-3 px-4">連絡先</th>
                  <th className="py-3 px-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-800/50">
                    <td className="py-3 px-4 font-bold text-blue-400">{booking.booking_date}</td>
                    <td className="py-3 px-4">{booking.start_time} 〜 {booking.end_time}</td>
                    <td className="py-3 px-4 font-semibold">{booking.space_name}</td>
                    <td className="py-3 px-4">{booking.user_name}</td>
                    <td className="py-3 px-4 text-gray-400">{booking.user_email}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        className="bg-red-900/50 hover:bg-red-800 text-red-300 text-xs font-bold py-1 px-3 rounded transition"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 2. スペース登録・管理セクション */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* スペース追加フォーム */}
        <div className="md:col-span-1 bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 text-green-400">➕ 新規スペース登録</h2>
          <form onSubmit={handleAddSpace} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">スペース名</label>
              <input
                type="text"
                required
                placeholder="例: COCOKARA 2号店"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">説明文</label>
              <textarea
                required
                rows={3}
                placeholder="スペースの概要を入力"
                value={newSpaceDesc}
                onChange={(e) => setNewSpaceDesc(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">料金 (円/6時間)</label>
              <input
                type="number"
                required
                value={newSpacePrice}
                onChange={(e) => setNewSpacePrice(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">画像URL / パス</label>
              <input
                type="text"
                value={newSpaceImage}
                onChange={(e) => setNewSpaceImage(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg transition text-sm"
            >
              {isSubmitting ? '登録中...' : 'スペースを追加'}
            </button>
          </form>
        </div>

        {/* 登録済みスペース一覧 */}
        <div className="md:col-span-2 bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 text-purple-400">🏠 登録済みスペース一覧</h2>
          <div className="space-y-4">
            {spaces.map((space) => (
              <div key={space.id} className="flex justify-between items-center bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div>
                  <h3 className="font-bold text-lg">{space.name}</h3>
                  <p className="text-xs text-gray-400">{space.description}</p>
                  <p className="text-sm font-semibold text-blue-400 mt-1">¥{space.price_per_hour?.toLocaleString()} / 6時間</p>
                </div>
                <button
                  onClick={() => handleDeleteSpace(space.id)}
                  className="bg-red-900/50 hover:bg-red-800 text-red-300 text-xs font-bold py-1.5 px-3 rounded transition ml-4"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}