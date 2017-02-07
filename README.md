# Add `unicode_version` to emoji JSON map

This project has been **deprecated** in favor of https://github.com/MadLittleMods/emoji-unicode-version

Add the unicode version for each emoji in a emojione/gemojione JSON map


```
npm start
```

`emojis.json` is from https://github.com/jonathanwiesel/gemojione/blob/3d5dc04e9eae5a85e1e2de6727da6a882b79f256/config/index.json

`dist/emojis.json` holds the transformed data with `unicode_version` property


## Some differences

I noticed a few differences from the [gemojione](https://github.com/jonathanwiesel/gemojione/blob/3d5dc04e9eae5a85e1e2de6727da6a882b79f256/config/index.json) and [emojione](https://github.com/Ranks/emojione/blob/1a3227ac635b0fc456985b3a00e63492c225d254/lib/js/emojione.js) JSON maps and updated to the latest emojione.

 - `large_blue_circle` -> `blue_circle`: https://github.com/Ranks/emojione/commit/dbf2df55150fbcce295e480aede2c603fb51ec12
 - `ten` -> `keycap_ten`: https://github.com/Ranks/emojione/commit/48ab43b4af82f752a84065913ee6b47b01398b86
