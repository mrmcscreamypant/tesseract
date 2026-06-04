import React, { forwardRef } from 'react';
import * as Arwes from '@arwes/react';
import * as Theme from '@arwes/theme';
import * as Fiber from '@react-three/fiber';
import * as DREI from '@react-three/drei';
import * as Router from 'react-router';
import * as THREE from 'three';
import './index.css';

function lerpCameraLook(state: Fiber.RootState, position: THREE.Vector3, delta: number): void {
    const oldQuat = state.camera.quaternion.clone();
    state.camera.lookAt(position);
    state.camera.quaternion.copy(state.camera.quaternion.rotateTowards(oldQuat, oldQuat.angleTo(state.camera.quaternion) * (1 - 0.9 * delta)));
}

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
        if (groupRef.current) {
            if (focused) lerpCameraLook(state, groupRef.current.position, delta);
            if (!hasLooked) {
                groupRef.current.lookAt(state.camera.position);
                setHasLooked(true);
            }
        }
    });

    return <group position={position} ref={groupRef}>
        <DREI.Html transform occlude className='panel page'>
            <Arwes.Animator>
                <Arwes.FrameCorners styled animated />
                {children}
            </Arwes.Animator>
        </DREI.Html>
    </group>;
}

export function Modal({ title, blocking, children }: { title: string, blocking?: boolean } & React.PropsWithChildren): React.JSX.Element {
    const groupRef = React.useRef<THREE.Group>(null);

    Fiber.useFrame((state, delta) => {
        if (groupRef.current) lerpCameraLook(state, groupRef.current.position, delta);
    });

    return <group ref={groupRef}>
        <DREI.Html transform occlude className="panel modal" scale={1 / 3}>
            <Arwes.Animator duration={{ enter: 1.5, exit: 1.5 }}>
                <Arwes.FrameKranox animated positioned />
                <Arwes.Text as="h1" manager="decipher" easing="outSine" fixed>{title}</Arwes.Text>
                {children}
            </Arwes.Animator>
        </DREI.Html>
    </group>;
}

function LinkFrame(): React.JSX.Element {
    return <Arwes.Animator>
        <Arwes.FrameNefrex animated positioned />
    </Arwes.Animator>;
}

export function Link({ navigate, to, refresh, disabled, children, ...options }: { navigate: Router.NavigateFunction, to: string, refresh?: boolean, disabled?: boolean } & React.PropsWithChildren & Router.NavigateOptions): React.JSX.Element {
    return disabled ? <a className="link">
        <LinkFrame />
        {children}
    </a> : refresh ? <a className="link link-enabled" href={to}>
        <LinkFrame />
        {children}
    </a> : <a className="link link-enabled" href="" onClick={event => { event.preventDefault(); void navigate(to, options); }}>
        <LinkFrame />
        {children}
    </a>;
}