import { useState, useEffect } from "react";
import { api } from "./api";
import "./index.css";

export default function App() {
  // ========================================================
  // 🪵 1. すべての useState を最上階に集結
  // ========================================================

  // 🔐 認証系
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ name: string; id: string } | null>(null);

  // 📦 商品系
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [testImageUrl, setTestImageUrl] = useState("https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop");

  // 💬 チャット系
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // ========================================================
  // ⚙️ 2. 関数ロジックの定義
  // ========================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    error && setError("");
    setLoading(true);
    try {
      if (isLogin) {
        const res = await api.login({ email, password });
        localStorage.setItem("auth_token", res.token);
        localStorage.setItem("user_id", res.user_id);
        setUser({ name: res.name, id: res.user_id });
      } else {
        const res = await api.register({ name, email, password });
        localStorage.setItem("auth_token", res.token);
        localStorage.setItem("user_id", res.user_id);
        setUser({ name: res.name, id: res.user_id });
      }
    } catch (err: any) {
      setError(err.message || "通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setEmail("");
    setPassword("");
    setName("");
    setItems([]);
    setActiveRoomId(null);
    setSelectedItem(null);
  };

  const fetchItems = async () => {
    try {
      const data = await api.getItems();
      setItems(data);
    } catch (err: any) {
      alert("商品一覧の取得に失敗: " + err.message);
    }
  };

  const handleAiSuggest = async () => {
    setAiLoading(true);
    try {
      const res = await api.getAISuggest([testImageUrl]);
      setTitle(res.title || "");
      setPrice(res.recommended_price ? String(res.recommended_price) : "");
      setDescription(res.description || "");
    } catch (err: any) {
      alert("AI提案の取得に失敗: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // 🎯 Goのハンドラー(handleCreateItem)の必須チェックを絶対に突破する出品関数
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const loggedInUserId = localStorage.getItem("user_id") || "";

    try {
      // Go側の req.SellerID, req.Title, req.InitialPrice の全表記揺れを網羅！
      await api.createItem({
        title: title,
        description: description,
        category: "一般",

        // 💰 価格チェック（req.InitialPrice <= 0 対策のトリプル防衛）
        initial_price: Number(price), // 本命スネークケース
        initialPrice: Number(price),  // キャメルケース
        InitialPrice: Number(price),  // Goフィールド名そのまま
        price: Number(price),
        current_price: Number(price),

        // 👤 出品者IDチェック（req.SellerID 対策）
        seller_id: loggedInUserId, // 本命スネークケース
        sellerId: loggedInUserId,  // キャメルケース
        SellerID: loggedInUserId,  // Goフィールド名そのまま
        user_id: loggedInUserId,
      });

      alert("出品が完了しました！");
      setTitle("");
      setPrice("");
      setDescription("");
      fetchItems(); // 一覧を再更新
    } catch (err: any) {
      alert("出品に失敗: " + err.message);
    }
  };

  const handleOpenChat = async (item: any) => {
    try {
      const res = await api.createRoom(item.id, "negotiation");
      setActiveRoomId(res.room_id);
      setSelectedItem(item);
      const msgData = await api.getMessages(res.room_id);
      setMessages(msgData);
    } catch (err: any) {
      alert("チャット部屋の起動に失敗: " + err.message);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoomId || !user) return;

    const userMsg = newMessage;
    setNewMessage("");
    setChatLoading(true);

    try {
      await api.sendMessage(activeRoomId, user.id, userMsg);
      const updatedMsgs = await api.getMessages(activeRoomId);
      setMessages(updatedMsgs);
      fetchItems();
    } catch (err: any) {
      alert("メッセージの送信に失敗: " + err.message);
    } finally {
      setChatLoading(false);
    }
  };

  const refreshChat = async () => {
    if (!activeRoomId) return;
    const updatedMsgs = await api.getMessages(activeRoomId);
    setMessages(updatedMsgs);
  };

  // 最初の読み込みトリガー（ログイン時に1回だけキレイに実行）
  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  // ========================================================
  // 🎨 3. 画面レンダリング（HTML部分）
  // ========================================================

  if (user) {
    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
          {/* ヘッダー */}
          <div className="max-w-7xl mx-auto bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center mb-8">
            <div>
              <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600">
                AIフリマ 取引ダッシュボード
              </h1>
              <p className="text-xs text-slate-500">ログイン中: {user.name} さん</p>
            </div>
            <button onClick={handleLogout} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl transition">
              ログアウト
            </button>
          </div>

          {/* メインコンテンツ（2カラム構成に変更してスッキリさせます） */}
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* 🛠️ 左カラム：AI出品サポート（全体の35%） */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 h-fit">
              <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">✨ AI高速出品サポート</h2>
              <div className="mb-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                <label className="block text-[10px] font-bold text-indigo-700 mb-1">検証用画像URL</label>
                <input type="text" value={testImageUrl} onChange={(e) => setTestImageUrl(e.target.value)} className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg mb-2" />
                <button type="button" onClick={handleAiSuggest} disabled={aiLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1.5 rounded-lg text-[11px] transition disabled:opacity-50">
                  {aiLoading ? "Gemini鑑定中..." : "🔮 出品情報を自動生成"}
                </button>
              </div>
              <form onSubmit={handleCreateItem} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">商品名</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">希望価格 (円)</label>
                  <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">商品説明</label>
                  <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                </div>
                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 rounded-lg text-xs transition">🚀 この内容で出品</button>
              </form>
            </div>

            {/* 📦 右カラム：出品中の商品一覧（全体の65%に広げて見やすく！） */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-slate-800">📦 タイムラインマーケット</h2>
                <button onClick={fetchItems} className="text-xs text-indigo-600 hover:underline">🔄 更新</button>
              </div>
              {items.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-8">商品がありません。左側から出品してみましょう！</p>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item: any) => (
                        <div key={item.id} className="p-4 border border-slate-100 bg-slate-50/50 rounded-xl flex flex-col justify-between hover:shadow-md hover:border-slate-200 transition-all duration-200">
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{item.title}</h3>
                            {/* 👤 優先度①でバチッと追加した出品者バッジ */}
                            <div className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md mt-1 font-bold">
                              👤 出品者: {item.seller_name || "不明なユーザー"}
                            </div>
                            <p className="text-slate-500 text-[11px] mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                      <span className="font-extrabold text-slate-900 text-sm">
                        ¥{(item.current_price || item.initial_price || 0).toLocaleString()}
                      </span>
                            {/* 🎯 優先度②：「DMを送る」という直球文言に変更！ */}
                            <button onClick={() => handleOpenChat(item)} className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-bold text-[11px] px-3 py-2 rounded-xl transition shadow-sm flex items-center gap-1">
                              💬 出品者にDMを送る
                            </button>
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </div>
          </div>



          {activeRoomId && selectedItem && (
              // 映画館のように周りをしっかり暗く(bg-slate-950/80)し、ブラーを強め(backdrop-blur-md)にして中央を際立たせる！
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8 animate-fade-in">

                {/* 横幅を max-w-5xl (約1000px)、高さを 88vh に爆広げ！ 影も最大級(shadow-[0_30px_100px...])にして浮き出させます */}
                <div className="bg-white w-full max-w-5xl h-[88vh] rounded-[32px] shadow-[0_30px_100px_-15px_rgba(0,0,0,0.3)] border border-slate-200/60 flex flex-col overflow-hidden animate-slide-up transform transition-all">

                  {/* モーダルヘッダー：グラデーションでリッチに */}
                  <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-cyan-50/20 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-cyan-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-200">
                        💬
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-extrabold text-slate-800 text-base">{selectedItem.seller_name || "出品者"} へのダイレクトメッセージ</span>
                          <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-black tracking-wider shadow-sm animate-pulse">● AI自動応答中</span>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          対象商品: <span className="text-slate-700 font-bold">「{selectedItem.title}」</span>
                          （現在の提示価格: <span className="text-indigo-600 font-extrabold text-sm">¥{(selectedItem.current_price || selectedItem.initial_price || 0).toLocaleString()}</span>）
                        </p>
                      </div>
                    </div>
                    {/* 閉じるボタンも押しやすく大きく */}
                    <button onClick={() => { setActiveRoomId(null); setSelectedItem(null); }} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200 text-lg font-bold shadow-sm">
                      ✕
                    </button>
                  </div>

                  {/* チャットメッセージのタイムライン：フォントを少し大きく、余白をリッチに */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/40">
                    {messages.map((msg: any) => {
                      const isMe = msg.sender_id === user.id;

                      return (
                          <div
                              key={msg.id}
                              className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-in`}
                          >
                            <div
                                className={`max-w-[75%] rounded-2xl px-5 py-3 text-sm shadow-sm leading-relaxed ${
                                    isMe
                                        ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none"
                                        : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
                                }`}
                            >
                              <div className="text-[10px] opacity-60 mb-1 font-black tracking-wider">
                                {isMe ? "あなた（購入希望者）" : `${selectedItem.seller_name || "出品者"} (AI代行)`}
                              </div>
                              <p className="font-medium whitespace-pre-wrap">{msg.message}</p>
                            </div>
                          </div>
                      );
                    })}
          {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-400 border border-slate-100 rounded-2xl rounded-bl-none px-5 py-3 text-sm animate-pulse font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                  {selectedItem.seller_name || "出品者"}のAIがDMを入力中...
                </div>
              </div>
          )}
        </div>

    {/* フッター：送信フォーム（高さを持たせてリッチなUIに） */}
    <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex gap-3 items-center">
      <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="価格のご相談や、商品についての質問をDMしてみましょう！" className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-semibold shadow-inner" />
      <button type="submit" disabled={chatLoading} className="bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-3.5 rounded-2xl text-sm transition-all duration-200 disabled:opacity-50 shadow-md flex items-center gap-1.5 active:scale-95">
        DM送信 🚀
      </button>
    </form>

  </div>
  </div>
  )}
        </div>
    );
  }

  // 🚪 未ログイン時のサインイン / 会員登録画面
  return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600 tracking-tight">AIフリマアプリ</h1>
            <p className="text-slate-400 text-xs mt-1">ハッカソン・プロトタイプ v1.0</p>
            <h2 className="text-xl font-bold text-slate-800 mt-4">{isLogin ? "アカウントにログイン" : "新しく会員登録"}</h2>
          </div>
          {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl font-medium">⚠️ {error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">お名前</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="山田 太郎" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
                </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">メールアドレス</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">パスワード</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-medium py-3 rounded-xl shadow-md shadow-indigo-100 hover:shadow-lg transition duration-200 disabled:opacity-50 text-sm mt-2">
              {loading ? "通信中..." : isLogin ? "ログインする" : "登録して始める"}
            </button>
          </form>
          <div className="text-center mt-6 pt-4 border-t border-slate-100">
            <button onClick={() => { setIsLogin(!isLogin); setError(""); }} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition">
              {isLogin ? "まだアカウントをお持ちでない方はこちら" : "すでにアカウントをお持ちの方はこちら"}
            </button>
          </div>
        </div>
      </div>
  );
}