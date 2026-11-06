"""Put every pose on one shared canvas per species: same scale, same baseline, mass centre on the centre line.
The blink pose = main pose with only the eye area taken from the eyes-closed drawing (so blinking never moves the body)."""
import json
from PIL import Image
import numpy as np
from scipy import ndimage
import os
D=os.environ.get('PET_WORK', 'pet-work')
M=json.load(open(f'{D}/measure.json'))
PAD=6
def load(sp,p): return np.array(Image.open(f'{D}/{sp}-{p}.png').convert('RGBA')).astype(np.float32)

def best_shift(a,b,r=8):
    """Shift of b (dy,dx) that best matches a, by alpha."""
    A=a[...,3]/255; best=(1e18,0,0)
    H=max(a.shape[0],b.shape[0])+2*r; W=max(a.shape[1],b.shape[1])+2*r
    base=np.zeros((H,W)); base[r:r+A.shape[0],r:r+A.shape[1]]=A
    for dy in range(-r,r+1):
        for dx in range(-r,r+1):
            c=np.zeros((H,W)); y0=r+dy; x0=r+dx
            c[y0:y0+b.shape[0],x0:x0+b.shape[1]]=b[...,3]/255
            d=((base-c)**2).sum()
            if d<best[0]: best=(d,dy,dx)
    return best[1],best[2]

out={}
for sp in ['dragon','fish']:
    info={d['pose']:d for d in M[sp]}
    # --- blink: align eyes-closed drawing to main, take only the pixels that differ (the eyes), feathered
    main=load(sp,'main'); closed=load(sp,'blink')
    dy,dx=best_shift(main,closed)
    H,W=main.shape[:2]
    al=np.zeros_like(main)
    ys0,xs0=max(0,dy),max(0,dx)
    src=closed[max(0,-dy):,max(0,-dx):]
    hh=min(H-ys0,src.shape[0]); ww=min(W-xs0,src.shape[1])
    al[ys0:ys0+hh,xs0:xs0+ww]=src[:hh,:ww]
    diff=np.abs(main[...,:3]-al[...,:3]).sum(-1)*(main[...,3]>200)*(al[...,3]>200)
    eyes=diff>90
    eyes=ndimage.binary_opening(eyes,iterations=1)
    lab,n=ndimage.label(eyes); sz=ndimage.sum(eyes,lab,range(1,n+1))
    keep=np.isin(lab,[i+1 for i,s in enumerate(sz) if s>25])
    # eye area = dilated blobs in the upper 75% of the body
    keep[int(H*0.8):]=False
    area=ndimage.binary_dilation(keep,iterations=6)
    feather=ndimage.gaussian_filter(area.astype(float),2.0)[...,None]
    blink=main.copy(); blink[...,:3]=main[...,:3]*(1-feather)+al[...,:3]*feather
    Image.fromarray(blink.clip(0,255).astype(np.uint8)).save(f'{D}/{sp}-blinkfix.png')
    print(sp,'blink shift',(dy,dx),'eye pixels',int(keep.sum()))
    info['blink']=dict(info['main'])
    # --- canvas
    left=max(d['cx'] for d in info.values()); right=max(d['w']-d['cx'] for d in info.values())
    half=int(np.ceil(max(left,right)))+PAD
    top=max(d['base'] for d in info.values())+PAD
    Wc=2*half; Hc=top+PAD
    place={}
    canvas_imgs={}
    for p,d in info.items():
        img=load(sp,'blinkfix' if p=='blink' else p)
        x0=int(round(half-d['cx'])); y0=int(top-d['base'])
        c=np.zeros((Hc,Wc,4),np.float32); c[y0:y0+img.shape[0],x0:x0+img.shape[1]]=img
        canvas_imgs[p]=c
        Image.fromarray(c.clip(0,255).astype(np.uint8)).save(f'{D}/{sp}-canvas-{p}.png')
        place[p]=dict(x0=x0,y0=y0)
    out[sp]=dict(w=Wc,h=Hc,baseline=top,place=place)
    print(sp,'canvas',Wc,Hc,'baseline',top)
json.dump(out,open(f'{D}/canvas.json','w'),indent=1)
