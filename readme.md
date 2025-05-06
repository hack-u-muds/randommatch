# 🎮 Casuvo

「やりたいゲーム」でマッチしてすぐ通話！  
**ゲームをきっかけに声でつながる、手軽なボイスマッチングアプリ**です。



---

## 📝 概要

Casuvoは、ユーザーが遊びたいゲームを選ぶだけで、**自動的に他のユーザーとマッチングし、音声通話が開始される**Webアプリです。  
**SkyWay**を使ったブラウザ音声通話により、インストール不要・すぐ話せる体験を実現しました。

このアプリは、ハッカソン「Hack U Osaka2024」で制作されました。

---


## 📦 主な機能

- 🎮 ゲームを選ぶだけでルームが作成され、マッチング開始
- 🔊 SkyWayを使ったP2P音声通話（ブラウザだけで通話OK）
- ⚡️ 人気が少ないゲームでも素早くマッチ

---

## 🛠️ 技術スタック

- フロントエンド: HTML / CSS / JavaScript
- 音声通話: [SkyWay JS SDK](https://github.com/skyway/skyway-js-sdk)
- 開発: VS Code

---

## 🚀 使い方（開発中ビルドで試す場合）

```bash
git clone https://github.com/hack-u-muds/randommatch.git
cd randommatch
pip install -r requirements.txt


npm install

npm run dev

cd game_chat_board
python app.py