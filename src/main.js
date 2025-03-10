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
  const joinButton = document.getElementById("join-room");
  const joinedRoomName = document.getElementById("joined-room-name");

  let currentRoom = null;
  let currentMember = null;

  // 音声・ビデオストリームの作成
  const { audio, video } = await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
  video.attach(localVideo);
  await localVideo.play();

  const context = await SkyWayContext.Create(token);

  joinButton.onclick = async () => {
    const gameName = gameInput.value.trim();
    if (!gameName) {
      alert("Please enter a game name!");
      return;
    }

    if (currentRoom) {
      alert("You are already in a room. Please leave before joining another.");
      return;
    }

    // ユーザーが入力したゲーム名で部屋を検索または作成
    const room = await SkyWayRoom.FindOrCreate(context, { type: "p2p", name: gameName });
    const me = await room.join();
    
    currentRoom = room;
    currentMember = me;
    myId.textContent = me.id;
    joinedRoomName.textContent = `Joined Room: ${gameName}`;

    await me.publish(audio);
    await me.publish(video);

    const subscribeAndAttach = (publication) => {
      if (publication.publisher.id === me.id) return;

      const subscribeButton = document.createElement("button");
      subscribeButton.id = `subscribe-button-${publication.id}`;
      subscribeButton.textContent = `${publication.publisher.id}: ${publication.contentType}`;
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
    leaveButton.textContent = "Leave Room";
    leaveButton.onclick = async () => {
      if (!currentRoom) return;

      await currentMember.leave();
      await currentRoom.dispose();
      currentRoom = null;
      currentMember = null;
      
      myId.textContent = "";
      joinedRoomName.textContent = "";
      buttonArea.replaceChildren();
      remoteMediaArea.replaceChildren();
      leaveButton.remove();
    };

    buttonArea.appendChild(leaveButton);
  };
})();
