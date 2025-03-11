from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import random
import os

app = FastAPI()

# CORS対応（ローカル環境での開発用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5001", "http://0.0.0.0:5001"],  # クライアントのURLを指定
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静的ファイルの提供（srcディレクトリをマウント）
app.mount("/static", StaticFiles(directory="src"), name="static")

# ゲームごとの待機リスト
waiting_users = {}

@app.post("/match")
async def match_game(data: dict):
    game = data["game"]
    
    if game not in waiting_users:
        waiting_users[game] = []

    # 既に待機しているユーザーがいればマッチング
    if waiting_users[game]:
        room_name = f"{game}-{random.randint(1000, 9999)}"
        waiting_users[game].pop(0)
        return {"roomName": room_name}
    
    # いなければ待機リストに追加
    waiting_users[game].append("user")
    return {"roomName": None}

# `index.html` を提供するエンドポイント
@app.get("/")
async def read_index():
    return FileResponse(os.path.join(os.getcwd(), "src/index.html"))

# `match.html` を提供するエンドポイント
@app.get("/match.html")
async def read_match():
    return FileResponse(os.path.join(os.getcwd(), "src/match.html"))

# `call.html` を提供するエンドポイント
@app.get("/call.html")
async def read_call():
    return FileResponse(os.path.join(os.getcwd(), "src/call.html"))

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)