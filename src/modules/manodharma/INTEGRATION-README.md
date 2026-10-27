# Manodharma integrated package

## Included
- `ManodharmaPractice.tsx`: the uploaded existing practice component, retained without functional edits.
- `ManodharmaKorvaiUI.tsx`: merged learning guide, five branches, book-alignment content, rhythmic/percussion section, Kōrvai calculator, and library.
- `manodharmaKorvaiEngine.ts`: merged calculation/content engine.
- `manodharma-and-korvai-master-suite.json`: merged dataset.
- `ManodharmaIntegrated.tsx`: integration shell with tabs for the existing practice page and the new learning/Kōrvai suite.

## How to integrate
1. Back up your current `src/modules/MusicBuilder` folder.
2. Copy these files into `src/modules/MusicBuilder/` (or adjust imports if you choose another folder).
3. In the parent page/router, replace the direct `ManodharmaPractice` render/import with `ManodharmaIntegrated` and pass the same `onBack` callback:

   ```tsx
   <ManodharmaIntegrated onBack={handleBack} />
   ```

4. Ensure `lucide-react` is installed, since the learning UI imports icons from it.
5. Run your normal TypeScript/build command and check the browser console.

## Notes / limits
- The existing component's imports into `../../data/ragas`, `../../store/useAppStore`, `../../audio/engine`, and `../../types/index` are retained. The integration wrapper assumes it sits in `src/modules/MusicBuilder/` with the same relative structure as the original component.
- Both modules remain mounted while switching tabs so the existing practice component's in-memory state is retained. Hidden content uses `display:none`.
- This package was assembled from the files available in this conversation. It has not been compiled against the complete app because the complete project, package manifest, and parent router were not uploaded. Run the build before publishing.
- No musical claims or source exercise notation have been independently certified by this integration step.
