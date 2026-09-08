# 等高線小實驗室

一個給孩子使用的互動式 3D 等高線學習工具。使用者可以直接旋轉同一座山，從斜上方一路看到正上方，理解地形圖上的等高線就是山體上「相同高度的位置」連成的線。

## 開發

需要 Node.js 22。

```bash
npm install
npm run dev
```

其他指令：

```bash
npm test
npm run lint
npm run build
npm run preview
```

## 架構

- `src/terrain/presets.ts`：程式化地形高度函數
- `src/terrain/sampleHeightField.ts`：將高度函數取樣成規則 height field
- `src/terrain/buildTerrainGeometry.ts`：由同一份 height field 建立 Three.js terrain mesh
- `src/terrain/marchingSquares.ts`：Marching Squares 與線段 stitching
- `src/components/ContourLines.tsx`：把 contour polylines 畫成真正的 3D 線
- `src/components/CameraRig.tsx`：3D 與正上方視角的平滑切換

山體與等高線共用同一份 sampled height field，因此兩者永遠對應。等高線不是 texture 或另一張 2D 圖，而是由 Marching Squares 找出指定海拔與地形表面的交線，再直接放回 3D 世界中。
