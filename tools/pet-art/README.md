# Pet art pipeline (DECISIONS #80)

Turns a 4×3 pose sheet (`image/13-dragon-poses.png`, `image/14-fish-poses.png`) into the 12 WebP poses in
`apps/web/src/assets/pets/v2/<species>/`. Pose order (row by row): main, blink (eyes closed), happy, wave, shy,
play1, play2, play3, sleep, eat, celebrate, yawn.

Needs Python 3 with `pillow numpy scipy vtracer playwright` and a Chrome/Chromium.

```bash
export PET_WORK=pet-work && mkdir -p $PET_WORK
cp image/13-dragon-poses.png $PET_WORK/dragon-sheet.png
cp image/14-fish-poses.png   $PET_WORK/fish-sheet.png
python3 tools/pet-art/segment.py   # 12 poses per sheet, alpha cleaned, sizes printed
python3 tools/pet-art/place.py     # one shared canvas per species: same scale, same baseline, centred on the body
python3 tools/pet-art/trace.py dragon:main dragon:happy …   # trace ×4 → render 720 px → out-<species>-<pose>.webp
```

Then build the blink frame from the traced main + eyes-closed frames (only the eye area changes; see the commit
that added this folder), copy `out-*.webp` into `assets/pets/v2/<species>/<pose>.webp`, update `aspect` in
`components/pet/species.ts` (canvas w / h printed by place.py), and run the frame checks before pushing:
every move inside its box on iPhone SE / 15 Pro Max / iPad, no two drawings at once when poses change.

Rules for new art: same character, same scale in every pose, transparent background, no shadows, no effects
(the app draws sparks, hearts, puffs, bubbles, z).
