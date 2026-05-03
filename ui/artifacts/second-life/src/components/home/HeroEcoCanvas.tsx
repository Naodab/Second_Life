import { Canvas, useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useLocation } from "wouter";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export type HeroCategoryPin = {
  id: string;
  name: string;
  href: string;
};

const SMALL_SPHERE_COLOR = "#5fae88";
const SMALL_SPHERE_EMISSIVE = "#1e4d38";

const RING_ORBIT_SPEEDS = [0.11, 0.145, 0.088] as const;

const CLUSTER_ICO_RADIUS = 1.15;

const ORBIT_RADIUS = 1.25 * CLUSTER_ICO_RADIUS;

const ORBIT_TUBE_RADIUS = 0.005;

const ORB_HIT_RADIUS = 0.14;

function ringPlaneQuaternions(): THREE.Quaternion[] {
  const xAxis = new THREE.Vector3(1, 0, 0);
  const zAxis = new THREE.Vector3(0, 0, 1);
  const qBase = new THREE.Quaternion().setFromAxisAngle(xAxis, -Math.PI / 2);
  return [0, 1, 2].map((k) => {
    const qZ = new THREE.Quaternion().setFromAxisAngle(zAxis, (k * 2 * Math.PI) / 3);
    return qZ.clone().multiply(qBase);
  });
}

function splitIntoThreeRings(pins: HeroCategoryPin[]): [HeroCategoryPin[], HeroCategoryPin[], HeroCategoryPin[]] {
  const a: HeroCategoryPin[] = [];
  const b: HeroCategoryPin[] = [];
  const c: HeroCategoryPin[] = [];
  pins.forEach((pin, i) => {
    if (i % 3 === 0) a.push(pin);
    else if (i % 3 === 1) b.push(pin);
    else c.push(pin);
  });
  return [a, b, c];
}

function ringPositions(items: HeroCategoryPin[]): { pin: HeroCategoryPin; angle: number }[] {
  const n = items.length;
  if (n === 0) return [];
  return items.map((pin, k) => ({
    pin,
    angle: (k / n) * Math.PI * 2 - Math.PI / 2,
  }));
}

function RingCircleLine({ radius }: { radius: number }) {
  return (
    <mesh>
      <torusGeometry args={[radius, ORBIT_TUBE_RADIUS, 12, 96]} />
      <meshBasicMaterial color="#3f3f3f" transparent opacity={0.62} depthWrite={false} />
    </mesh>
  );
}

const EARTH_MAP_URL = "/images/earth-map.jpg";

const EARTH_VS = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const EARTH_FS = /* glsl */ `
uniform sampler2D uMask;
uniform vec3 uOceanColor;
uniform vec3 uLandColor;
uniform float uBrightTheme;
varying vec2 vUv;
varying vec3 vNormal;
void main() {
  float seaMix = texture2D(uMask, vUv).r;
  vec3 base = mix(uLandColor, uOceanColor, seaMix);
  vec3 L = normalize(vec3(0.52, 0.74, 0.43));
  vec3 N = normalize(vNormal);
  float ndl = max(dot(N, L), 0.0);
  float ambLand = mix(0.13, 0.52, uBrightTheme);
  float ambSea = mix(0.50, 0.88, uBrightTheme);
  float ambient = mix(ambLand, ambSea, seaMix);

  float diffLand = mix(0.86, 0.46, uBrightTheme);
  float diffSea = mix(0.38, 0.14, uBrightTheme);
  float diffuse = mix(diffLand, diffSea, seaMix);

  vec3 lit = base * (ambient + diffuse * ndl);
  gl_FragColor = vec4(lit, 1.0);
}
`;

function jsSmoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function buildOceanLandMaskDataTexture(texture: THREE.Texture): THREE.DataTexture | null {
  const img = texture.image as CanvasImageSource & { width?: number; height?: number };
  const wRaw = typeof img.width === "number" ? img.width : 0;
  const hRaw = typeof img.height === "number" ? img.height : 0;
  if (!img || !wRaw || !hRaw) return null;

  const canvas = document.createElement("canvas");
  canvas.width = wRaw;
  canvas.height = hRaw;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  try {
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, wRaw, hRaw);
    const buf = new Uint8Array(wRaw * hRaw);
    const nPx = wRaw * hRaw;
    for (let i = 0; i < nPx; i++) {
      const o = i * 4;
      const r = data[o] / 255;
      const g = data[o + 1] / 255;
      const b = data[o + 2] / 255;
      const seaMix = jsSmoothstep(0.05, 0.26, b - Math.max(r, g));
      buf[i] = Math.round(seaMix * 255);
    }
    const tex = new THREE.DataTexture(buf, wRaw, hRaw, THREE.RedFormat, THREE.UnsignedByteType);
    tex.needsUpdate = true;
    tex.flipY = texture.flipY;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    tex.colorSpace = THREE.NoColorSpace;
    return tex;
  } catch {
    return null;
  }
}

function parseThemeRgbTriplet(css: string): [number, number, number] {
  const parts = css
    .trim()
    .split(/\s+/)
    .map(Number)
    .filter((n) => Number.isFinite(n));
  if (parts.length < 3) return [1, 0.96, 0.91];
  return [parts[0] / 255, parts[1] / 255, parts[2] / 255];
}

function applyCssRgbToColor(cssVarName: string, target: THREE.Color) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(cssVarName);
  const [r, g, b] = parseThemeRgbTriplet(raw);
  target.setRGB(r, g, b, THREE.SRGBColorSpace);
}

function EcoClusterMeshes({ innerRef }: { innerRef: RefObject<THREE.Mesh | null> }) {
  const earthMap = useLoader(THREE.TextureLoader, EARTH_MAP_URL);

  const oceanLandMask = useMemo(() => buildOceanLandMaskDataTexture(earthMap), [earthMap]);

  useEffect(() => () => oceanLandMask?.dispose(), [oceanLandMask]);

  useLayoutEffect(() => {
    earthMap.colorSpace = THREE.SRGBColorSpace;
    earthMap.anisotropy = 8;
  }, [earthMap]);

  const themedEarthMaterial = useMemo(() => {
    if (!oceanLandMask) return null;

    const uniOcean = new THREE.Color();
    const uniLand = new THREE.Color();
    applyCssRgbToColor("--hero-earth-ocean", uniOcean);
    applyCssRgbToColor("--hero-earth-land", uniLand);

    const bright = typeof document !== "undefined" ? !document.documentElement.classList.contains("dark") : true;
    return new THREE.ShaderMaterial({
      uniforms: {
        uMask: { value: oceanLandMask },
        uOceanColor: { value: uniOcean },
        uLandColor: { value: uniLand },
        uBrightTheme: { value: bright ? 1.0 : 0.0 },
      },
      vertexShader: EARTH_VS,
      fragmentShader: EARTH_FS,
      toneMapped: true,
    });
  }, [oceanLandMask]);

  useEffect(
    () => () => {
      themedEarthMaterial?.dispose();
    },
    [themedEarthMaterial],
  );

  useFrame(() => {
    if (!themedEarthMaterial) return;
    themedEarthMaterial.uniforms.uBrightTheme.value =
      typeof document !== "undefined" && !document.documentElement.classList.contains("dark") ? 1.0 : 0.0;
    applyCssRgbToColor("--hero-earth-ocean", themedEarthMaterial.uniforms.uOceanColor.value as THREE.Color);
    applyCssRgbToColor("--hero-earth-land", themedEarthMaterial.uniforms.uLandColor.value as THREE.Color);
  });

  if (oceanLandMask && themedEarthMaterial) {
    return (
      <>
        <mesh ref={innerRef}>
          <sphereGeometry args={[CLUSTER_ICO_RADIUS, 64, 64]} />
          <primitive object={themedEarthMaterial} attach="material" />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[1.28, 1]} />
          <meshBasicMaterial color="#7dcca6" wireframe transparent opacity={0.26} depthWrite={false} />
        </mesh>
      </>
    );
  }

  return (
    <>
      <mesh ref={innerRef}>
        <sphereGeometry args={[CLUSTER_ICO_RADIUS, 64, 64]} />
        <meshStandardMaterial map={earthMap} metalness={0.08} roughness={0.72} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.28, 1]} />
        <meshBasicMaterial color="#7dcca6" wireframe transparent opacity={0.26} depthWrite={false} />
      </mesh>
    </>
  );
}

type OrbProps = {
  pin: HeroCategoryPin;
  position: [number, number, number];
  active: boolean;
  sharedColor: THREE.Color;
  emissiveBase: THREE.Color;
  onHoverChange: (pin: HeroCategoryPin | null) => void;
};

function CategoryOrb({ pin, position, active, sharedColor, emissiveBase, onHoverChange }: OrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [, setLocation] = useLocation();

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh || active) return;
    mesh.rotation.y += delta * 1.15;
    mesh.rotation.x += delta * 0.26;
  });

  const pointerHandlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      document.body.style.cursor = "pointer";
      onHoverChange(pin);
    },
    onPointerOut: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      document.body.style.cursor = "auto";
      onHoverChange(null);
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      setLocation(pin.href);
    },
  };

  return (
    <group position={position}>
      <mesh {...pointerHandlers}>
        <sphereGeometry args={[ORB_HIT_RADIUS, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.072, 20, 20]} />
        <meshStandardMaterial
          color={sharedColor}
          metalness={0.42}
          roughness={0.3}
          emissive={emissiveBase}
          emissiveIntensity={active ? 0.52 : 0.26}
        />
      </mesh>
    </group>
  );
}

type RingProps = {
  ringIndex: 0 | 1 | 2;
  planeQuat: THREE.Quaternion;
  entries: { pin: HeroCategoryPin; angle: number }[];
  activeId: string | null;
  sharedColor: THREE.Color;
  emissiveBase: THREE.Color;
  onHoverChange: (pin: HeroCategoryPin | null) => void;
};

function OrbitingRing({
  ringIndex,
  planeQuat,
  entries,
  activeId,
  sharedColor,
  emissiveBase,
  onHoverChange,
}: RingProps) {
  const beadsRef = useRef<THREE.Group>(null);
  const speed = RING_ORBIT_SPEEDS[ringIndex];

  useFrame((_, delta) => {
    const g = beadsRef.current;
    if (!g) return;
    g.rotation.z += delta * speed;
  });

  return (
    <group quaternion={planeQuat}>
      <RingCircleLine radius={ORBIT_RADIUS} />
      <group ref={beadsRef}>
        {entries.map(({ pin, angle }) => (
          <CategoryOrb
            key={pin.id}
            pin={pin}
            position={[Math.cos(angle) * ORBIT_RADIUS, Math.sin(angle) * ORBIT_RADIUS, 0]}
            active={activeId === pin.id}
            sharedColor={sharedColor}
            emissiveBase={emissiveBase}
            onHoverChange={onHoverChange}
          />
        ))}
      </group>
    </group>
  );
}

function HeroSphereAndRings({
  ringData,
  activeId,
  sharedColor,
  emissiveBase,
  onHoverChange,
}: {
  ringData: {
    ringIndex: 0 | 1 | 2;
    planeQuat: THREE.Quaternion;
    entries: { pin: HeroCategoryPin; angle: number }[];
  }[];
  activeId: string | null;
  sharedColor: THREE.Color;
  emissiveBase: THREE.Color;
  onHoverChange: (pin: HeroCategoryPin | null) => void;
}) {
  const tiltRef = useRef<THREE.Group>(null);
  const innerIcoRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const g = tiltRef.current;
    const m = innerIcoRef.current;
    if (!g || !m) return;
    const t = state.clock.elapsedTime;
    const mx = state.pointer.x;
    const my = state.pointer.y;
    g.rotation.y = t * 0.12 + mx * 0.45;
    g.rotation.x = my * 0.35;
    m.rotation.y = -t * 0.25;
    m.rotation.z = t * 0.08;
  });

  return (
    <group ref={tiltRef}>
      <EcoClusterMeshes innerRef={innerIcoRef} />
      {ringData.map(({ ringIndex, planeQuat, entries }) => (
        <OrbitingRing
          key={ringIndex}
          ringIndex={ringIndex}
          planeQuat={planeQuat}
          entries={entries}
          activeId={activeId}
          sharedColor={sharedColor}
          emissiveBase={emissiveBase}
          onHoverChange={onHoverChange}
        />
      ))}
    </group>
  );
}

function Scene({
  pins,
  onHoverPin,
}: {
  pins: HeroCategoryPin[];
  onHoverPin: (pin: HeroCategoryPin | null) => void;
}) {
  const rings = useMemo(() => splitIntoThreeRings(pins), [pins]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sharedColor = useMemo(() => new THREE.Color(SMALL_SPHERE_COLOR), []);
  const emissiveBase = useMemo(() => new THREE.Color(SMALL_SPHERE_EMISSIVE), []);

  const planeQuats = useMemo(() => ringPlaneQuaternions(), []);

  const ringData = useMemo(
    () =>
      rings.map((items, i) => ({
        ringIndex: i as 0 | 1 | 2,
        planeQuat: planeQuats[i],
        entries: ringPositions(items),
      })),
    [rings, planeQuats],
  );

  const onHoverChange = (pin: HeroCategoryPin | null) => {
    setActiveId(pin?.id ?? null);
    onHoverPin(pin);
  };

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 6]} intensity={1.05} />
      <directionalLight position={[-4, -2, -3]} intensity={0.35} color="#a8e0c5" />

      <HeroSphereAndRings
        ringData={ringData}
        activeId={activeId}
        sharedColor={sharedColor}
        emissiveBase={emissiveBase}
        onHoverChange={onHoverChange}
      />
    </>
  );
}

export default function HeroEcoCanvas({
  pins = [],
  categoriesLoading = false,
  className,
}: {
  pins?: HeroCategoryPin[];
  categoriesLoading?: boolean;
  className?: string;
}) {
  const shown = useMemo(() => pins.slice(0, 12), [pins]);
  const [hoverPin, setHoverPin] = useState<HeroCategoryPin | null>(null);

  return (
    <div
      className={cn(
        "relative h-[min(420px,52vh)] w-full overflow-hidden rounded-3xl ring-1 ring-primary/25 shadow-[0_18px_60px_-34px_hsl(var(--primary)/0.22)]",
        className,
      )}
      style={{
        backgroundColor: `rgb(var(--hero-ecanvas-bg) / var(--hero-ecanvas-bg-alpha, 0.45))`,
      }}
    >
      <Canvas
        className="absolute inset-0 z-[2] h-full w-full touch-none"
        camera={{ position: [0, 0.35, 4.4], fov: 42 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <Scene pins={shown} onHoverPin={setHoverPin} />
        </Suspense>
      </Canvas>

      {hoverPin ? (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-[4] max-w-[min(92%,280px)] -translate-x-1/2 rounded-full border border-emerald-500/40 bg-emerald-950/92 px-3 py-1.5 text-center text-[10px] font-semibold leading-snug text-emerald-50 shadow-md sm:text-[11px]">
          <span className="line-clamp-2">{hoverPin.name}</span>
        </div>
      ) : null}

      {shown.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-[4] flex items-center justify-center p-6 text-center text-sm font-medium text-emerald-950/90 [text-shadow:0_1px_1px_rgba(255,255,255,0.6)] dark:text-emerald-100/95 dark:[text-shadow:0_2px_10px_rgba(0,0,0,0.55)]">
          {categoriesLoading ? "Đang tải danh mục…" : "Chưa có danh mục để hiển thị."}
        </div>
      ) : null}
    </div>
  );
}
