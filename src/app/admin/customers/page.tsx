'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'latest' | 'count' | 'name'>('latest')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .neq('status', 'cancelled')
      .order('date', { ascending: false })

    if (error) {
      console.error('顧客データ取得エラー:', error)
      setLoading(false)
      return
    }

    // メールアドレスまたは名前をキーにして顧客ごとに集計
    const customerMap = new Map()

    data?.forEach((b) => {
      const key = b.email || b.user_name
      if (!key) return

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          name: b.user_name,
          email: b.email || '未登録',
          totalBookings: 0,
          totalSpent: 0,
          lastBookingDate: b.date,
        })
      }

      const customer = customerMap.get(key)
      customer.totalBookings += 1
      customer.totalSpent += b.total_price || 0
      
      // より新しい日付があれば更新
      if (b.date > customer.lastBookingDate) {
        customer.lastBookingDate = b.date
      }
    })

    let customerList = Array.from(customerMap.values())

    // ソート処理
    applySorting(customerList, sortBy)
    setLoading(false)
  }

  const applySorting = (list: any[], type: 'latest' | 'count' | 'name') => {
    if (type === 'latest') {
      list.sort((a, b) => b.lastBookingDate.localeCompare(a.lastBookingDate))
    } else if (type === 'count') {
      list.sort((a, b) => b.totalBookings - a.totalBookings)
    } else if (type === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'ja'))
    }
    setCustomers([...list])
  }

  const handleSortChange = (type: 'latest' | 'count' | 'name') => {
    setSortBy(type)
    applySorting(customers, type)
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 pb-12">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-lg font-bold text-gray-900">顧客リスト（顧客管理）</h1>
        <div className="flex space-x-3">
          <Link href="/admin" className="bg-gray-200 hover:bg-gray-300 font-bold px-4 py-2 rounded-xl text-xs transition">
            予約一覧へ戻る
          </Link>
          <button onClick={fetchCustomers} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm">
            更新
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        {/* 並び替えコントロールバー */}
        <div className="flex items-center space-x-2 mb-6">
          <span className="text-xs font-bold text-gray-600">並び替え:</span>
          <button
            onClick={() => handleSortChange('latest')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${sortBy === 'latest' ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
          >
            最近の予約日
          </button>
          <button
            onClick={() => handleSortChange('count')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${sortBy === 'count' ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
          >
            総予約回数
          </button>
          <button
            onClick={() => handleSortChange('name')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${sortBy === 'name' ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
          >
            お名前順
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">読み込み中...</div>
        ) : customers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-500 shadow-sm border border-gray-200">
            現在、登録されている顧客データはありません。
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-gray-600">
                    <th className="p-4 font-bold">お名前</th>
                    <th className="p-4 font-bold">メールアドレス</th>
                    <th className="p-4 font-bold">総予約回数</th>
                    <th className="p-4 font-bold">利用総額</th>
                    <th className="p-4 font-bold">直近の予約日</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customers.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-gray-900">{c.name}</td>
                      <td className="p-4 text-gray-600">{c.email}</td>
                      <td className="p-4 font-semibold">{c.totalBookings} 回</td>
                      <td className="p-4 font-bold text-emerald-600">¥{c.totalSpent.toLocaleString()}</td>
                      <td className="p-4 text-gray-600">{c.lastBookingDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}