# sACN2Video

Renders Images, Videos, etc. controlled by sACN data

## Note

The documentation is not ready yet (see #1). If you want to use this software, feel free to ask everything.

## How does this work

You can configure multiple sources per output. Currently available: Images (img), Videos (video), Audio (audio) and Color shapes (color).

You can define every property of them to be either fixed or controlled via a sACN channel.

The outputs are available from webpages (for Example `http://localhost/out/left`).

It is intended to display the output to a Wall or similar with a projector.

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

## Fixture defintions

`misc/sACN2Video fixtures.esf2` contains eos fixture definitions for audio and video. (For etc's eos software).
To use them in your own showfile: Go to `File > Merge`. Select `sACN2Video fixtures.esf2`. Select ONLY (!) `Fixtures`. Click `Merge`.

Images may be patched as generic dimmer (8bit) and color shapes as generic IRGB (8bit).

If you want to use the ability to control the position of an object, you need your own definition.

## How to use this software on a not rectangular output surface

This software renders a rectangle. If you want to use it on other outputs (most use cases), you need a external software to transform the output.

I highly recommend using [OBS](https://obsproject.com) and the [StreamFX Plugin](https://github.com/Xaymar/obs-StreamFX) (needed for 3D-transformations) to do so.

## License

This software is licensed under the conditions of the agpl-v3 (see LICENSE file).

You can find the licenses of the used libaries in their folder in `/server/node_modules/`.
