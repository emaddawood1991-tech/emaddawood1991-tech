# Scene spec reference

Units are metres, Y is up. At camera `azimuth` 0 the camera is on the +Z side looking toward the centre; positive azimuth swings it around.

```jsonc
{
  "name": "Villa orbit",
  "seed": 11,                      // same seed = same tree layout
  "duration": 7,                   // seconds (defaults to the last camera key time)
  "fps": 24,
  "sky": {
    "sun_elevation": 24,           // degrees: 8-15 golden hour, 50 midday
    "sun_azimuth": 135,            // degrees: where the sun is; shadows fall the other way
    "turbidity": 2.8, "rayleigh": 2.0,   // lower turbidity / higher rayleigh = bluer sky
    "exposure": 0.48,              // overall brightness (0.35-0.7)
    "sun_intensity": 3.4,
    "fog_color": "#c9dcee", "fog_density": 0.0015
  },
  "ground": { "size": 600, "color": "#6b8a48", "plot": { "w": 64, "d": 44, "color": "#7da24f" } },  // plot is optional
  "hills": true,                   // false removes the distant hills
  "shadow_extent": 55,             // metres covered by sharp shadows (raise for bigger scenes)
  "buildings": [
    { "type": "villa", "x": 0, "z": 0, "w": 16, "d": 11, "floor_height": 3.2, "rotation": 0 }  // rotation in degrees
  ],
  "pool": { "x": 14, "z": -3, "w": 9, "d": 4 },
  "paths": [
    { "points": [[-4, 36], [-4, 12], [-9, 8.5]], "width": 4.2, "material": "asphalt" },   // asphalt | paving
    { "points": [[-9, 8.5], [-9, 6.5]], "width": 3.2, "material": "paving" }
  ],
  "trees": {
    "count": 30,
    "area": { "x": [-30, 30], "z": [-21, 21] },
    "types": ["round", "round", "pine", "palm", "palm"]   // repeat a type to make it more common
  },
  "camera": {
    "fov": 48,                     // vertical degrees; 48-55 suits 9:16
    "ease": "inOutSine",           // linear | inOutSine | inOutCubic
    "keys": [                      // at least 2; the camera blends between neighbours
      { "t": 0, "orbit": { "center": [4, 3, 0], "radius": 58, "azimuth": 10,  "height": 17 } },
      { "t": 7, "orbit": { "center": [4, 3, 0], "radius": 36, "azimuth": 160, "height": 6.5 } }
      // or a free move: { "t": 3, "pos": [x, y, z], "target": [x, y, z], "fov": 40 }
    ]
  }
}
```

Framing tips for vertical video: radius about 2.5-4x the building width, height 6-25 m, end lower and closer than the start.
Trees and the pool avoid buildings and paths automatically. Keep `count` under about 60 to stay fast.
