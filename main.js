// SkyWay SDKの機能をCDNから使う
const { nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, uuidV4 } = skyway_room;

// SkyWayトークン作成
const token = new SkyWayAuthToken({
  jti: uuidV4(),
  iat: nowInSec(),
  exp: nowInSec() + 60 * 60 * 24, // 24時間有効
  version: 3,
  scope: {
    appId: "bf889939-03b0-4642-bda3-46c7df947d18", // あなたのappId
    rooms: [
      {
        name: "*",
        methods: ["create", "close", "updateMetadata"],
        member: {
          name: "*",
          methods: ["publish", "subscribe", "updateMetadata"],
        },
      },
    ],
  },
}).encode("a8YaaMu1iTN8hpcmeIrXN6RRxAe2jGdYyT41tcDhATY="); // あなたのシークレットキー

let room;
let localMember;

// カメラとマイクを取得してローカルビデオに表示
(async () => {
  const localVideo = document.getElementById("local-video");
  const { audio, video } = await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
  video.attach(localVideo);
  await localVideo.play();
})();

// 「join」ボタンを押したときの処理
document.getElementById("join").addEventListener("click", async () => {
  const roomName = document.getElementById("room-name").value;
  if (!roomName) {
    alert("ルーム名を入力してください！");
    return;
  }

  const context = await SkyWayContext.Create(token);
  room = await SkyWayRoom.FindOrCreate(context, {
    type: "p2p",
    name: roomName,
  });

  localMember = await room.join({
    name: uuidV4(),
    stream: [],
  });

  const { audio, video } = await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
  await localMember.publish(audio);
  await localMember.publish(video);

  room.onStreamPublished.add((stream) => {
    const remoteVideo = document.createElement("video");
    remoteVideo.width = 400;
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;
    stream.attach(remoteVideo);
    document.getElementById("remote-media-area").appendChild(remoteVideo);
  });

  console.log(`${roomName}に参加しました`);
});

// 「leave」ボタンを押したときの処理
document.getElementById("leave").addEventListener("click", async () => {
  if (room && localMember) {
    await localMember.leave();
    room = null;
    localMember = null;
    document.getElementById("remote-media-area").innerHTML = "";
    console.log("ルームを退出しました");
  }
});
