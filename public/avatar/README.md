# Bloomy avatar art

Every file in this folder is a placeholder made from simple shapes. You can replace any of them without touching code.

## How a character is built
The app stacks one SVG per layer, from bottom to top:

`hairBack → body → bottom → shoes → top → outerwear → face → hairFront → accessory`

Each layer lives at `public/avatar/{layer}/{itemId}.svg`. For example, the hoodie is `top/hoodie.svg` and its hair is `hairFront/bob.svg` plus `hairBack/bob.svg`. The item ids are listed in `lib/avatar.ts` (`CATALOG`).

## Replacing a placeholder
1. In Figma, draw on a **512 × 768** artboard. Use the **same artboard and position** as `body/base.svg`, so every layer lines up:
   - head centre ≈ (256, 222)
   - shoulders ≈ y 380
   - waist ≈ y 540
   - soles ≈ y 745
2. Keep the style: rounded shapes, flat pastel colours, soft or no outlines, and modest clothing.
3. **Colourable parts** must use these fills:
   - `fill="var(--c1)"`: main colour (hair colour, or the item's chosen colour)
   - `fill="var(--c2)"`: second colour (trim, sole, highlight)
   - `var(--skin)` and `var(--skin-shade)`: only in `body/base.svg`
   - `var(--blush)`: cheeks in `face/*.svg`

   Every other fill can be a normal hex colour.
4. In `face/*.svg`, keep both eyes inside `<g class="av-eyes">` so they blink. The mouth is drawn by the app from today's mood, so don't draw one.
5. Export as SVG and give it **exactly the same file name**. Don't include scripts, raster images, or `id`s that could clash between layers. Keep comments free of `--`.
6. Check the result in the app on the "Миний дүр" → Шүүгээ screen.

## Adding a new item
1. Add the SVG at `public/avatar/{layer}/{newId}.svg`.
2. Add an entry to `CATALOG` in `lib/avatar.ts` with its name, price (🌸), level and default colours.

All art here is original and was made for Bloomy. Don't add third-party character art unless its licence has been approved.
