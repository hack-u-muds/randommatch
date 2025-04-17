import { nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, uuidV4 } from "@skyway-sdk/room";

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
  const gameInput = document.getElementById("game-name");
  const userNameInput = document.getElementById("user-name");
  const createRoomButton = document.getElementById("create-room");
  const joinedRoomName = document.getElementById("joined-room-name");
  const roomUsersList = document.getElementById("room-users");
  const roomList = document.getElementById("room-list");

  let currentRoom = null;
  let currentMember = null;
  let videoEnabled = true;
  let videoTrack = null;

  // 🎥 音声・ビデオストリームの作成
  const { audio, video } = await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
  videoTrack = video.track;
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
    document.getElementById("my-id").textContent = me.id;
    joinedRoomName.textContent = `参加中の部屋: ${decodeText(roomName)}`;

    await me.publish(audio);
    await me.publish(video);

    updateUserList();
    room.onMemberJoined.add(() => {
      updateUserList();
      subscribeToAllMembers(room);
    });
    room.onMemberLeft.add(updateUserList);

    subscribeToAllMembers(room);
    room.onStreamPublished.add((e) => subscribeAndAttach(e.publication));
    room.onStreamUnpublished.add((e) => removeStream(e.publication.id));

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

    document.getElementById("my-id").textContent = "";
    joinedRoomName.textContent = "";
    roomUsersList.innerHTML = "";
    buttonArea.innerHTML = ""; // ルーム退出ボタンを削除
    document.querySelectorAll("[id^=media-]").forEach(element => element.remove());

    // ビデオオン/オフボタンのテキストをリセット
    const toggleVideoButton = document.getElementById("toggle-video");
    if (toggleVideoButton) {
      toggleVideoButton.textContent = "ビデオをオフ";
    }
  };

  const updateUserList = () => {
    if (!currentRoom) return;

    roomUsersList.innerHTML = "";

    currentRoom.members.forEach(member => {
      const listItem = document.createElement("li");
      listItem.textContent = decodeText(member.name) || `User (${member.id})`;
      listItem.id = `user-${member.id}`;
      roomUsersList.appendChild(listItem);
    });
  };

  const subscribeAndAttach = async (publication) => {
    if (!currentMember || publication.publisher.id === currentMember.id) return; // 自分自身のストリームはスキップ

    const memberId = publication.publisher.id;
    const { stream } = await currentMember.subscribe(publication.id);

    const memberListItem = document.getElementById(`user-${memberId}`);
    if (memberListItem) {
      const newMedia = document.createElement(publication.contentType === "video" ? "video" : "audio");
      newMedia.playsInline = true;
      newMedia.autoplay = true;
      newMedia.controls = true;
      newMedia.id = `media-${publication.id}`;
      stream.attach(newMedia);
      memberListItem.appendChild(newMedia);
    }
  };

  const subscribeToAllMembers = (room) => {
    room.publications.forEach(publication => {
      if (publication.publisher.id !== currentMember.id && !document.getElementById(`media-${publication.id}`)) {
        subscribeAndAttach(publication);
      }
    });
  };

  const removeStream = (publicationId) => {
    document.getElementById(`media-${publicationId}`)?.remove();
  };

  const toggleVideo = () => {
    if (videoEnabled) {
      videoTrack.enabled = false;
      videoEnabled = false;
      document.getElementById("toggle-video").textContent = "ビデオをオン";
    } else {
      videoTrack.enabled = true;
      videoEnabled = true;
      document.getElementById("toggle-video").textContent = "ビデオをオフ";
    }
  };

  const toggleVideoButton = document.getElementById("toggle-video");
  toggleVideoButton.onclick = toggleVideo;
})();