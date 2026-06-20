import React from 'react';
import { createPortal } from 'react-dom';
import * as Arwes from '@arwes/react';
import * as ArwesEffects from '@arwes/react-effects';
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

interface IWrapperContext {
    backgroundColor: string;
}

const WrapperContext = React.createContext<{ tesseractContext: IWrapperContext, setTesseractContext: (value: IWrapperContext) => void }>(null);

const OverlayContext = React.createContext<HTMLDivElement>(null);

export function useTessractContext(): { tesseractContext: IWrapperContext, setTesseractContext: (value: IWrapperContext) => void } {
    return React.useContext(WrapperContext);
}

export function Wrapper({ children }: React.PropsWithChildren): React.JSX.Element {
    const [tesseractContext, setTesseractContext] = React.useState<IWrapperContext>({ backgroundColor: "black" });
    const [overlay, setOverlay] = React.useState<HTMLDivElement>(null);

    const containerRef = React.useRef<HTMLDivElement>(null);

    return <WrapperContext value={{ tesseractContext, setTesseractContext }}>
        <OverlayContext value={overlay}>
            <div ref={containerRef} className="tesseract">
                <DREI.View className="tesseract" style={{ backgroundColor: tesseractContext.backgroundColor }}>
                    <ModalProvider>
                        <DREI.AdaptiveDpr />
                        <ambientLight />
                        {children}
                    </ModalProvider>
                </DREI.View>
                <Fiber.Canvas eventSource={containerRef} style={{ zIndex: 1000000 }} shadows>
                    <DREI.View.Port />
                </Fiber.Canvas>
            </div>
        </OverlayContext>
        <div ref={setOverlay} className="page" />
    </WrapperContext>;
}

export function Page({ children, position, focused, hidden, xray }: { position: THREE.Vector3, focused?: boolean, hidden?: boolean, xray?: boolean } & React.PropsWithChildren): React.JSX.Element {
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
        <DREI.Html transform occlude={!xray} className='panel page'>
            <Arwes.Animator active={!hidden}>
                <Arwes.FrameCorners className="page-frame" animated />
                <ArwesEffects.Illuminator />
                {children}
            </Arwes.Animator>
        </DREI.Html>
    </group>;
}

export interface IModalContext extends React.PropsWithChildren {
    title: string,
    body?: string,
}

const ModalContext = React.createContext<{ ctx: IModalContext, setCtx: (value: IModalContext) => void }>(null);

export function useModal(context: IModalContext, active: boolean): void {
    const { ctx, setCtx } = React.useContext(ModalContext);
    React.useEffect(() => {
        setCtx(active ? context : null);
        return (): void => { if (ctx === context) setCtx(null); };
    }, [context, ctx, active]);
    React.useEffect(() => { if (!ctx && active) { setCtx(context); } }, [context, ctx, active]);
}

function ModalProvider({ children }: React.PropsWithChildren): React.JSX.Element {
    const [ctx, setCtx] = React.useState<IModalContext>(null);
    const [oldCtx, setOldCtx] = React.useState<IModalContext>(null);
    React.useEffect(() => { if (ctx) setOldCtx(ctx); }, [ctx]);
    return <ModalContext value={{ ctx, setCtx }}>
        {children}
        {oldCtx && <Modal active={!!ctx} title={oldCtx.title} body={oldCtx?.body}>
            {oldCtx?.children}
        </Modal>}
    </ModalContext>;
}

function Modal({ active, title, body, children }: { active: boolean } & IModalContext): React.JSX.Element {
    const groupRef = React.useRef<THREE.Group>(null);
    const [hasLooked, setHasLooked] = React.useState(false);

    Fiber.useFrame((state, delta) => {
        if (groupRef.current && !hasLooked) if (lerpCameraLook(state, groupRef.current.position, delta) <= 0.01) setHasLooked(true);
    });

    return <group ref={groupRef}>
        <DREI.Html transform occlude className="panel modal page" scale={1 / 3}>
            <Arwes.Animator active={active}>
                <Arwes.FrameKranox animated className="modal-frame" />
                <Arwes.Text as="h1" manager="decipher" easing="outSine" fixed>{title}</Arwes.Text>
                <Arwes.Text as="div">{body}</Arwes.Text>
                {children}
            </Arwes.Animator>
        </DREI.Html>
    </group>;
}

export function Overlay({ children }: React.PropsWithChildren): React.JSX.Element {
    const overlay = React.useContext(OverlayContext);
    return <DREI.Html>{overlay && createPortal(
        <div className="overlay">
            {children}
        </div>,
        overlay
    )}</DREI.Html>;
}