import { nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, uuidV4 } from "@skyway-sdk/room";

// SkyWayの認証トークンを作成
const token = new SkyWayAuthToken({
  jti: uuidV4(),
  iat: nowInSec(),
  exp: nowInSec() + 60 * 60 * 24, // 24時間有効
  version: 3,
  scope: {
    appId: "d285f445-d39c-4b97-8bba-8381f027279e",
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
}).encode("/Ic9tG1SNhXYfESb3aPLBl8UdXZInffQrN5yqwir+yE=");

(async () => {
  // DOM要素の取得
  const localVideo = document.getElementById("local-video");
  const buttonArea = document.getElementById("button-area");
  const remoteMediaArea = document.getElementById("remote-media-area");
  const myId = document.getElementById("my-id");
  const leaveButton = document.getElementById("leave");

  const toggleAudioButton = document.getElementById("toggle-audio");
  const toggleVideoButton = document.getElementById("toggle-video");

  let audioStream, videoStream, me;

  // URLからルーム名を取得
  const urlParams = new URLSearchParams(window.location.search);
  const roomName = urlParams.get("room");

  if (!roomName) {
    alert("ルームが見つかりません。");
    window.location.href = "index.html";
  }

  // マイクとカメラのストリームを取得
  const { audio, video } = await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
  audioStream = audio;
  videoStream = video;
  video.attach(localVideo);
  await localVideo.play();

  // SkyWayのコンテキスト作成
  const context = await SkyWayContext.Create(token);
  const room = await SkyWayRoom.FindOrCreate(context, {
    type: "p2p",
    name: roomName,
  });

  me = await room.join();
  myId.textContent = me.id;

  // 自分のストリームを公開
  await me.publish(audioStream);
  await me.publish(videoStream);

  // 他の参加者のストリームを受信する処理
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

  // 既存の公開済みストリームを取得
  room.publications.forEach(subscribeAndAttach);
  room.onStreamPublished.add((e) => subscribeAndAttach(e.publication));

  // 退出ボタンの処理
  leaveButton.onclick = async () => {
    await me.leave();
    await room.dispose();

    myId.textContent = "";
    buttonArea.replaceChildren();
    remoteMediaArea.replaceChildren();
  };

  // マイクのON/OFF切り替え
  toggleAudioButton.onclick = () => {
    if (audioStream) {
      const isEnabled = audioStream.track.enabled;
      audioStream.track.enabled = !isEnabled;
      toggleAudioButton.textContent = isEnabled ? "マイクON" : "マイクOFF";
    }
  };

  // カメラのON/OFF切り替え
  toggleVideoButton.onclick = () => {
    if (videoStream) {
      const isEnabled = videoStream.track.enabled;
      videoStream.track.enabled = !isEnabled;
      toggleVideoButton.textContent = isEnabled ? "カメラON" : "カメラOFF";
    }
  };

  // ストリームが削除された場合の処理
  room.onStreamUnpublished.add((e) => {
    document.getElementById(`subscribe-button-${e.publication.id}`)?.remove();
    document.getElementById(`media-${e.publication.id}`)?.remove();
  });

})();
