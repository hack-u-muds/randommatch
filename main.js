const { nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, uuidV4 } = skyway_room;

import { nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, uuidV4 } from "@skyway-sdk/room";

const token = new SkyWayAuthToken({
    jti: uuidV4(),
    iat: nowInSec(),
    exp: nowInSec() + 60 * 60 * 24,
    version: 3,
    scope: {
      appId: "bf889939-03b0-4642-bda3-46c7df947d18",
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
  }).encode("a8YaaMu1iTN8hpcmeIrXN6RRxAe2jGdYyT41tcDhATY=");