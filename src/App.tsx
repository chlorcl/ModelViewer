import {Canvas, ThreeElements} from '@react-three/fiber'
import * as THREE from 'three'
import {useEffect, useRef, useState} from 'react';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu, MenubarSeparator,
  MenubarTrigger
} from './components/ui/menubar.tsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './components/ui/dialog.tsx';
import {Label} from './components/ui/label.tsx';
import {Input} from './components/ui/input.tsx';
import {Button} from './components/ui/button.tsx';
import {Center, useGLTF} from '@react-three/drei';

interface GyroData {
  x: number,
  y: number,
  z: number
}

function Box(props: ThreeElements['mesh']) {
  const ref = useRef<THREE.Mesh>(null!);
  return (
    <mesh
      {...props}
      ref={ref}>
      <boxGeometry args={[1, 1, 1]}/>
      <meshStandardMaterial color='orange'/>
    </mesh>
  )
}

function Scene(props: {
  modelRotation?: [number, number, number],
  gltf?: string,
  modelScale: number,
  rotation: [number, number, number]
}) {
  const modelRotation = props.modelRotation || [0, 0, 0];
  const unifiedRotation: [number, number, number] = [props.rotation[0] + modelRotation[0], props.rotation[1] + modelRotation[1], props.rotation[2] + modelRotation[2]];
  const {scene} = useGLTF(props.gltf || '/test.glb');

  if (props.gltf) {
    return (
      <Canvas className='h-full w-full' camera={{position: [0, 0, 5]}}>
        <ambientLight intensity={Math.PI / 2}/>
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI}/>
        <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI}/>
        <Center rotation={unifiedRotation} scale={props.modelScale}>
          <primitive object={scene}/>
        </Center>
      </Canvas>
    )
  }

  return (
    <Canvas className='h-full w-full' camera={{position: [0, 0, 5]}}>
      <ambientLight intensity={Math.PI / 2}/>
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI}/>
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI}/>
      <Box rotation={unifiedRotation} scale={props.modelScale}/>
    </Canvas>
  )
}

function App() {
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [connectionUrl, setConnectionUrl] = useState(window.location.origin);
  const [changeConnectionUrl, setChangeConnectionUrl] = useState(true);
  const [modelRotation, setModelRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [modelScale, setModelScale] = useState<number>(1);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [model, setModel] = useState<string | null>(null);

  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (changeConnectionUrl) {
      if (eventSource) {
        eventSource.close();
      }

      setConnectionError(null);
      const source = new EventSource(`${connectionUrl}/events`);

      source.addEventListener('open', () => {
        console.log('Connection established');
      });

      source.addEventListener('error', () => {
        setConnectionError('Connection could not be established');
        source.close();
      });

      source.addEventListener('data', (event) => {
        const data: GyroData = JSON.parse(event.data);
        setRotation([data.x, data.z, data.y]);
      });
      setEventSource(source);
      setChangeConnectionUrl(false);
    }
  }, [connectionUrl, changeConnectionUrl, eventSource]);

  return (
    <div style={{height: '100vh', width: '100vw'}}>
      <Menubar className='p-4 border-none flex justify-between rounded-none w-100'>
        <div className='flex gap-1'>
          <MenubarMenu>
            <MenubarTrigger>Setup</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => setConnectionDialogOpen(true)}>
                Setup connection
              </MenubarItem>
              <MenubarItem onClick={() => fetch(`${connectionUrl}/reset`).catch((e) => console.error(e))}>
                Reset device rotation
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Model</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => setModelDialogOpen(true)}>
                Load model
              </MenubarItem>
              <MenubarSeparator/>
              <MenubarItem
                onClick={() => setModelRotation(prevState => [prevState[0] + Math.PI / 2, prevState[1], prevState[2]])}>
                Rotate model (X) by 90°
              </MenubarItem>
              <MenubarItem
                onClick={() => setModelRotation(prevState => [prevState[0], prevState[1] + Math.PI / 2, prevState[2]])}>
                Rotate model (Y) by 90°
              </MenubarItem>
              <MenubarItem
                onClick={() => setModelRotation(prevState => [prevState[0], prevState[1], prevState[2] + Math.PI / 2])}>
                Rotate model (Z) by 90°
              </MenubarItem>
              <MenubarSeparator/>
              <MenubarItem onClick={() => setModelScale(prevState => prevState + 0.1)}>
                Scale model by 0.1
              </MenubarItem>
              <MenubarItem onClick={() => setModelScale(prevState => prevState + 1)}>
                Scale model by 1
              </MenubarItem>
              <MenubarItem onClick={() => setModelScale(prevState => prevState - 0.1)}>
                Scale model by -0.1
              </MenubarItem>
              <MenubarItem onClick={() => setModelScale(prevState => prevState - 1)}>
                Scale model by -1
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </div>
        {connectionError && <p className='text-red-500 text-sm justify-self-end'>{connectionError}</p>}
      </Menubar>
      <Dialog open={connectionDialogOpen} onOpenChange={setConnectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setup websocket connection</DialogTitle>
            <DialogDescription>Configure the device connection adress</DialogDescription>
          </DialogHeader>
          <div className='flex flex-col gap-2'>
            <Label>Remote server URL (otherwise using host ip)</Label>
            <Input placeholder='http://0.0.0.0:port' onChange={e => setConnectionUrl(e.target.value)}
                   value={connectionUrl}/>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              setConnectionDialogOpen(false);
              setChangeConnectionUrl(true);
            }}>Set and use</Button>
            <Button variant='destructive' onClick={() => {
              setConnectionUrl(window.location.origin);
              setConnectionDialogOpen(false);
            }}>Cancel and reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load your own model (GLTF)</DialogTitle>
            <DialogDescription>Load your model here</DialogDescription>
          </DialogHeader>
          <div className='flex flex-col gap-2'>
            <Label>Model file (GLTF/GLB) url</Label>
            <Input type='file' onChange={(e) => {
              const file = e.target.files?.item(0);
              if (!file) return;
              const formData = new FormData();
              formData.append('model', file);
              fetch(`${connectionUrl}/uploadModel`, {
                method: 'POST',
                body: formData
              }).then((res) => {
                if (res.status !== 404) {
                  setModel(`${connectionUrl}/model.glb`);
                }
              }).catch();
            }}/>
          </div>
          <DialogFooter>
            <Button onClick={() => setModelDialogOpen(false)}>Set</Button>
            <Button variant='secondary' onClick={() => {
              setModel(null);
              setModelDialogOpen(false);
            }}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Scene modelRotation={modelRotation} gltf={model} modelScale={modelScale} rotation={rotation}/>
    </div>
  )
}

export default App;
