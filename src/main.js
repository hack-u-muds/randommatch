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

  // 音声・ビデオストリームの作成
  const { audio, video } = await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
  video.attach(localVideo);
  await localVideo.play();

  const context = await SkyWayContext.Create(token);

  // 既存のルーム一覧を取得して表示
  const updateRoomList = async () => {
    roomList.innerHTML = ""; // リストをクリア
    const rooms = await SkyWayRoom.List(context);

    rooms.forEach(room => {
      const listItem = document.createElement("li");
      listItem.textContent = decodeURIComponent(room.name);

      const joinButton = document.createElement("button");
      joinButton.textContent = "Join";
      joinButton.onclick = () => joinRoom(room.name, userNameInput.value.trim());

      listItem.appendChild(joinButton);
      roomList.appendChild(listItem);
    });
  };

  updateRoomList(); // 初回更新
  setInterval(updateRoomList, 5000); // 5秒ごとにリストを更新

  // ルーム作成ボタン
  createRoomButton.onclick = async () => {
    const gameName = gameInput.value.trim();
    const userName = userNameInput.value.trim();

    if (!gameName || !userName) {
      alert("ゲーム名とユーザー名を入力してください！");
      return;
    }

    const encodedRoomName = encodeURIComponent(gameName);
    await joinRoom(encodedRoomName, userName);
  };

  // ルームに参加する処理
  const joinRoom = async (roomName, userName) => {
    if (!userName) {
      alert("ユーザー名を入力してください！");
      return;
    }

    if (currentRoom) {
      alert("既に部屋に入っています。退出してから新しい部屋に入ってください。");
      return;
    }

    const room = await SkyWayRoom.FindOrCreate(context, { type: "p2p", name: roomName });
    const me = await room.join({ name: userName });

    currentRoom = room;
    currentMember = me;
    myId.textContent = me.id;
    joinedRoomName.textContent = `参加中の部屋: ${decodeURIComponent(roomName)}`;

    await me.publish(audio);
    await me.publish(video);

    // ユーザーリストの更新
    const updateUserList = () => {
      roomUsersList.innerHTML = "";
      room.members.forEach(member => {
        const listItem = document.createElement("li");
        listItem.textContent = member.name || `User (${member.id})`;
        listItem.id = `user-${member.id}`;
        roomUsersList.appendChild(listItem);
      });
    };

    updateUserList();
    room.onMemberJoined.add(() => updateUserList());
    room.onMemberLeft.add(({ member }) => {
      document.getElementById(`user-${member.id}`)?.remove();
    });

    // ストリームの購読
    const subscribeAndAttach = (publication) => {
      if (publication.publisher.id === me.id) return;

      const subscribeButton = document.createElement("button");
      subscribeButton.id = `subscribe-button-${publication.id}`;
      subscribeButton.textContent = `${publication.publisher.name}: ${publication.contentType}`;
      buttonArea.appendChild(subscribeButton);

      subscribeButton.onclick = async () => {
        const { stream } = await me.subscribe(publication.id);

        let newMedia;
        switch (stream.track.kind) {
          case "video":
            newMedia = document.createElement("video");
            newMedia.playsInline = true;
            newMedia.autoplay = true;
            break;
          case "audio":
            newMedia = document.createElement("audio");
            newMedia.controls = true;
            newMedia.autoplay = true;
            break;
          default:
            return;
        }
        newMedia.id = `media-${publication.id}`;
        stream.attach(newMedia);
        remoteMediaArea.appendChild(newMedia);
      };
    };

    room.publications.forEach(subscribeAndAttach);
    room.onStreamPublished.add((e) => subscribeAndAttach(e.publication));
    room.onStreamUnpublished.add((e) => {
      document.getElementById(`subscribe-button-${e.publication.id}`)?.remove();
      document.getElementById(`media-${e.publication.id}`)?.remove();
    });

    // 退出ボタンの作成
    const leaveButton = document.createElement("button");
    leaveButton.textContent = "部屋を退出";
    leaveButton.onclick = async () => {
      if (!currentRoom) return;

      await currentMember.leave();
      await currentRoom.dispose();
      currentRoom = null;
      currentMember = null;

      myId.textContent = "";
      joinedRoomName.textContent = "";
      roomUsersList.innerHTML = "";
      buttonArea.replaceChildren();
      remoteMediaArea.replaceChildren();
      leaveButton.remove();
    };

    buttonArea.appendChild(leaveButton);
  };
})();
