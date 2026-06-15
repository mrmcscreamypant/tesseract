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

interface IWrapperContext {
    backgroundColor: string;
}

const WrapperContext = React.createContext<{ tesseractContext: IWrapperContext, setTesseractContext: (value: IWrapperContext) => void }>(null);

export function useTessractContext(): { tesseractContext: IWrapperContext, setTesseractContext: (value: IWrapperContext) => void } {
    return React.useContext(WrapperContext);
}

export function Wrapper({ children }: React.PropsWithChildren): React.JSX.Element {
    const [tesseractContext, setTesseractContext] = React.useState<IWrapperContext>({ backgroundColor: "black" });

    return <div className="tesseract" style={{ backgroundColor: tesseractContext.backgroundColor }}>
        <WrapperContext value={{ tesseractContext, setTesseractContext }}>
            <Fiber.Canvas flat linear>
                <ModalProvider>
                    <DREI.AdaptiveDpr />
                    <ambientLight />
                    {children}
                </ModalProvider>
            </Fiber.Canvas>
        </WrapperContext>
    </div>;
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
        <DREI.Html transform occlude className="panel modal" scale={1 / 3}>
            <Arwes.Animator active={active}>
                <Arwes.FrameKranox animated />
                <Arwes.Text as="h1" manager="decipher" easing="outSine" fixed>{title}</Arwes.Text>
                <Arwes.Text as="div">{body}</Arwes.Text>
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