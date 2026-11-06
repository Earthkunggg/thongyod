"""Pose canvas PNG -> upscale x4 -> vtracer SVG -> render with Chrome at OUT_W wide -> WebP (and a Lanczos version to compare)."""
import sys, os, re, vtracer
from PIL import Image
import numpy as np
from playwright.sync_api import sync_playwright
import os
D=os.environ.get('PET_WORK', 'pet-work')
OUT_W=int(os.environ.get('OUT_W','720'))
def prep(sp,p):
    im=Image.open(f'{D}/{sp}-canvas-{p}.png').convert('RGBA')
    big=im.resize((im.width*4,im.height*4),Image.LANCZOS)
    a=np.array(big); al=a[...,3]
    # hard edge for tracing; tracing smooths it; transparent pixels get a key colour vtracer drops
    a[al<128]=[0,0,0,0]; a[al>=128,3]=255
    Image.fromarray(a).save(f'{D}/t-{sp}-{p}.png')
    vtracer.convert_image_to_svg_py(f'{D}/t-{sp}-{p}.png', f'{D}/t-{sp}-{p}.svg', colormode='color', hierarchical='stacked', mode='spline',
        filter_speckle=4, color_precision=8, layer_difference=4, corner_threshold=60, length_threshold=4.0, max_iterations=10, splice_threshold=45, path_precision=2)
    return im.size
def render(pg,sp,p,size):
    svg=open(f'{D}/t-{sp}-{p}.svg').read()
    w,h=size; H=round(OUT_W*h/w)
    svg=re.sub(r'<svg[^>]*>',f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w*4} {h*4}" width="{OUT_W}" height="{H}">',svg,count=1)
    pg.set_viewport_size({'width':OUT_W,'height':H})
    pg.set_content('<html><body style="margin:0;background:transparent">'+svg+'</body></html>')
    pg.screenshot(path=f'{D}/r-{sp}-{p}.png',omit_background=True)
    Image.open(f'{D}/r-{sp}-{p}.png').save(f'{D}/out-{sp}-{p}.webp',quality=88,method=6)
if __name__=='__main__':
    jobs=[a.split(':') for a in sys.argv[1:]]
    with sync_playwright() as pw:
        b=pw.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=b.new_page()
        for sp,p in jobs:
            size=prep(sp,p); render(pg,sp,p,size)
            print(sp,p,os.path.getsize(f'{D}/t-{sp}-{p}.svg')//1024,'KB svg',os.path.getsize(f'{D}/out-{sp}-{p}.webp')//1024,'KB webp')
        b.close()
