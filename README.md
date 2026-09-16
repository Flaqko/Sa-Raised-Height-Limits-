# Raised Height Limits

A lightweight **CLEO Redux** mod for **GTA San Andreas Classic** that raises the maximum flight height for aircraft and the jetpack while keeping finite limits.

## Features

- Raises the aircraft flight ceiling to **1200** (~1.5x vanilla)
- Raises the jetpack flight ceiling to **320 units above ground** (~3.2x vanilla)
- Works with planes and helicopters
- Keeps the jetpack height limit finite instead of making it unlimited
- Does **not** modify the Hydra / aircraft speed limiter
- Lightweight single-file CLEO Redux script

## Requirements

- GTA San Andreas Classic
- CLEO Redux
- Compatible GTA SA 1.0 executable layout

## Installation

1. Install CLEO Redux if you do not already have it.
2. Copy `RaisedHeightLimits[mem].js` into your GTA San Andreas `CLEO` folder.
3. Start the game.

No configuration file or additional folders are required.

## Usage

The mod works automatically after the game starts.

- **Planes / Helicopters:** maximum flight height is raised to approximately 1200.
- **Jetpack:** maximum height is raised to approximately 320 units above the local ground.

The higher limits are intended to provide more freedom for flying and exploring without completely removing GTA San Andreas' altitude restrictions.

## Compatibility

Designed and tested with **GTA San Andreas Classic 1.0** and CLEO Redux.

Because this mod uses memory patches, compatibility with other executable versions or mods that alter the same flight-height code is not guaranteed.

## Notes

- The Hydra's speed limiter is intentionally left unchanged.
- The jetpack limit uses the tested four-byte height-limit bypass used by the release build.
- Removing the mod returns the game to its normal height limits after restarting the game.

## Changelog

### v1.0
- Initial public release
- Aircraft ceiling raised to 1200
- Jetpack ceiling raised to 320 AGL
- Finite height limits retained
- Hydra / aircraft speed limiter left untouched

## Author

**Flaqko GTA SA**
