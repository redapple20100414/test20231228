import { nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, uuidV4 } from '@skyway-sdk/room';

const token = new SkyWayAuthToken({
  jti: uuidV4(),
  iat: nowInSec(),
  exp: nowInSec() + 60 * 60 * 24,
  scope: {
    app: {
      id: 'f5cdf020-faac-42aa-93ed-b667307d4c7b',
      turn: true,
      actions: ['read'],
      channels: [
        {
          id: '*',
          name: '*',
          actions: ['write'],
          members: [
            {
              id: '*',
              name: '*',
              actions: ['write'],
              publication: {
                actions: ['write'],
              },
              subscription: {
                actions: ['write'],
              },
            },
          ],
          sfuBots: [
            {
              actions: ['write'],
              forwardings: [
                {
                  actions: ['write'],
                },
              ],
            },
          ],
        },
      ],
    },
  },
}).encode('6YyryhrsxWwHRZNBu2yt3prX+IsXARoruwRr4dacf/E=');

(async () => {
    const videoContainer = document.getElementById('video-container');
    let videoCount = 0;

    const { audio, video } = await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();

    const fixedRoomName = 'akari';
    const context = await SkyWayContext.Create(token);
    const room = await SkyWayRoom.FindOrCreate(context, {
        type: 'sfu',
        name: fixedRoomName,
    });
    const me = await room.join();

    await me.publish(audio);
    await me.publish(video);

    const autoSubscribeAndAttach = async (publication) => {
        if (videoCount >= 4) return;

        const { stream } = await me.subscribe(publication.id);
        
        // ストリームの種類に応じた処理
        if (stream.track.kind === 'video') {
            const videoWrapper = createVideoWrapper();
            const newVideo = document.createElement('video');
            newVideo.playsInline = true;
            newVideo.autoplay = true;
            videoWrapper.appendChild(newVideo);
            videoContainer.appendChild(videoWrapper);
            stream.attach(newVideo);
            videoCount++;
        } else if (stream.track.kind === 'audio') {
            // オーディオストリームの場合はビデオ要素は作成しない
            const newAudio = document.createElement('audio');
            newAudio.autoplay = true;
            stream.attach(newAudio);
            // newAudio要素はUIには表示されない
        }
    };

    room.publications.forEach(autoSubscribeAndAttach);
    room.onStreamPublished.add((e) => autoSubscribeAndAttach(e.publication));
})();

function createVideoWrapper() {
    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'video-wrapper';
    return videoWrapper;
}
