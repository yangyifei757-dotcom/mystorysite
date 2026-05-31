import { supabase } from '@/lib/supabaseClient'

export default async function DebugPage() {
  // 1. 测试数据库连接
  const { data: novels, error } = await supabase
    .from('novels')
    .select('id, title, status')

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl text-yellow-400 mb-4">🔍 Database Debug</h1>

      {error ? (
        <div className="bg-red-900 p-4 rounded">
          <p className="text-red-300 font-bold">Database Error:</p>
          <pre className="text-sm mt-2">{error.message}</pre>
          <p className="text-xs mt-2 text-red-400">Hint: {error.hint}</p>
        </div>
      ) : novels?.length === 0 ? (
        <p className="text-orange-400">⚠️ The `novels` table is empty. No rows found.</p>
      ) : (
        <div>
          <p className="text-green-400 mb-4">✅ Found {novels.length} novel(s):</p>
          <table className="w-full text-left border border-gray-700">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-2">Title</th>
                <th className="p-2">Status</th>
                <th className="p-2">Will Show?</th>
              </tr>
            </thead>
            <tbody>
              {novels.map((n: any) => (
                <tr key={n.id} className="border-b border-gray-800">
                  <td className="p-2">{n.title}</td>
                  <td className="p-2">
                    <code className="bg-gray-800 px-2 py-1 rounded text-sm">{JSON.stringify(n.status)}</code>
                  </td>
                  <td className="p-2">
                    {n.status === 'published' ? (
                      <span className="text-green-400">✅ Yes</span>
                    ) : (
                      <span className="text-red-400">❌ No (must be exactly "published")</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-900 rounded">
        <p className="text-gray-400 text-sm">
          If the table shows your novels but status is not <code>"published"</code>, 
          go to Supabase Table Editor → novels → change the <code>status</code> column to <code>published</code> (no quotes).
        </p>
        <p className="text-gray-400 text-sm mt-2">
          If you see a <strong>Database Error</strong>, check that RLS is disabled on the novels table 
          (Authentication → Policies → novels → Disable RLS).
        </p>
      </div>
    </div>
  )
}
