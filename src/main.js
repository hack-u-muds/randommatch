import { nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, uuidV4 } from "@skyway-sdk/room";

// 10個の部屋を作成
const roomNames = [
  "Room1", "Room2", "Room3", "Room4", "Room5",
  "Room6", "Room7", "Room8", "Room9", "Room10"
];

// SkyWayのトークン設定
const token = new SkyWayAuthToken({
  jti: uuidV4(),
  iat: nowInSec(),
  exp: nowInSec() + 60 * 60 * 24,
  version: 3,
  scope: {
    appId: "d285f445-d39c-4b97-8bba-8381f027279e",
    rooms: roomNames.map(room => ({
      name: room,
      methods: ["create", "close", "updateMetadata"],
      member: {
        name: "*",
        methods: ["publish", "subscribe", "updateMetadata"],
      },
    })),
  },
}).encode("/Ic9tG1SNhXYfESb3aPLBl8UdXZInffQrN5yqwir+yE=");

(async () => {
  const localVideo = document.getElementById("local-video");
  const buttonArea = document.getElementById("button-area");
  const remoteMediaArea = document.getElementById("remote-media-area");
  const roomList = document.getElementById("room-list");
  const joinedRoomsList = document.getElementById("joined-rooms");
  const myId = document.getElementById("my-id");

  // 音声・ビデオストリームの作成
  const { audio, video } = await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
  video.attach(localVideo);
  await localVideo.play();

  const context = await SkyWayContext.Create(token);
  const rooms = {}; // 参加している部屋を管理

  // 入室中の部屋のリストを更新
  const updateJoinedRoomsDisplay = () => {
    joinedRoomsList.innerHTML = ""; // 既存のリストをクリア
    Object.keys(rooms).forEach(roomName => {
      const listItem = document.createElement("li");
      listItem.textContent = roomName;
      joinedRoomsList.appendChild(listItem);
    });
  };

  // 各部屋ごとにリストを作成
  roomNames.forEach(roomName => {
    const listItem = document.createElement("li");
    listItem.textContent = roomName;

    const joinButton = document.createElement("button");
    joinButton.textContent = "Join";
    joinButton.onclick = async () => {
      if (rooms[roomName]) return; // 既に参加している場合は無視

      const room = await SkyWayRoom.FindOrCreate(context, { type: "p2p", name: roomName });
      const me = await room.join();
      rooms[roomName] = { room, me };

      myId.textContent = me.id;

      await me.publish(audio);
      await me.publish(video);

      updateJoinedRoomsDisplay(); // 入室時に更新

      const subscribeAndAttach = (publication) => {
        if (publication.publisher.id === me.id) return;

        const subscribeButton = document.createElement("button");
        subscribeButton.id = `subscribe-button-${roomName}-${publication.id}`;
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
          newMedia.id = `media-${roomName}-${publication.id}`;
          stream.attach(newMedia);
          remoteMediaArea.appendChild(newMedia);
        };
      };

      room.publications.forEach(subscribeAndAttach);
      room.onStreamPublished.add((e) => subscribeAndAttach(e.publication));

      room.onStreamUnpublished.add((e) => {
        document.getElementById(`subscribe-button-${roomName}-${e.publication.id}`)?.remove();
        document.getElementById(`media-${roomName}-${e.publication.id}`)?.remove();
      });
    };

    const leaveButton = document.createElement("button");
    leaveButton.textContent = "Leave";
    leaveButton.onclick = async () => {
      if (!rooms[roomName]) return;

      const { room, me } = rooms[roomName];

      await me.leave();
      await room.dispose();
      delete rooms[roomName];

      updateJoinedRoomsDisplay(); // 退出時に更新

      myId.textContent = Object.keys(rooms).length ? myId.textContent : "";
      buttonArea.replaceChildren();
      remoteMediaArea.replaceChildren();
    };

    listItem.appendChild(joinButton);
    listItem.appendChild(leaveButton);
    roomList.appendChild(listItem);
  });
})();
