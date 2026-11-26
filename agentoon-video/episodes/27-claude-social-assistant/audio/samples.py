import numpy as np, soundfile as sf, subprocess
from kokoro_onnx import Kokoro
k=Kokoro('/tmp/kokoro/kokoro-v1.0.onnx','/tmp/kokoro/voices-v1.0.bin')
CH={"robot":("am_adam",1.08,"Morning, Claude! Please tell me you've got some content ideas for today. Wait, a whole month? Researching, writing, editing and scheduling usually takes me forever!"),
    "claude":("am_michael",0.98,"Today? I've prepared a whole month! That's exactly the workflow we can automate. Of course I do! You're the creator. You approve the content, and I help with the repetitive work.")}
for n,(v,sp,t) in CH.items():
    x,sr=k.create(t,voice=v,speed=sp,lang='en-us'); sf.write(f'/tmp/{n}_raw.wav',x,sr)
    af='highpass=f=110,equalizer=f=200:t=q:w=1:g=-1,equalizer=f=3600:t=q:w=1:g=3,acompressor=threshold=-20dB:ratio=3:attack=4:release=70:makeup=3,loudnorm=I=-15:TP=-1.5:LRA=9'
    subprocess.run(['ffmpeg','-v','error','-y','-i',f'/tmp/{n}_raw.wav','-af',af,'-t','10.5','-b:a','192k',f'voice-sample-{n}-10s.mp3'],check=True)
