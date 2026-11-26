import numpy as np, soundfile as sf, subprocess
from kokoro_onnx import Kokoro
k=Kokoro('/tmp/kokoro/kokoro-v1.0.onnx','/tmp/kokoro/voices-v1.0.bin')
t=["Unlock five powerful Windows tools with one shortcut. Hold the Windows key, and press R.","Number forty-one. Task Schedule dot M S C opens Task Scheduler."]
out=[np.zeros(3600,dtype=np.float32)]
for s in t:
    x,sr=k.create(s,voice='am_adam',speed=1.04,lang='en-us'); out+=[x.astype(np.float32),np.zeros(int(.25*sr),dtype=np.float32)]
sf.write('/tmp/w_raw.wav',np.concatenate(out),sr)
subprocess.run(['ffmpeg','-v','error','-y','-i','/tmp/w_raw.wav','-af','highpass=f=110,equalizer=f=200:t=q:w=1:g=-1,equalizer=f=3600:t=q:w=1:g=3,acompressor=threshold=-20dB:ratio=3:attack=4:release=70:makeup=3,loudnorm=I=-15:TP=-1.5:LRA=9','-t','11','-b:a','192k','voice-sample-windows-10s.mp3'],check=True)
