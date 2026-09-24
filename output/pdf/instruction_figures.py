"""Deterministic vector construction diagrams; not photographs or stitch charts."""
from reportlab.graphics.shapes import Drawing, Rect, Circle, Ellipse, Line, Polygon, String, PolyLine
from reportlab.lib import colors
from math import sin,cos,pi

INK=colors.HexColor('#244B43'); PINK=colors.HexColor('#DFA6A0'); CREAM=colors.HexColor('#F5EAD8'); GREY=colors.HexColor('#B0B5B1'); GREEN=colors.HexColor('#9FB69B')
FIGURES=[]
def figure(title,label,text):
    """Select a labelled construction diagram for every instructional subsection."""
    d=Drawing(160,132)
    d.add(Rect(0,0,160,132,rx=8,fillColor=colors.HexColor('#F4F6F1'),strokeColor=None))
    def line(x,y,X,Y,col=INK,w=1.2): d.add(Line(x,y,X,Y,strokeColor=col,strokeWidth=w))
    def txt(x,y,t,size=7): d.add(String(x,y,t,fontName='Helvetica',fontSize=size,fillColor=INK,textAnchor='middle'))
    def rect(x,y,w,h,col=CREAM): d.add(Rect(x,y,w,h,rx=3,fillColor=col,strokeColor=INK,strokeWidth=.8))
    def ell(x,y,rx,ry,col=CREAM): d.add(Ellipse(x,y,rx,ry,fillColor=col,strokeColor=INK,strokeWidth=.8))
    def circ(x,y,r,col=CREAM): d.add(Circle(x,y,r,fillColor=col,strokeColor=INK,strokeWidth=.8))
    def arrow(x,y,X,Y):
        line(x,y,X,Y); ang=__import__('math').atan2(Y-y,X-x)
        for a in [ang+.5,ang-.5]:line(X,Y,X-5*cos(a),Y-5*sin(a))
    def triangle(x,y,s,col=GREY):d.add(Polygon([x-s,y,x,y+s*1.6,x+s,y],fillColor=col,strokeColor=INK,strokeWidth=.8))
    def grid(x,y,w,h,n=6,m=5):
        rect(x,y,w,h)
        for i in range(1,n):line(x+w*i/n,y,x+w*i/n,y+h,col=GREY,w=.35)
        for j in range(1,m):line(x,y+h*j/m,x+w,y+h*j/m,col=GREY,w=.35)
    def head(x=80,y=86,r=23):circ(x,y,r);circ(x-8,y,1.6,INK);circ(x+8,y,1.6,INK)
    def doll(col=GREEN,hair=GREY):
        rect(61,38,38,29,col);ell(80,86,24,25);ell(80,103,24,10,hair)
        rect(45,42,12,26,col);rect(103,42,12,26,col);rect(63,13,13,22,col);rect(84,13,13,22,col)
        for x in [70,90]:circ(x,86,1.6,INK)
    def case():
        rect(46,20,69,96);rect(50,87,27,24,colors.white)
    def panel():
        grid(41,16,78,98);rect(55,82,31,27,colors.white)
    def stitch(x,y,t):
        if t=='inc':line(x,y,x-5,y+10);line(x,y,x+5,y+10)
        elif t=='dec':line(x-5,y,x,y+10);line(x+5,y,x,y+10)
        else:line(x-3,y-3,x+3,y+3);line(x-3,y+3,x+3,y-3)
    def discs():
        for x,r in [(33,12),(80,19),(128,25)]:
            circ(x,74,r)
            for i in range(6):circ(x+r*.7*cos(i*pi/3),74+r*.7*sin(i*pi/3),1.4,INK)
        txt(33,37,'6');txt(80,37,'12');txt(128,37,'18');arrow(49,74,56,74);arrow(103,74,108,74)

    key=(title+' '+label).lower()
    kind=''
    if 'camera window' in title.lower() or label in ['Measure and swatch','Worked example - not a device specification']:
        panel(); txt(80,122,'RIGHT SIDE / TEMPLATE',6.5)
        if label=='Basic rectangle':txt(80,6,'N stitches x M rows')
        elif label=='Edge-notch option':rect(55,108,31,8,colors.white);txt(80,6,'Top open: omit bridge')
        else:
            txt(47,96,'L',6);txt(70,93,'C',7);txt(103,96,'K',6);txt(81,64,'full-width rows',6);txt(80,6,'L + C + K = N')
        kind='camera-window'
    elif label in ['Spiky strand','Curl','Hair and blindfold','Hair and face','Hair and bun','Hair cap']:
        if label=='Spiky strand':
            d.add(Polygon([24,48,129,81,129,47],fillColor=CREAM,strokeColor=INK));txt(43,33,'sl st');txt(79,33,'2 sc');txt(121,33,'3 hdc');txt(80,111,'WORK BACK ALONG ch 7');arrow(128,96,30,96)
        elif label=='Curl' or label=='Hair and face':
            pts=[]
            for i in range(100):
                t=i/99*5*pi;pts.extend([30+i*.95,74+13*sin(t)])
            d.add(PolyLine(pts,strokeColor=INK,strokeWidth=2));txt(80,111,'2 sc INTO EACH CHAIN');txt(80,33,'extra stitches create curl')
        else:
            head();ell(80,103,25,12,GREY);line(57,94,103,94);txt(80,29,'cap edge around R12')
            if label=='Hair and blindfold':rect(56,79,48,10,INK);txt(80,16,'overlap and sew at back')
            if label=='Hair and bun':circ(80,117,10,GREY);txt(80,16,'sew bun to cap crown')
        kind='hair'
    elif label in ['Open-front jacket','Cardigan','Base and outfit','Body and limbs']:
        grid(18,37,124,53,8,4);rect(40,65,16,12,colors.white);rect(103,65,16,12,colors.white)
        txt(80,114,'FLAT JACKET / OPEN FRONT');txt(48,96,'armhole',6);txt(111,96,'armhole',6);txt(80,20,'6 + 4 + 12 + 4 + 6 = 32')
        kind='jacket'
    elif label=='Skirt':
        d.add(Polygon([54,108,106,108,135,35,25,35],fillColor=PINK,strokeColor=INK));ell(80,108,26,5,PINK)
        txt(80,91,'31');txt(80,73,'46');txt(80,53,'69');txt(80,15,'sew waist to body R10');kind='skirt'
    elif label=='Bag':
        grid(20,27,40,81,4,6);arrow(69,68,90,68);grid(101,27,39,40,4,3)
        d.add(PolyLine([103,65,103,100,137,100,137,65],strokeColor=INK,strokeWidth=2));txt(40,15,'8 sts x 12 rows');txt(120,15,'fold + seam');kind='bag'
    elif 'sword' in label.lower():
        for x in [42,80,118]:
            rect(x-3,30,6,62,GREY);rect(x-4,91,8,19,INK);line(x-11,90,x+11,90,w=3)
        txt(80,12,'two strips per soft sword');kind='swords'
    elif 'cradle' in label.lower():
        grid(13,31,51,64,6,7);arrow(69,63,89,63);d.add(Polygon([97,35,141,35,146,78,92,78],fillColor=CREAM,strokeColor=INK))
        txt(38,112,'18 sts x 18 rows');txt(118,94,'top open');txt(80,15,'fold / sew both side edges');kind='cradle'
    elif label=='Hanging cords':
        d.add(Polygon([49,29,111,29,121,58,39,58],fillColor=CREAM,strokeColor=INK));line(40,58,80,116);line(120,58,80,116)
        txt(80,12,'indoor display only');txt(80,76,'two cords');kind='cords'
    elif 'bamboo' in label.lower() or label=='Plain seated alternative with bamboo':
        rect(72,22,13,85,GREEN)
        for y in [43,66,89]:line(72,y,85,y)
        ell(58,78,17,6,GREEN);ell(102,57,18,6,GREEN);line(72,73,58,78);line(85,60,103,57)
        txt(80,119,'FLAT STALK + LEAVES');txt(80,9,'stitch tips and edges down');kind='bamboo'
    elif 'ear' in label.lower():
        if 'round' in label.lower() or 'patches and ears' in label.lower():
            circ(45,80,22,INK);ell(111,80,22,13,INK);arrow(72,80,82,80);txt(45,36,'12-stitch cup');txt(113,36,'flatten')
        else:
            triangle(78,38,33);triangle(78,45,17,PINK);txt(80,17,'sew base to head or panel')
        kind='ears'
    elif 'tail'==label.lower() or label=='Attach tail':
        pts=[30,35,50,35,70,40,90,55,106,78,108,104]
        d.add(PolyLine(pts,strokeColor=GREY,strokeWidth=13));d.add(PolyLine(pts,strokeColor=INK,strokeWidth=.6))
        for x,y in [(42,35),(65,39),(90,55),(106,81)]:line(x-3,y+6,x+3,y-6,col=INK,w=2)
        txt(80,14,'light fill; secure the curve');kind='tail'
    elif 'paw' in label.lower() or 'feet' in label.lower() or 'front legs' in label.lower():
        for x in [49,112]:
            ell(x,59,16,28,CREAM);line(x-14,80,x+14,80,col=PINK,w=2)
        txt(80,113,'STUFF TIP ONLY');txt(80,16,'even opening: seam pairs');kind='paws'
    elif 'face patch'==label.lower() or 'eye patches' in label.lower():
        head(80,78,33);circ(80,68,21);circ(68,81,3,INK);circ(92,81,3,INK)
        d.add(Polygon([76,70,84,70,80,66],fillColor=PINK,strokeColor=INK));line(80,66,80,58);line(80,58,75,61);line(80,58,85,61)
        txt(80,21,'embroider; do not add loose eyes');kind='face'
    elif label=='Chest patch':
        d.add(Polygon([51,106,109,106,109,59,80,27,51,59],fillColor=CREAM,strokeColor=INK));txt(80,115,'6');txt(80,65,'4');txt(80,37,'2');txt(80,13,'wide edge towards neck');kind='chest'
    elif 'patch' in label.lower() or 'cloud applique'==label.lower():
        if 'cloud' in label.lower():
            circ(80,61,27,PINK)
            for x,y in [(49,79),(80,92),(111,79)]:circ(x,y,20,PINK)
            txt(80,22,'overlap + stitch outlines')
        else:discs();txt(80,15,'stop at required round')
        kind='patch'
    elif label=='Triangle ear':triangle(80,32,35);txt(80,16,'2 / 4 / 6 / 8 stitches');kind='triangle'
    elif label=='Leaf':
        d.add(Polygon([25,65,65,86,107,80,136,65,104,48,68,46],fillColor=GREEN,strokeColor=INK));line(25,65,136,65);txt(80,20,'sl st / sc / hdc / sc / sl st');kind='leaf'
    elif label in ['Practice rectangle','Basic rectangle']:
        grid(35,31,90,72,6,6);arrow(30,41,30,98);arrow(39,112,122,112);txt(80,15,'count first and last stitches');kind='swatch'
    elif label in ['Practice circle','Head','Head and body']:
        discs();txt(80,15,'increase evenly each round');kind='rounds'
    elif label=='Body':
        ell(80,61,30,40);ell(80,103,12,4);txt(80,104,'12',6);txt(80,58,'24',9);txt(80,10,'stuff before joining neck');kind='body'
    elif label in ['Making the stitches','Abbreviations','How to read this edition']:
        for x,t in [(34,'sc'),(80,'inc'),(126,'dec')]:stitch(x,76,t);txt(x,49,t)
        txt(80,110,'CONCEPT SYMBOLS');txt(80,27,'sc: 1 to 1 / inc: 1 to 2');txt(80,14,'dec: 2 to 1');kind='stitches'
    elif label=='Magic ring and colour changes':
        circ(49,75,20,colors.white)
        for i in range(6):stitch(49+25*cos(i*pi/3),75+25*sin(i*pi/3),'sc')
        arrow(77,75,100,75);circ(119,75,4,INK);txt(80,28,'6 sc around ring; pull tail');txt(80,14,'new colour on final pull-through');kind='ring'
    elif label in ['Belt and scarf strip','Stripes and collar','Scarf and paws']:
        rect(16,70,127,12,PINK)
        for x in range(21,141,8):line(x,71,x,81,col=INK,w=.5)
        txt(80,106,'FLAT STRIP');txt(80,36,'fit, overlap and sew down');txt(80,21,'no loose ends');kind='strip'
    elif label=='Placement map' or label=='Make in this order':
        doll();arrow(80,60,80,66);txt(25,88,'head',6);txt(136,51,'arms',6);txt(134,20,'legs',6);kind='assembly'
    elif '02-' in title and label in ['Arrange','Make pieces','Panel stripes','Finish']:
        iscat='cat' in title.lower();horse='horse' in title.lower();panda='panda' in title.lower()
        if label=='Make pieces':
            if panda:
                circ(35,95,10,INK);circ(62,95,10,INK)
                ell(104,95,9,12,INK);ell(130,95,9,12,INK)
                ell(37,52,9,14,INK);ell(63,52,9,14,INK);rect(101,32,8,43,GREEN)
                ell(94,57,9,3,GREEN);ell(118,44,9,3,GREEN)
            elif iscat:
                triangle(35,88,11);triangle(66,88,11)
                ell(104,91,8,13);ell(130,91,8,13)
                for x in [27,49,71,93]:circ(x,48,8,GREY)
                d.add(PolyLine([120,35,135,43,139,63],strokeColor=GREY,strokeWidth=7))
            elif horse:
                triangle(31,87,11,CREAM);triangle(60,87,11,CREAM);circ(109,96,15)
                ell(32,48,9,13,colors.HexColor('#805C46'));ell(61,48,9,13,colors.HexColor('#805C46'))
                for y in [39,48,57]:line(97,y,139,y+6,col=colors.HexColor('#805C46'),w=2)
            txt(80,119,'MAKE SEPARATE PIECES');txt(80,16,'use modules for stitch counts')
        elif label=='Panel stripes':
            case()
            for y in range(24,85,10):rect(49,y,63,4,PINK)
        elif iscat or horse or panda:
            case()
            if panda:
                ell(67,67,8,10,INK);ell(94,67,8,10,INK);circ(67,70,1.4,colors.white);circ(94,70,1.4,colors.white)
                circ(80,54,2,INK);line(80,52,80,48);line(80,48,76,50);line(80,48,84,50)
                circ(52,118,8,INK);circ(107,118,8,INK)
            else:
                circ(69,67,3,INK);circ(92,67,3,INK)
                triangle(50,113,8);triangle(110,113,8)
                if horse:
                    ell(80,53,13,8);circ(76,53,1,INK);circ(85,53,1,INK)
                    for x in [79,84,89,94]:line(x,91,x+12,75,col=colors.HexColor('#805C46'),w=2)
                else:
                    d.add(Polygon([76,55,84,55,80,51],fillColor=PINK,strokeColor=INK))
                    for y in [52,56]:line(50,y,62,y);line(100,y,111,y)
            ell(65,35,8,10,INK if panda else CREAM);ell(96,35,8,10,INK if panda else CREAM)
        else:case()
        if label!='Make pieces':txt(80,7,'sew details onto solid area')
        kind='case-variant'
    elif label=='Placement grid':
        case();line(48,83,113,83,col=PINK);txt(81,71,'eyes: 0.30 A',6);txt(81,56,'muzzle: 0.45 A',6);txt(81,39,'paws: 0.65 A',6);txt(80,8,'A = solid height below camera');kind='placement'
    elif label=='Attach' or label=='Order' or label=='Functional checks':
        case()
        for y in range(28,108,8):circ(49,y,1.4,INK);circ(112,y,1.4,INK)
        txt(80,122,'EXISTING CRAFT HOLES');txt(80,7,'sew panel; keep openings clear');kind='attachment'
    elif label=='Base':doll(PINK,colors.HexColor('#805C46'));txt(80,119,'COLOUR MAP / NOT TO SCALE');kind='base'
    else:
        return None
    txt(80,2,'SCHEMATIC - NOT A SAMPLE PHOTO',5)
    FIGURES.append({'section':title,'step':label,'diagram':kind})
    return d

def table_figure(title,rows):
    d=Drawing(496,60)
    d.add(Rect(0,0,496,60,rx=7,fillColor=colors.HexColor('#F4F6F1'),strokeColor=None))
    counts=[n for _,_,n in rows]
    points=[(34,counts[0]),(146,max(counts)),(268,counts[-1])]
    for x,n in points:
        r=8+n*.25
        d.add(Ellipse(x,36,r,r*.65,fillColor=CREAM,strokeColor=INK))
        d.add(String(x,33,str(n),fontName='Helvetica-Bold',fontSize=9,textAnchor='middle',fillColor=INK))
    for x,X in [(66,110),(183,233)]:
        d.add(Line(x,36,X,36,strokeColor=INK));d.add(PolyLine([X-5,39,X,36,X-5,33],strokeColor=INK))
    for x,t in [(34,'START'),(146,'WIDEST'),(268,'FINISH')]:d.add(String(x,9,t,fontSize=7,textAnchor='middle',fillColor=INK))
    d.add(String(392,36,'Numbers = stitch totals',fontSize=9,textAnchor='middle',fillColor=INK))
    d.add(String(392,21,'Shape progression only',fontSize=8,textAnchor='middle',fillColor=INK))
    FIGURES.append({'section':title,'step':'round-table','diagram':'count-progression'})
    return d
