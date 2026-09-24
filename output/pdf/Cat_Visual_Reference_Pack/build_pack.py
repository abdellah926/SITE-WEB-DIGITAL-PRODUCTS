from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
import pymupdf, json
from zipfile import ZipFile,ZIP_DEFLATED

ROOT=Path(__file__).resolve().parent
DEST=ROOT/'Cat_Visual_Reference_Pack_IMAGES_ONLY_v1.pdf'
W,H=720,780
ink=HexColor('#244B43');muted=HexColor('#716A60')
views=[
('01_main_views.png',0,'01','Front'),('01_main_views.png',1,'02','Side profile - facing left'),
('01_main_views.png',2,'03','Back'),('01_main_views.png',3,'04','Side profile - facing right'),
('02_extra_angles.png',0,'05','Front three-quarter'),('02_extra_angles.png',1,'06','Rear three-quarter'),
('02_extra_angles.png',2,'07','Elevated crown view'),('02_extra_angles.png',3,'08','Underside concept'),
('03_close_details.png',0,'09','Face and embroidery'),('03_close_details.png',1,'10','Ear detail'),
('03_close_details.png',2,'11','Front paws'),('03_close_details.png',3,'12','Tail and back detail')]

def crop_box(name,quadrant):
    # Layout clipping only: preserve source PNGs unchanged.
    split=595 if name.startswith('03') else 582
    lower=604 if name.startswith('03') else 591
    return [(0,0,651,split),(661,0,1312,split),(0,lower,651,1199),(661,lower,1312,1199)][quadrant]
def place_panel(c,name,q,x,y,width,height):
    img=ImageReader(str(ROOT/'images'/name));iw,ih=img.getSize()
    l,t,r,b=crop_box(name,q);s=min(width/(r-l),height/(b-t))
    dw,dh=(r-l)*s,(b-t)*s;left=x+(width-dw)/2;bottom=y+(height-dh)/2
    c.saveState();path=c.beginPath();path.rect(left,bottom,dw,dh);c.clipPath(path,stroke=0,fill=0)
    c.drawImage(img,left-l*s,bottom-(ih-b)*s,width=iw*s,height=ih*s)
    c.restoreState()
def base(c):
    c.setFillColor(HexColor('#FCFAF5'));c.rect(0,0,W,H,fill=1,stroke=0)
def line(c,x,y,text,size=10,col=muted):
    c.setFillColor(col);c.setFont('Helvetica',size);c.drawString(x,y,text)

c=canvas.Canvas(str(DEST),pagesize=(W,H),pageCompression=1)
c.setTitle('Crochet Cat | Visual Reference Pack | Images Only')
c.setAuthor('Crochet & Handmade')
base(c);line(c,40,745,'CROCHET & HANDMADE',11,ink)
c.setFillColor(ink);c.setFont('Helvetica-Bold',28);c.drawString(40,701,'Crochet Cat')
line(c,40,674,'VISUAL REFERENCE PACK  /  12 VIEWS',13,ink)
place_panel(c,'01_main_views.png',0,65,158,590,490)
line(c,40,121,'AI-generated images only. No crochet pattern or stitch instructions.',12,ink)
line(c,40,97,'Unseen angles are design interpretations, not photographs of a finished sample.',10)
line(c,40,78,'Small details may vary between views. No exact construction or dimensions are specified.',10)
line(c,40,42,'CAT-VISUAL-01  |  v1  |  24 September 2026',9)
c.showPage()
for name,q,num,title in views:
    base(c);line(c,36,745,'CAT-VISUAL-01',10,ink)
    c.setFont('Helvetica-Bold',21);c.setFillColor(ink);c.drawString(36,707,num+'  /  '+title)
    c.bookmarkPage('view'+num);c.addOutlineEntry(num+' - '+title,'view'+num)
    place_panel(c,name,q,28,89,664,585)
    line(c,36,49,'AI-generated visual reference  |  Images only - not a crochet pattern',10)
    line(c,36,30,'Design interpretation; not a tested physical sample.',9)
    line(c,647,30,num+' / 12',9)
    c.showPage()
c.save()
doc=pymupdf.open(DEST)
assert len(doc)==13
for i,pg in enumerate(doc):
    assert 'AI-generated' in pg.get_text()
    pg.get_pixmap(matrix=pymupdf.Matrix(.65,.65)).save(ROOT/'qa'/f'page-{i+1:02d}.png')
manifest={'id':'CAT-VISUAL-01','views':12,'pdf_pages':13,'image_files':3,'format':'Three four-panel PNG boards plus 12 individual-view PDF pages and cover','generator':'Built-in image_gen','reference':'User supplied CYRUS7.png','status':'AI-generated visual references, not a crochet pattern','views':[{'number':n,'title':t,'board':f,'quadrant':q} for f,q,n,t in views]}
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
with ZipFile(ROOT.parent/'Cat_Visual_Reference_Pack_IMAGES_ONLY_v1.zip','w',ZIP_DEFLATED) as z:
    z.write(DEST,DEST.name)
    for f in sorted((ROOT/'images').glob('*.png')):z.write(f,'images/'+f.name)
    for name in ['README.txt','prompts.txt','manifest.json']:z.write(ROOT/name,name)
print('Created:',DEST,'| pages:',len(doc))
