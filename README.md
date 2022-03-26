# sACN2Video
Renders Images, Videos, etc. controlled by sACN data

The documentation is not ready yet (see #1)

## How does this work

You can configure multiple sources per output. Currently available: Images (img), Videos (video), Audio (audio) and Color shapes (color).

You can define every property of them to be either fixed or controlled via a sACN channel.

### Common propertys:
- visibility (opacity)
- position (x,y,height,width)
- color (rgb)
- playback (pause, play, play from the beginning, loop, loop from the beginning)
- volume of audio and video

## Installation

1. clone this repo
2. `cd server`
3. `npm install` or `yarn install`

## Run the application

    cd server/build
    node server.js
    
## Run the TypeScript compiler (after source changes)

The `tsconfig.json`'s are located in `/server` and `/client`

Tip: use the watch mode `tsc -w`

## License

This software is licensed under the conditions of the agpl-v3 (see LICENSE file).

You can find the licenses of the used libaries in their folder in `/server/node_modules/`.
