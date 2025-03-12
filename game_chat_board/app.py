from flask import Flask, render_template, request, redirect, url_for, send_from_directory
from flask_sqlalchemy import SQLAlchemy
import os

app = Flask(__name__)

# データベースのURIを設定
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# SQLAlchemyのインスタンスを作成
db = SQLAlchemy(app)

# 📌 投稿モデル（ルーム名と募集要項を保存）
class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    room_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)

# 📌 初回起動時にデータベースを作成
with app.app_context():
    db.create_all()

# 📌 `sns.html` をトップページに変更
@app.route("/")
@app.route("/sns")
def sns():
    posts = Post.query.all()  # すべての投稿を取得
    return render_template("sns.html", posts=posts)

# 📌 新しい投稿を追加
@app.route("/add", methods=["POST"])
def add_post():
    room_name = request.form.get("room_name")
    description = request.form.get("description")

    if room_name and description:
        new_post = Post(room_name=room_name, description=description)
        db.session.add(new_post)
        db.session.commit()
    
    return redirect(url_for("sns"))

# 📌 投稿を削除
@app.route("/delete/<int:post_id>", methods=["POST"])
def delete_post(post_id):
    post = Post.query.get(post_id)
    if post:
        db.session.delete(post)
        db.session.commit()
    
    return redirect(url_for("sns"))

# 読み込むためのカスタムルート
@app.route('/templates/style.css')
def style_css():
    return send_from_directory(os.path.join('templates'), 'style.css')

if __name__ == "__main__":
    app.run(debug=True)