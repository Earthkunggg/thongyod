"""Art fix (Earth, 2026-11-06): the generated dragon 'eat' pose kept its small closed mouth above the open mouth,
which reads as a nose. Remove only that stroke by inpainting, before tracing. Run after place.py."""
import os
from PIL import Image
import numpy as np, cv2
from scipy import ndimage
D=os.environ.get('PET_WORK', 'pet-work')
src=np.array(Image.open(f'{D}/dragon-canvas-eat.png').convert('RGBA'))
rgb=src[...,:3].copy()
x0,x1,y0,y1=93,114,159,172          # around the small mouth, clear of the eye outline
reg=rgb[y0:y1,x0:x1].astype(int)
dark=(0.3*reg[...,0]+0.59*reg[...,1]+0.11*reg[...,2])<150
lab,n=ndimage.label(dark); sz=ndimage.sum(dark,lab,range(1,n+1))
keep=lab==(1+int(np.argmax(sz)))
mask=np.zeros(rgb.shape[:2],np.uint8); mask[y0:y1,x0:x1][keep]=255
mask=cv2.dilate(mask,np.ones((3,3),np.uint8),iterations=2)
src[...,:3]=cv2.inpaint(rgb,mask,5,cv2.INPAINT_TELEA)
Image.fromarray(src).save(f'{D}/dragon-canvas-eat.png')
print('removed', int(keep.sum()), 'px')
