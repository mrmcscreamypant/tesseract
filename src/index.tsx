import React from 'react';
import * as Fiber from '@react-three/fiber';
import * as DREI from '@react-three/drei';
import * as Router from 'react-router';
import * as THREE from 'three';
import * as QUARKS from 'three.quarks';
import './index.css';
import modalParticle from './modal.json?url';

function lerpCameraLook(state: Fiber.RootState, position: THREE.Vector3, delta: number): void {
    const oldQuat = state.camera.quaternion.clone();
    state.camera.lookAt(position);
    state.camera.quaternion.copy(state.camera.quaternion.rotateTowards(oldQuat, oldQuat.angleTo(state.camera.quaternion) * (1 - 0.9 * delta)));
}

const MODAL_PARTICLE_SYSTEM = await new QUARKS.QuarksLoader().loadAsync(modalParticle);

export function Wrapper({ children }: React.PropsWithChildren): React.JSX.Element {
    return <div className="tesseract">
        <Fiber.Canvas flat linear>
            <DREI.AdaptiveDpr />
            <ambientLight />
            {children}
        </Fiber.Canvas>
    </div>;
}

export function Page({ children, position, focused }: { position: THREE.Vector3, focused?: boolean } & React.PropsWithChildren): React.JSX.Element {
    const groupRef = React.useRef<THREE.Group>(null);
    const [hasLooked, setHasLooked] = React.useState(false);

    Fiber.useFrame((state, delta) => {
        if (groupRef.current && focused) {
            lerpCameraLook(state, groupRef.current.position, delta);
            if (!hasLooked) {
                groupRef.current.lookAt(state.camera.position);
                setHasLooked(true);
            }
        }
    });

    return <group position={position} ref={groupRef}>
        <DREI.Html transform occlude>
            {children}
        </DREI.Html>
    </group>;
}

export function Modal({ title, blocking, children }: { title: string, blocking?: boolean } & React.PropsWithChildren): React.JSX.Element {
    const groupRef = React.useRef<THREE.Group>(null);

    const batchRenderer = React.useRef<QUARKS.BatchedRenderer>(new QUARKS.BatchedRenderer);

    React.useEffect(() => {
        const group = groupRef.current;
        MODAL_PARTICLE_SYSTEM.traverse(child => {
            if (child.type === 'ParticleEmitter') {
                batchRenderer.current.addSystem((child as QUARKS.ParticleEmitter).system);
            }
        });
        batchRenderer.current.position.y = 1.5;
        batchRenderer.current.position.z = -0.0005;
        group.add(MODAL_PARTICLE_SYSTEM, batchRenderer.current);
        return (): void => { group.remove(batchRenderer.current); };
    }, []);


    Fiber.useFrame((state, delta) => {
        if (groupRef.current) lerpCameraLook(state, groupRef.current.position, delta);
        batchRenderer.current.update(delta);
    });

    return <group ref={groupRef}>
        <DREI.Html transform occlude className="panel modal" scale={1 / 6}>
            <h1>{title}</h1>
            {children}
        </DREI.Html>
        <pointLight position={[0, 0.2, -0.01]} />
        <mesh position={[0, 0, -0.001]} scale={[6, 2, 1]}>
            <planeGeometry />
            <meshPhongMaterial />
        </mesh>
    </group>;
}

export function Link({ navigate, to, refresh, disabled, children, ...options }: { navigate: Router.NavigateFunction, to: string, refresh?: boolean, disabled?: boolean } & React.PropsWithChildren & Router.NavigateOptions): React.JSX.Element {
    return disabled ? <a>{children}</a> : refresh ? <a href={to}>{children}</a> : <a href="" onClick={event => { event.preventDefault(); void navigate(to, options); }}>{children}</a>;
}