import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AssemblePiece, CollageField, PaperCutout} from '../components/Collage';
import {ArabicText} from '../components/ArabicTitles';
import {loadFonts} from '../styles/fonts';

/** Style study for the optional collage technique (abstract "healthy posture" idea; no anatomy, no logo). Still/short-clip test only. */
export const CollageStudy: React.FC = () => {
  loadFonts();
  return (
    <AbsoluteFill>
      <CollageField color="#E9F2F4" />
      <AssemblePiece start={0} from="left"><PaperCutout seed="a" w={620} h={620} fill="#00A6A6" halftone={{color: '#0b5b5b', opacity: 0.35}} style={{left: 90, top: 420}} /></AssemblePiece>
      <AssemblePiece start={6} from="right"><PaperCutout seed="b" w={440} h={560} fill="#123B66" halftone={{color: '#ffffff', size: 12, opacity: 0.18}} sides={6} style={{left: 520, top: 700}} /></AssemblePiece>
      <AssemblePiece start={12} from="bottom"><PaperCutout seed="c" w={300} h={300} fill="#F5B53D" halftone={{color: '#b57300', opacity: 0.4}} sides={8} style={{left: 640, top: 360}} /></AssemblePiece>
      <AssemblePiece start={18} from="top"><PaperCutout seed="d" w={760} h={150} fill="#FFFFFF" sides={5} style={{left: 160, top: 1250}} /></AssemblePiece>
      <div style={{position: 'absolute', top: 1268, left: 160, width: 760, textAlign: 'center'}}><ArabicText size={52} weight={700} color="#123B66">وضعية الجلوس الصحيحة</ArabicText></div>
    </AbsoluteFill>
  );
};
