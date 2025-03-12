import { nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, uuidV4 } from "@skyway-sdk/room";

// SkyWayのトークン設定
const token = new SkyWayAuthToken({
  jti: uuidV4(),
  iat: nowInSec(),
  exp: nowInSec() + 60 * 60 * 24,
  version: 3,
  scope: {
    appId: "d285f445-d39c-4b97-8bba-8381f027279e",
    rooms: [{ name: "*", methods: ["create", "close", "updateMetadata"], member: { name: "*", methods: ["publish", "subscribe", "updateMetadata"] } }]
  }
}).encode("/Ic9tG1SNhXYfESb3aPLBl8UdXZInffQrN5yqwir+yE=");

// ✅ 日本語のときだけ Base64 エンコード
const encodeText = (text) => {
  const containsJapanese = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(text);
  return containsJapanese ? btoa(unescape(encodeURIComponent(text))) : text;
};

const decodeText = (encoded) => {
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    return encoded;
  }
};

(async () => {
  const localVideo = document.getElementById("local-video");
  const buttonArea = document.getElementById("button-area");
  const remoteMediaArea = document.getElementById("remote-media-area");
  const myId = document.getElementById("my-id");
  const gameInput = document.getElementById("game-name");
  const userNameInput = document.getElementById("user-name");
  const createRoomButton = document.getElementById("create-room");
  const joinedRoomName = document.getElementById("joined-room-name");
  const roomUsersList = document.getElementById("room-users");
  const roomList = document.getElementById("room-list");


  let currentRoom = null;
  let currentMember = null;

  // 🎥 音声・ビデオストリームの作成
  const { audio, video } = await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
  video.attach(localVideo);
  await localVideo.play();

  const context = await SkyWayContext.Create(token);

  // 🌎 既存のルーム一覧を取得して表示
  const updateRoomList = async () => {
    roomList.innerHTML = ""; // 既存のリストをクリア
    const rooms = await SkyWayRoom.List(context);
  
    rooms.forEach(room => {
      const decodedName = decodeText(room.name);
      const listItem = document.createElement("li");
      listItem.textContent = decodedName;
  
      // 入室ボタン
      const joinButton = document.createElement("button");
      joinButton.textContent = "入室";
      joinButton.onclick = () => joinRoom(room.name, userNameInput.value.trim());
  
      // 退出ボタン
      const leaveButton = document.createElement("button");
      leaveButton.textContent = "退出";
      leaveButton.onclick = async () => {
        if (currentRoom?.name === room.name) {
          await leaveRoom();
        } else {
          alert("この部屋には入室していません。");
        }
      };
  
      listItem.appendChild(joinButton);
      listItem.appendChild(leaveButton);
      roomList.appendChild(listItem);
    });
  };
  

  updateRoomList();
  setInterval(updateRoomList, 5000);

  // 🚀 ルーム作成ボタン
  createRoomButton.onclick = async () => {
    const gameName = gameInput.value.trim();
    const userName = userNameInput.value.trim();

    if (!gameName || !userName) {
      alert("ルーム名とユーザー名を入力してください！");
      return;
    }

    const encodedRoomName = encodeText(gameName);
    const encodedUserName = encodeText(userName);
    await joinRoom(encodedRoomName, encodedUserName);
  };

  const joinRoom = async (roomName, userName) => {
    if (!userName) {
      alert("ユーザー名を入力してください！");
      return;
    }
  
    if (currentRoom) {
      alert("既に部屋に入っています。退出してから新しい部屋に入ってください。");
      return;
    }
  
    const room = await SkyWayRoom.FindOrCreate(context, { type: "sfu", name: roomName });
    const me = await room.join({ name: userName });
  
    currentRoom = room;
    currentMember = me;
    myId.textContent = me.id;
    joinedRoomName.textContent = `参加中の部屋: ${decodeText(roomName)}`;
  
    await me.publish(audio);
    await me.publish(video);
  
    // ✅ ユーザーリストを更新
    updateUserList();
  
    // ✅ 他のユーザーが入室・退出したときにリストを更新
    room.onMemberJoined.add(() => updateUserList());
    room.onMemberLeft.add(({ member }) => {
      document.getElementById(`user-${member.id}`)?.remove();
    });
  
    // 🎙 ストリームの購読処理
    room.publications.forEach(subscribeAndAttach);
    room.onStreamPublished.add((e) => subscribeAndAttach(e.publication));
    room.onStreamUnpublished.add((e) => removeStream(e.publication.id));
  
    // 🔴 退出ボタンの追加
    const leaveButton = document.createElement("button");
    leaveButton.textContent = "部屋を退出";
    leaveButton.onclick = leaveRoom;
    buttonArea.appendChild(leaveButton);
  };
  
  
  const leaveRoom = async () => {
    if (!currentRoom) return;
  
    await currentMember.leave();
    await currentRoom.dispose();
    currentRoom = null;
    currentMember = null;
  
    myId.textContent = "";
    joinedRoomName.textContent = "";
    roomUsersList.innerHTML = ""; // ✅ ユーザーリストをクリア
    buttonArea.replaceChildren();
    remoteMediaArea.replaceChildren();
  };
  const updateUserList = () => {
    if (!currentRoom) return;
  
    roomUsersList.innerHTML = ""; // リストをクリア
  
    currentRoom.members.forEach(member => {
      const listItem = document.createElement("li");
      listItem.textContent = decodeText(member.name) || `User (${member.id})`;
      listItem.id = `user-${member.id}`;
      roomUsersList.appendChild(listItem);
    });
  };
    
  const subscribeAndAttach = async (publication) => {
    if (publication.publisher.id === currentMember.id) return; // 自分のストリームは無視
  
    const { stream } = await currentMember.subscribe(publication.id);
  
    let newMedia;
    if (stream.track.kind === "video") {
      newMedia = document.createElement("video");
      newMedia.playsInline = true;
      newMedia.autoplay = true;
    } else if (stream.track.kind === "audio") {
      newMedia = document.createElement("audio");
      newMedia.controls = true;
      newMedia.autoplay = true;
    }
  
    if (newMedia) {
      newMedia.id = `media-${publication.id}`;
      stream.attach(newMedia);
      remoteMediaArea.appendChild(newMedia);
    }
  };
  
  // ストリーム削除
  const removeStream = (publicationId) => {
    document.getElementById(`media-${publicationId}`)?.remove();
  };
    
  

    buttonArea.appendChild(leaveButton);
  
})();