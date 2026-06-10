import React from 'react';
import * as Arwes from '@arwes/react';
import * as Fiber from '@react-three/fiber';
import * as DREI from '@react-three/drei';
import * as Router from 'react-router';
import * as THREE from 'three';
import './index.css';

function lerpCameraLook(state: Fiber.RootState, position: THREE.Vector3, delta: number): number {
    const oldQuat = state.camera.quaternion.clone();
    state.camera.lookAt(position);
    const distance = oldQuat.angleTo(state.camera.quaternion);
    state.camera.quaternion.copy(state.camera.quaternion.rotateTowards(oldQuat, distance * (1 - 0.9 * delta)));
    return distance;
}

export function Wrapper({ children }: React.PropsWithChildren): React.JSX.Element {
    return <div className="tesseract">
        <Fiber.Canvas flat linear>
            <DREI.AdaptiveDpr />
            <ambientLight />
            {children}
        </Fiber.Canvas>
    </div >;
}

export function Page({ children, position, focused, hidden }: { position: THREE.Vector3, focused?: boolean, hidden?: boolean } & React.PropsWithChildren): React.JSX.Element {
    const groupRef = React.useRef<THREE.Group>(null);
    const [hasLooked, setHasLooked] = React.useState(false);
    const [hasFocused, setHasFocused] = React.useState(false);

    Fiber.useFrame((state, delta) => {
        if (groupRef.current) {
            if (focused && !hasFocused) if (lerpCameraLook(state, groupRef.current.position, delta) <= 0.01) setHasFocused(true);

            if (!hasLooked) {
                groupRef.current.lookAt(state.camera.position);
                setHasLooked(true);
            }
        }
    });

    return <group position={position} ref={groupRef}>
        <DREI.Html transform occlude className='panel page'>
            <Arwes.Animator active={!hidden}>
                <Arwes.FrameCorners animated />
                {children}
            </Arwes.Animator>
        </DREI.Html>
    </group>;
}

export function Modal({ title, blocking, children }: { title: string, blocking?: boolean } & React.PropsWithChildren): React.JSX.Element {
    const groupRef = React.useRef<THREE.Group>(null);
    const [hasLooked, setHasLooked] = React.useState(false);

    Fiber.useFrame((state, delta) => {
        if (groupRef.current && !hasLooked) if (lerpCameraLook(state, groupRef.current.position, delta) <= 0.01) setHasLooked(true);
    });

    return <group ref={groupRef}>
        <DREI.Html transform occlude className="panel modal" scale={1 / 3}>
            <Arwes.Animator duration={{ enter: 1.5, exit: 1.5 }}>
                <Arwes.FrameKranox animated />
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