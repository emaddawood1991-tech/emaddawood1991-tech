import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {ALIGN, LowerLimbModel} from '../components/Medical3D/LowerLimbModel';

/** Study stills for the lower-limb model. Props {state: 'typical'|'knock'|'bow'|'three', dist?: number} */
export const LimbStudy: React.FC<{state?: string; dist?: number}> = ({state = 'knock', dist = 130}) => {
  const cy = state === 'three' ? -24 : -32;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #31404f 0%, #121820 78%)'}}>
      <ThreeCanvas width={1080} height={1920} camera={{fov: 30, position: [0, cy, dist], near: 1, far: 800}} onCreated={({camera}) => camera.lookAt(0, cy, 0)} gl={{antialias: true, alpha: true}}>
        <hemisphereLight args={['#e3ecf3', '#40372c', 0.8]} />
        <directionalLight position={[40, 40, 90]} intensity={2.3} color="#fff1dc" />
        <directionalLight position={[-60, -10, 60]} intensity={0.9} color="#9cc7e6" />
        {state === 'three' ? (
          <>
            <group position={[-26, 0, 0]}><LowerLimbModel align={ALIGN.bow} /></group>
            <group position={[0, 0, 0]}><LowerLimbModel align={ALIGN.knock} /></group>
            <group position={[26, 0, 0]}><LowerLimbModel align={ALIGN.typical} /></group>
          </>
        ) : (
          <LowerLimbModel align={(ALIGN as any)[state]} />
        )}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
