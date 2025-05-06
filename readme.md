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

---

## 🔐 SkyWay APIキーの設定

このアプリは [SkyWay](https://skyway.ntt.com/) を利用して音声通話を実現しています。  
**動作させるにはSkyWayの開発者アカウントを作成し、APIキーとApp IDを取得する必要があります。**

以下の手順で設定してください：

1. [SkyWay公式サイト](https://skyway.ntt.com/) にアクセスしてログイン
2. プロジェクトを作成し、App ID と Secret Key を取得
3. ルートディレクトリに `.env` ファイルを作成し、以下のように記述：

```env
SKYWAY_APP_ID=あなたのApp ID
SKYWAY_SECRET=あなたのSecret Key

# 📄 LICENSE

MIT License

Copyright (c) 2025 muds Team

Permission is hereby granted, free of charge, to any person obtaining a copy  
of this software and associated documentation files (the "Software"), to deal  
in the Software without restriction, including without limitation the rights  
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell  
copies of the Software, and to permit persons to whom the Software is  
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in  
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR  
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE  
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER  
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,  
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN  
THE SOFTWARE.

# ⚠️ 注意事項

- 本アプリケーションはハッカソン「Hack U Osaka2024」にて制作された**プロトタイプ**です。
- 本プロジェクトに含まれるAPIキーやシークレットは、**各自でSkyWayから取得して`.env`に設定してください。**
- サードパーティのAPI・画像・音声などを利用している場合は、それぞれのライセンスに基づきご利用ください。
- 本ソフトウェアは「現状のまま」提供されており、明示または黙示を問わず**いかなる保証も行いません**。
