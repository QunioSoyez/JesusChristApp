"""Generates the app's logo images: a simple white Latin cross on black.

    pip install pillow
    python scripts/make-icons.py

Writes into assets/images/:
  icon.png                     1024x1024  app icon (iOS + fallback), black background, no transparency
  android-icon-foreground.png  1024x1024  Android adaptive icon foreground (cross inside the safe zone)
  android-icon-background.png  1024x1024  Android adaptive icon background (solid black)
  android-icon-monochrome.png  1024x1024  Android 13+ themed icon (white cross on transparent)
  splash-icon.png              1024x1024  splash screen image (white cross on transparent; app.json
                                          sets the black background and the on-screen width)
  favicon.png                  48x48      web favicon

The proportions match the cross drawn in the app (src/components/cross.tsx), slightly bolder so
it stays clear at small sizes.
"""
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "assets" / "images"
SUPERSAMPLE = 4  # draw large, then shrink, for smooth edges

# Cross proportions, relative to the cross's height.
BAR = 0.11       # thickness of both bars
ARM_WIDTH = 0.62  # width of the horizontal bar
ARM_TOP = 0.26    # top of the horizontal bar, from the top of the cross


def cross_image(size: int, cross_height: float, background) -> Image.Image:
    """Image of `size` px with a centered white cross `cross_height` (fraction of size) tall."""
    s = size * SUPERSAMPLE
    img = Image.new("RGBA", (s, s), background)
    d = ImageDraw.Draw(img)
    h = cross_height * s
    bar = BAR * h
    arm_w = ARM_WIDTH * h
    top = (s - h) / 2
    cx = s / 2
    d.rectangle([cx - bar / 2, top, cx + bar / 2, top + h], fill="white")  # upright
    arm_y = top + ARM_TOP * h
    d.rectangle([cx - arm_w / 2, arm_y, cx + arm_w / 2, arm_y + bar], fill="white")  # crossbar
    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    black = (0, 0, 0, 255)
    clear = (0, 0, 0, 0)
    OUT.mkdir(parents=True, exist_ok=True)

    cross_image(1024, 0.62, black).convert("RGB").save(OUT / "icon.png")
    # Android crops adaptive icons to a circle/squircle using roughly the middle 66%, so the
    # foreground cross is kept well inside that area.
    cross_image(1024, 0.46, clear).save(OUT / "android-icon-foreground.png")
    Image.new("RGB", (1024, 1024), (0, 0, 0)).save(OUT / "android-icon-background.png")
    cross_image(1024, 0.46, clear).save(OUT / "android-icon-monochrome.png")
    cross_image(1024, 0.9, clear).save(OUT / "splash-icon.png")
    cross_image(48, 0.8, black).convert("RGB").save(OUT / "favicon.png")
    print(f"Wrote icons to {OUT}")


if __name__ == "__main__":
    main()
