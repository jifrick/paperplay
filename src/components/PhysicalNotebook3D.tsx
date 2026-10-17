import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject, ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { NotebookState } from './PhysicalNotebook';

const PAGE_COUNT = 7;
// Keep the stack visible, but prove the hinge and bend with one excellent
// sheet before introducing another moving surface.
const TURNING_PAGES = 1;
const NOTEBOOK_WIDTH = 2.78;
const NOTEBOOK_HEIGHT = 3.34;
const HINGE_X = 0;
const COVER_DEPTH = 0.13;
const PAPER_DEPTH = 0.18;
const PAGE_SEGMENTS_X = 12;
const PAGE_SEGMENTS_Y = 10;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeInOut = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

const makePaperTexture = (side: 'front' | 'back', page: number) => {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const context = canvas.getContext('2d');
  if (!context) return null;

  context.fillStyle = '#fff8ed';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(185, 212, 232, .72)';
  context.lineWidth = 1.4;
  for (let y = 48; y < canvas.height; y += 55) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }
  context.strokeStyle = 'rgba(223, 150, 157, .72)';
  context.beginPath();
  context.moveTo(52, 0);
  context.lineTo(52, canvas.height);
  context.stroke();
  for (let index = 0; index < 420; index += 1) {
    const x = (index * 83 + page * 31) % canvas.width;
    const y = (index * 47 + page * 17) % canvas.height;
    context.fillStyle = index % 2 ? 'rgba(103, 86, 75, .035)' : 'rgba(255, 255, 255, .28)';
    context.fillRect(x, y, 1, 1);
  }

  context.fillStyle = side === 'front' ? 'rgba(81, 71, 74, .72)' : 'rgba(81, 71, 74, .54)';
  context.font = '31px Caveat, cursive';
  context.rotate(side === 'front' ? -0.015 : 0.012);
  context.fillText(side === 'front' ? (page === 1 ? 'write two names' : 'maybe... ♡') : 'keep this secret', 82, 112);
  context.font = '25px Caveat, cursive';
  context.fillText(side === 'front' ? 'A̶  +  B̶' : 'F  L  A  M  E  S', 88, 218);
  context.fillText(side === 'front' ? '2 + 2 = 4  ✓' : 'count again?', 88, 330);
  context.fillText(side === 'front' ? '♡  underline this' : 'xoxo', 88, 442);
  context.strokeStyle = 'rgba(242, 85, 117, .38)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(94, 229);
  context.lineTo(145, 210);
  context.stroke();
  context.beginPath();
  context.arc(380, 170, 23, 0, Math.PI * 1.7);
  context.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

const makeCoverTexture = (inside = false) => {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 860;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (inside) {
    context.fillStyle = 'rgba(255, 224, 222, .86)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = 'rgba(190, 73, 103, .28)';
    context.lineWidth = 4;
    context.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);
    context.fillStyle = 'rgba(112, 47, 64, .54)';
    context.font = '34px Caveat, cursive';
    context.fillText('turn the page', 68, 110);
    context.font = '22px Caveat, cursive';
    context.fillText('notes, doodles & little secrets', 68, 150);
  } else {
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.font = '92px Caveat, cursive';
    context.fillText('my', canvas.width / 2, 380);
    context.font = '700 62px Space Grotesk, sans-serif';
    context.fillText('NOTEBOOK', canvas.width / 2, 465);
    context.font = '34px Caveat, cursive';
    context.fillText('paper games & big feelings', canvas.width / 2, 525);
    context.font = '48px Caveat, cursive';
    context.textAlign = 'right';
    context.fillStyle = 'rgba(255, 255, 255, .8)';
    context.fillText('xoxo', canvas.width - 68, canvas.height - 75);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const createSheetGeometry = () => {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= PAGE_SEGMENTS_Y; row += 1) {
    const v = row / PAGE_SEGMENTS_Y;
    for (let column = 0; column <= PAGE_SEGMENTS_X; column += 1) {
      const u = column / PAGE_SEGMENTS_X;
      positions.push(u * NOTEBOOK_WIDTH, 0, (0.5 - v) * NOTEBOOK_HEIGHT);
      uvs.push(u, 1 - v);
    }
  }
  const columns = PAGE_SEGMENTS_X + 1;
  for (let row = 0; row < PAGE_SEGMENTS_Y; row += 1) {
    for (let column = 0; column < PAGE_SEGMENTS_X; column += 1) {
      const topLeft = row * columns + column;
      const topRight = topLeft + 1;
      const bottomLeft = topLeft + columns;
      const bottomRight = bottomLeft + 1;
      indices.push(topLeft, topRight, bottomLeft, topRight, bottomRight, bottomLeft);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
};

type AnimationContext = { state: NotebookState; time: MutableRefObject<number> };
const AnimationContext = createContext<AnimationContext | null>(null);

const getPageProgress = (state: NotebookState, time: number, pageIndex: number) => {
  if (state === 'closed' || state === 'opening' || state === 'open') return 0;
  if (state === 'flipping') {
    if (pageIndex >= TURNING_PAGES) return 0;
    return easeInOut(time / 0.96);
  }
  if (pageIndex >= TURNING_PAGES) return 0;
  return 1 - easeInOut(time / 0.78);
};

const RoundedBoxMesh = ({ size, radius, smoothness, position, children }: { size: [number, number, number]; radius: number; smoothness: number; position?: [number, number, number]; children: ReactNode }) => {
  const geometry = useMemo(() => new RoundedBoxGeometry(size[0], size[1], size[2], smoothness, radius), [radius, size, smoothness]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} position={position}>{children}</mesh>;
};

const NotebookSheet = ({ pageIndex }: { pageIndex: number }) => {
  const animation = useContext(AnimationContext);
  const group = useRef<THREE.Group>(null);
  const geometry = useMemo(createSheetGeometry, []);
  const frontTexture = useMemo(() => makePaperTexture('front', pageIndex + 1), [pageIndex]);
  const backTexture = useMemo(() => makePaperTexture('back', pageIndex + 1), [pageIndex]);
  const previousProgress = useRef(-1);

  useEffect(() => () => {
    geometry.dispose();
    frontTexture?.dispose();
    backTexture?.dispose();
  }, [backTexture, frontTexture, geometry]);

  useFrame(() => {
    if (!animation || !group.current) return;
    const progress = getPageProgress(animation.state, animation.time.current, pageIndex);
    // The spine runs along Z, so the sheet turns around Z from the right
    // half of the notebook to the left half, passing through a real lift.
    group.current.rotation.z = progress * Math.PI;
    group.current.position.y = 0.09 + (PAGE_COUNT - 1 - pageIndex) * 0.004;
    const curl = Math.sin(progress * Math.PI);
    if (Math.abs(progress - previousProgress.current) > 0.0005) {
      const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let index = 0; index < positions.count; index += 1) {
        const x = positions.getX(index) / NOTEBOOK_WIDTH;
        const edgeLift = Math.pow(x, 1.8) * curl * 0.24;
        const bow = Math.sin(Math.PI * x) * curl * 0.16;
        positions.setY(index, edgeLift + bow);
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      previousProgress.current = progress;
    }
  });

  return <group ref={group} position={[HINGE_X, 0.09 + (PAGE_COUNT - 1 - pageIndex) * 0.004, 0]}>
    <mesh geometry={geometry} position={[0, -0.006, 0]}>
      <meshStandardMaterial map={frontTexture ?? undefined} color="#fff8ed" roughness={0.86} side={THREE.FrontSide} />
    </mesh>
    <mesh geometry={geometry}>
      <meshStandardMaterial map={backTexture ?? undefined} color="#fff8ed" roughness={0.9} side={THREE.BackSide} />
    </mesh>
  </group>;
};

const CoverArtwork = ({ texture, position, rotation = [0, 0, 0] }: { texture: THREE.Texture | null; position: [number, number, number]; rotation?: [number, number, number] }) => {
  const geometry = useMemo(() => new THREE.PlaneGeometry(NOTEBOOK_WIDTH - 0.2, NOTEBOOK_HEIGHT - 0.2), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} position={position} rotation={rotation}>
    <meshBasicMaterial map={texture ?? undefined} transparent depthWrite={false} side={THREE.DoubleSide} />
  </mesh>;
};

const NotebookModel = ({ state }: { state: NotebookState }) => {
  const time = useRef(0);
  const cover = useRef<THREE.Group>(null);
  const animation = useMemo<AnimationContext>(() => ({ state, time }), [state]);
  const coverTexture = useMemo(() => makeCoverTexture(false), []);
  const insideTexture = useMemo(() => makeCoverTexture(true), []);

  useEffect(() => {
    time.current = 0;
  }, [state]);

  useEffect(() => () => {
    coverTexture?.dispose();
    insideTexture?.dispose();
  }, [coverTexture, insideTexture]);

  useFrame((_, delta) => {
    time.current += delta;
    if (!cover.current) return;
    let coverProgress = 0;
    if (state === 'opening') coverProgress = easeInOut(time.current / 0.96);
    if (state === 'open' || state === 'flipping') coverProgress = 1;
    // Keep the cover open while the sheet returns to the stack, then reverse
    // the same hinge motion instead of swapping to a closed pose.
    if (state === 'closing') coverProgress = 1 - easeInOut((time.current - 0.9) / 0.82);
    // The front cover shares the same Z-axis hinge as the paper.
    cover.current.rotation.z = coverProgress * Math.PI;
  });

  return <AnimationContext.Provider value={animation}>
    <group>
      <RoundedBoxMesh size={[NOTEBOOK_WIDTH, COVER_DEPTH, NOTEBOOK_HEIGHT]} radius={0.11} smoothness={4} position={[NOTEBOOK_WIDTH / 2, -0.16, 0]}>
        <meshStandardMaterial color="#df637d" roughness={0.74} />
      </RoundedBoxMesh>
      <RoundedBoxMesh size={[NOTEBOOK_WIDTH - 0.04, PAPER_DEPTH, NOTEBOOK_HEIGHT - 0.04]} radius={0.08} smoothness={3} position={[NOTEBOOK_WIDTH / 2, -0.015, 0]}>
        <meshStandardMaterial color="#fff8ed" roughness={0.96} />
      </RoundedBoxMesh>
      {Array.from({ length: PAGE_COUNT }, (_, pageIndex) => <NotebookSheet key={pageIndex} pageIndex={pageIndex} />)}

      <group position={[HINGE_X - 0.045, 0.1, 0]}>
        <RoundedBoxMesh size={[0.14, 0.2, NOTEBOOK_HEIGHT - 0.02]} radius={0.06} smoothness={3}>
          <meshStandardMaterial color="#b94f69" roughness={0.62} />
        </RoundedBoxMesh>
        {Array.from({ length: 5 }, (_, index) => <mesh key={index} position={[0.02, 0.12, 1.12 - index * 0.56]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.12, 0.024, 8, 18, Math.PI * 1.22]} />
          <meshStandardMaterial color="#9f3f59" roughness={0.55} />
        </mesh>)}
      </group>

      <group ref={cover} position={[HINGE_X, 0.16, 0]}>
        <RoundedBoxMesh size={[NOTEBOOK_WIDTH, COVER_DEPTH, NOTEBOOK_HEIGHT]} radius={0.11} smoothness={4} position={[NOTEBOOK_WIDTH / 2, 0, 0]}>
          <meshStandardMaterial color="#ea7088" roughness={0.68} />
        </RoundedBoxMesh>
        <CoverArtwork texture={coverTexture} position={[NOTEBOOK_WIDTH / 2, COVER_DEPTH / 2 + 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} />
        <CoverArtwork texture={insideTexture} position={[NOTEBOOK_WIDTH / 2, -COVER_DEPTH / 2 - 0.008, 0]} rotation={[Math.PI / 2, 0, 0]} />
      </group>
    </group>
    <mesh position={[0, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.8, 0.72, 1]}>
      <planeGeometry args={[5.2, 3.9]} />
      <meshBasicMaterial color="#603847" transparent opacity={0.12} depthWrite={false} />
    </mesh>
  </AnimationContext.Provider>;
};

export const PhysicalNotebook3D = ({ state }: { state: NotebookState }) => <Canvas className="pp-book-canvas" dpr={[1, 1.5]} frameloop={state === 'closed' ? 'demand' : 'always'} camera={{ position: [5.5, 6.5, 7.2], fov: 30 }} onCreated={({ camera }) => camera.lookAt(0.35, 0, 0)} gl={{ antialias: true, alpha: true }} aria-hidden="true">
  <ambientLight intensity={1.45} />
  <directionalLight position={[-3, 5, 6]} intensity={2.2} color="#fff6ee" />
  <directionalLight position={[4, 1, 2]} intensity={0.9} color="#f9a4b1" />
  <NotebookModel state={state} />
</Canvas>;

export default PhysicalNotebook3D;
