"""Split a 4x3 pose sheet into 12 poses (row by row), clean alpha, measure size features."""
import sys, json
from PIL import Image
import numpy as np
from scipy import ndimage
import os
D=os.environ.get('PET_WORK', 'pet-work')
POSES=['main','blink','happy','wave','shy','play1','play2','play3','sleep','eat','celebrate','yawn']

def segment(species):
    a=np.array(Image.open(f'{D}/{species}-sheet.png').convert('RGBA')).astype(np.float32)
    al=a[...,3]
    al[al<16]=0                               # junk alpha
    solid=al>=128
    solid=ndimage.binary_closing(solid,iterations=3)
    lab,n=ndimage.label(solid)
    sizes=ndimage.sum(solid,lab,range(1,n+1))
    big=[i+1 for i,s in enumerate(sizes) if s>3000]
    assert len(big)==12, (species,len(big),sorted(sizes)[-14:])
    objs=[]
    for i in big:
        ys,xs=np.nonzero(lab==i)
        objs.append(dict(id=i,cy=ys.mean(),cx=xs.mean()))
    objs.sort(key=lambda o:o['cy'])
    rows=[sorted(objs[k*4:(k+1)*4],key=lambda o:o['cx']) for k in range(3)]
    order=[o for r in rows for o in r]
    out=[]
    for name,o in zip(POSES,order):
        m=lab==o['id']
        m=ndimage.binary_fill_holes(m)
        grow=ndimage.binary_dilation(m,iterations=4)     # keep the antialiased edge
        piece=a.copy(); piece[...,3]=np.where(grow,al,0)
        ys,xs=np.nonzero(piece[...,3]>0)
        y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
        crop=piece[y0:y1,x0:x1].copy()
        crop[crop[...,3]==0,:3]=0
        Image.fromarray(crop.clip(0,255).astype(np.uint8)).save(f'{D}/{species}-{name}.png')
        # mass centre (opaque part) and baseline relative to crop
        op=crop[...,3]>=128
        oys,oxs=np.nonzero(op)
        out.append(dict(pose=name,w=int(x1-x0),h=int(y1-y0),base=int(oys.max()),cx=float(oxs.mean()),area=int(op.sum())))
    return out

def feature(species,name):
    c=np.array(Image.open(f'{D}/{species}-{name}.png').convert('RGBA')).astype(int)
    r,g,b,al=c[...,0],c[...,1],c[...,2],c[...,3]
    if species=='dragon':
        horn=(r>235)&(g>195)&(g<240)&(b>140)&(b<205)&(al>200)
        # horns sit in the top 45% of the pose
        horn[int(c.shape[0]*0.45):]=False
        lab,n=ndimage.label(horn); sz=ndimage.sum(horn,lab,range(1,n+1)); sl=ndimage.find_objects(lab)
        top2=sorted([(s,x) for s,x in zip(sz,sl)],key=lambda t:-t[0])[:2]
        return float(np.mean([x[0].stop-x[0].start for s,x in top2]))
    else:
        body=(r>240)&(g>222)&(b>200)&(al>200)
        body=ndimage.binary_closing(body,iterations=3)
        lab,n=ndimage.label(body); sz=ndimage.sum(body,lab,range(1,n+1))
        return float(np.sqrt(sz.max()))

res={}
for sp in ['dragon','fish']:
    info=segment(sp)
    for d in info: d['feature']=round(feature(sp,d['pose']),1)
    res[sp]=info
    f=[d['feature'] for d in info]; med=float(np.median(f))
    print(sp,'feature median',round(med,1))
    for d in info: print(f"  {d['pose']:9s} {d['w']}x{d['h']} base={d['base']} feat={d['feature']} ({(d['feature']/med-1)*100:+.1f}%)")
json.dump(res,open(f'{D}/measure.json','w'),indent=1)
