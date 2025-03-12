# Custom Fonts

This directory contains custom fonts used in the application.

## Required Font Files

Please add the following font files to this directory:

1. `ABCDiatype-Regular.woff2`
2. `ABCDiatype-Regular.woff`
3. `ABCDiatypeMono-Regular.woff2`
4. `ABCDiatypeMono-Regular.woff`

## How to Add Fonts

1. Purchase or obtain the font files from the appropriate source
2. Convert the fonts to woff and woff2 formats if needed (you can use online converters like FontSquirrel)
3. Place the font files in this directory
4. The application will automatically load these fonts

## Adding More Fonts

To add more custom fonts:

1. Add the font files to this directory
2. Update the `src/app/styles/fonts.css` file to include the new font definitions
3. Update the `FONT_OPTIONS` array in `src/app/components/Toolbar components/textControls.tsx` to include the new fonts
