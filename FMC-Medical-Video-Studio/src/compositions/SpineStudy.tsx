import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {SpineModel, NORMAL_SPINE} from '../components/Medical3D/SpineModel';

/** Study stills for the spine model (not part of any episode). Props: {view: 'lateral' | 'posterior'} */
export const SpineStudy: React.FC<{view?: string}> = ({view = 'lateral'}) => {
  const lateral = view === 'lateral';
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 35%, #2b3440 0%, #12171d 75%)'}}>
      <ThreeCanvas width={1080} height={1920} camera={{fov: 30, position: lateral ? [-175, 0, 0] : [0, 0, -135], near: 1, far: 800}} onCreated={({camera}) => camera.lookAt(0, 0, 0)} gl={{antialias: true, alpha: true}}>
        <hemisphereLight args={['#dfe9f2', '#40372c', 0.7]} />
        <directionalLight position={lateral ? [-80, 50, 40] : [30, 50, -90]} intensity={2.4} color="#fff1dc" />
        <directionalLight position={[60, -10, 60]} intensity={0.9} color="#9cc7e6" />
        {lateral ? (
          <>
            <group position={[0, 0, -11]}><SpineModel {...NORMAL_SPINE} /></group>
            <group position={[0, 0, 11]}><SpineModel {...NORMAL_SPINE} kyphosis={68} highlight="thoracic" highlightAmount={0.9} /></group>
          </>
        ) : (
          <SpineModel {...NORMAL_SPINE} scoliosis={1} />
        )}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
