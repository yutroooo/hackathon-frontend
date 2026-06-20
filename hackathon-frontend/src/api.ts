const BASE_URL = "https://hackathon-backend-qu42ojye7a-uc.a.run.app/api";

// ☁️ Cloudinaryの設定
const CLOUDINARY_CLOUD_NAME = "dto3wxyxc";
const CLOUDINARY_UPLOAD_PRESET = "hackathon_upload";

// バックエンド（Go）の型定義とシンクロさせたTypeScriptの型
export interface AuthResponse {
    token: string;
    user_id: string;
    name: string;
}

export interface ErrorResponse {
    error: string;
}

// 共通のフェッチヘルパー（自動でContent-Typeを付与し、ログイン時のトークンを乗せる）
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const token = localStorage.getItem("auth_token");

    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const errorData: ErrorResponse = await response.json().catch(() => ({ error: "予期せぬエラーが発生しました" }));
        throw new Error(errorData.error);
    }

    return response.json() as Promise<T>;
}

// ========================================================
// 🎯 各画面から呼び出すAPI関数一覧（すべてここ1つに集約！）
// ========================================================
export const api = {
    // 🔐 認証系
    register: (data: any) => apiRequest<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login: (data: any) => apiRequest<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

    // 📦 商品系
    getItems: () => apiRequest<any[]>("/items", { method: "GET" }),

    // 🎯 画像URL対応版＆apiRequestヘルパーでスッキリさせた出品関数
    createItem: (item: {
        title: string;
        description: string;
        category: string;
        initial_price: number;
        seller_id: string;
        image_url?: string; // 画像URLを追加
    }) => apiRequest<any>("/items", { method: "POST", body: JSON.stringify(item) }),

    getAISuggest: (imageUrls: string[]) => apiRequest<any>("/items/ai-suggest", { method: "POST", body: JSON.stringify({ image_urls: imageUrls }) }),

    // 💬 チャット系
    createRoom: (itemId: string, type: string) => apiRequest<any>("/rooms", { method: "POST", body: JSON.stringify({ item_id: itemId, type }) }),
    getMessages: (roomId: string) => apiRequest<any[]>(`/rooms/messages?room_id=${roomId}`, { method: "GET" }),
    sendMessage: (roomId: string, senderId: string, message: string) =>
        apiRequest<any>(`/rooms/messages?room_id=${roomId}`, { method: "POST", body: JSON.stringify({ sender_id: senderId, message }) }),

    // 📸 新規追加：画像をCloudinaryにアップロードして公開URLを取得する関数
    uploadImage: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!res.ok) {
            throw new Error("画像のアップロードに失敗しました");
        }

        const data = await res.json();
        return data.secure_url; // これが画像の公開URL！
    },
};