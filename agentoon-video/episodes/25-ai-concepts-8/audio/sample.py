import numpy as np, soundfile as sf, subprocess
from kokoro_onnx import Kokoro
k=Kokoro('/tmp/kokoro/kokoro-v1.0.onnx','/tmp/kokoro/voices-v1.0.bin')
t=["Everyone talks about A I. But do you actually understand how it works? Here are eight concepts in ninety seconds.","An L L M is a large language model, trained to recognize patterns in language and generate responses."]
out=[np.zeros(3600,dtype=np.float32)]
for s in t:
    x,sr=k.create(s,voice='am_adam',speed=1.04,lang='en-us'); out+= [x.astype(np.float32), np.zeros(int(.25*sr),dtype=np.float32)]
sf.write('/tmp/s_raw.wav',np.concatenate(out),sr)
subprocess.run(['ffmpeg','-v','error','-y','-i','/tmp/s_raw.wav','-af','highpass=f=110,equalizer=f=200:t=q:w=1:g=-1,equalizer=f=3600:t=q:w=1:g=3,acompressor=threshold=-20dB:ratio=3:attack=4:release=70:makeup=3,loudnorm=I=-15:TP=-1.5:LRA=9','-t','11','-b:a','192k','voice-sample-8concepts-10s.mp3'],check=True)
