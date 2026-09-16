// Raised Height Limits v1.0
// GTA San Andreas Classic + CLEO Redux JavaScript
//
// Aircraft (planes + helicopters): ~1.50x vanilla ceiling
// Jetpack: 3.20x vanilla height above ground
// Hydra/aircraft speed limiter: intentionally untouched
//
// IMPORTANT:
// This script bypasses GTA's original hard-coded height checks, then applies
// new finite ceilings in script. Fixed executable addresses are intended for
// the classic GTA San Andreas 1.0 US executable / compatible 1.0 layout.

/// <reference path=".config/sa.d.ts" />

const PLAYER_ID = 0;

// -----------------------------------------------------------------------------
// Tuning
// -----------------------------------------------------------------------------

// Community-documented stock aircraft cap is roughly 800 world-Z units.
const STOCK_AIRCRAFT_CEILING_APPROX = 800.0;
const AIRCRAFT_HEIGHT_MULTIPLIER = 1.50;
const AIRCRAFT_CEILING_Z =
    STOCK_AIRCRAFT_CEILING_APPROX * AIRCRAFT_HEIGHT_MULTIPLIER; // 1200.0

// GTA's stock jetpack height setting is 100.0 above ground.
const STOCK_JETPACK_HEIGHT = 100.0;
const JETPACK_HEIGHT_MULTIPLIER = 3.20;
const JETPACK_CEILING_AGL =
    STOCK_JETPACK_HEIGHT * JETPACK_HEIGHT_MULTIPLIER; // 320.0

// Small tolerances prevent unnecessary repeated corrections at the boundary.
const AIRCRAFT_CLAMP_TOLERANCE = 0.10;
const JETPACK_CLAMP_TOLERANCE = 0.05;

const DEBUG_LOG = true;

// -----------------------------------------------------------------------------
// Original hard-limit bypasses
// -----------------------------------------------------------------------------

// Aircraft flight-height limiter bypass.
const ADDR_AIRCRAFT_HEIGHT_CHECK = 0x6D261D;

// Full jetpack limiter bypass. The older one-byte patch only changed the final
// byte at 0x67F268. This version patches the complete 4-byte instruction area.
const ADDR_JETPACK_HEIGHT_PATCH = 0x67F265;

function dbg(message) {
    if (DEBUG_LOG) {
        log("[RaisedHeightLimits v1.0] " + message);
    }
}

function firstNumber(value, preferredKeys) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            if (typeof item === "number" && Number.isFinite(item)) {
                return item;
            }
        }
    }

    if (value && typeof value === "object") {
        for (const key of preferredKeys) {
            if (
                Object.prototype.hasOwnProperty.call(value, key) &&
                typeof value[key] === "number" &&
                Number.isFinite(value[key])
            ) {
                return value[key];
            }
        }

        for (const key in value) {
            if (typeof value[key] === "number" && Number.isFinite(value[key])) {
                return value[key];
            }
        }
    }

    return null;
}

function vector3(value) {
    if (Array.isArray(value) && value.length >= 3) {
        const x = Number(value[0]);
        const y = Number(value[1]);
        const z = Number(value[2]);
        if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
            return { x, y, z };
        }
    }

    if (value && typeof value === "object") {
        const candidateSets = [
            ["x", "y", "z"],
            ["posX", "posY", "posZ"],
            ["velocityX", "velocityY", "velocityZ"],
            ["vx", "vy", "vz"]
        ];

        for (const keys of candidateSets) {
            const x = Number(value[keys[0]]);
            const y = Number(value[keys[1]]);
            const z = Number(value[keys[2]]);
            if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
                return { x, y, z };
            }
        }

        // CLEO Redux natives normally expose named outputs, but keep a numeric
        // fallback for compatibility with alternate return shapes.
        const nums = [];
        for (const key in value) {
            if (typeof value[key] === "number" && Number.isFinite(value[key])) {
                nums.push(value[key]);
            }
        }
        if (nums.length >= 3) {
            return { x: nums[0], y: nums[1], z: nums[2] };
        }
    }

    return null;
}

function getPlayerChar() {
    return firstNumber(
        native("GET_PLAYER_CHAR", PLAYER_ID),
        ["handle", "char", "ped", "playerChar"]
    );
}

function getCurrentVehicle(cj) {
    return firstNumber(
        native("GET_CAR_CHAR_IS_USING", cj),
        ["handle", "car", "vehicle"]
    );
}

function getVehicleModel(car) {
    return firstNumber(
        native("GET_CAR_MODEL", car),
        ["model", "modelId", "id"]
    );
}

function getVehiclePosition(car) {
    return vector3(native("GET_CAR_COORDINATES", car));
}

function getCharVelocity(cj) {
    return vector3(native("GET_CHAR_VELOCITY", cj));
}

function getHeightAboveGround(cj) {
    return firstNumber(
        native("GET_CHAR_HEIGHT_ABOVE_GROUND", cj),
        ["height", "value", "distance"]
    );
}

function isAircraft(car) {
    if (car === null || car < 0 || !native("DOES_VEHICLE_EXIST", car)) {
        return false;
    }

    const model = getVehicleModel(car);
    if (model === null) {
        return false;
    }

    return (
        !!native("IS_THIS_MODEL_A_PLANE", model) ||
        !!native("IS_THIS_MODEL_A_HELI", model)
    );
}

function applyMemoryPatches() {
    // Aircraft height only. DO NOT patch 0x6DADE8: that is the Hydra/aircraft
    // speed-limit bypass from the old script, and is intentionally left vanilla.
    Memory.WriteU8(ADDR_AIRCRAFT_HEIGHT_CHECK, 0xEB, true);

    // Full 4-byte jetpack height-limit bypass: 90 90 90 EB.
    Memory.WriteU8(ADDR_JETPACK_HEIGHT_PATCH + 0, 0x90, true);
    Memory.WriteU8(ADDR_JETPACK_HEIGHT_PATCH + 1, 0x90, true);
    Memory.WriteU8(ADDR_JETPACK_HEIGHT_PATCH + 2, 0x90, true);
    Memory.WriteU8(ADDR_JETPACK_HEIGHT_PATCH + 3, 0xEB, true);
}

applyMemoryPatches();

dbg(
    "Loaded - aircraft ceiling=" + AIRCRAFT_CEILING_Z.toFixed(1) +
    " (~" + AIRCRAFT_HEIGHT_MULTIPLIER.toFixed(2) + "x), jetpack ceiling=" +
    JETPACK_CEILING_AGL.toFixed(1) + " AGL (" +
    JETPACK_HEIGHT_MULTIPLIER.toFixed(2) + "x). Hydra speed limiter untouched."
);

// -----------------------------------------------------------------------------
// Runtime finite ceilings
// -----------------------------------------------------------------------------

while (true) {
    wait(0);

    try {
        if (!native("IS_PLAYER_PLAYING", PLAYER_ID)) {
            continue;
        }

        const cj = getPlayerChar();
        if (cj === null || cj < 0 || !native("DOES_CHAR_EXIST", cj)) {
            continue;
        }

        // -----------------------------------------------------------------
        // Aircraft: 1.50x approximate vanilla global world-Z ceiling.
        // -----------------------------------------------------------------
        const car = getCurrentVehicle(cj);
        if (isAircraft(car)) {
            const pos = getVehiclePosition(car);

            if (
                pos !== null &&
                pos.z > AIRCRAFT_CEILING_Z + AIRCRAFT_CLAMP_TOLERANCE
            ) {
                // Keep X/Y untouched and clamp only Z. NO speed-memory patching.
                native(
                    "SET_CAR_COORDINATES_NO_OFFSET",
                    car,
                    pos.x,
                    pos.y,
                    AIRCRAFT_CEILING_Z
                );
            }
        }

        // -----------------------------------------------------------------
        // Jetpack: 3.20x stock height ABOVE GROUND.
        // -----------------------------------------------------------------
        // GET_CHAR_HEIGHT_ABOVE_GROUND tracks terrain, so this remains a true
        // 320-unit local ceiling over hills/mountains instead of a fixed world Z.
        if (native("IS_PLAYER_USING_JETPACK", PLAYER_ID)) {
            const heightAGL = getHeightAboveGround(cj);
            if (
                heightAGL !== null &&
                heightAGL >= JETPACK_CEILING_AGL - JETPACK_CLAMP_TOLERANCE
            ) {
                const velocity = getCharVelocity(cj);

                // Preserve X/Y movement and all downward movement. At the new
                // ceiling, cancel only upward velocity while the jetpack is
                // actually equipped. This avoids touching CJ inside aircraft.
                if (velocity !== null && velocity.z > 0.0) {
                    native(
                        "SET_CHAR_VELOCITY",
                        cj,
                        velocity.x,
                        velocity.y,
                        0.0
                    );
                }
            }
        }
    } catch (e) {
        log("[RaisedHeightLimits v1.0] ERROR: " + String(e));
        wait(250);
    }
}
