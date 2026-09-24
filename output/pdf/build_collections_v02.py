from pathlib import Path
from xml.sax.saxutils import escape
import json
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from pypdf import PdfReader, PdfWriter
import pymupdf
from instruction_figures import figure, table_figure, FIGURES

OUT = Path(__file__).resolve().parent
QA = OUT / 'qa-v02'
QA.mkdir(exist_ok=True)
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleCustom',fontName='Helvetica-Bold',fontSize=30,leading=35,textColor=colors.HexColor('#244B43'),spaceAfter=22))
styles.add(ParagraphStyle(name='Deck',fontSize=13,leading=19,textColor=colors.HexColor('#62564C'),spaceAfter=15))
styles.add(ParagraphStyle(name='BodyCustom',fontSize=10.3,leading=15,spaceAfter=8))
styles.add(ParagraphStyle(name='SmallCustom',fontSize=8.5,leading=12,spaceAfter=6))
styles['Heading1'].textColor=colors.HexColor('#244B43')
styles['Heading1'].fontSize=21
styles['Heading1'].leading=26
styles['Heading2'].textColor=colors.HexColor('#9B5E5C')
styles['Heading2'].fontSize=13
styles['Heading2'].leading=17

def p(t,style='BodyCustom'): return Paragraph(escape(t),styles[style])
def h(t): return p(t,'Heading2')
def page(title, sections):
    groups=[]
    for label,text in sections:
        content=[]
        if label: content.append(h(label))
        if isinstance(text,list):
            for line in text: content.append(p(line))
        else: content.append(p(text))
        illustration=figure(title,label,text) if label not in ['How to read this edition','Abbreviations'] else None
        if illustration:
            paired=Table([[content,illustration]],colWidths=[330,166],hAlign='LEFT')
            paired.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(0,-1),13),('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),12)]))
            groups.append((paired,paired.wrap(496,700)[1]))
        else:
            block=KeepTogether(content)
            height=sum(x.wrap(496,700)[1]+x.getSpaceBefore()+x.getSpaceAfter() for x in content)
            groups.append((block,height))
    # Balance sections across pages; avoid a lone final paragraph on an almost empty page.
    from functools import lru_cache
    cap=660
    @lru_cache(None)
    def partition(start):
        if start==len(groups):return (0,0,[])
        best=None; used=0
        for end in range(start+1,len(groups)+1):
            used+=groups[end-1][1]
            if used>cap and end>start+1:break
            n,cost,cuts=partition(end)
            candidate=(n+1,cost+(cap-used)**2,[end]+cuts)
            if best is None or candidate[:2]<best[:2]:best=candidate
        return best
    cuts=partition(0)[2];a=[];start=0
    for i,end in enumerate(cuts):
        a += [p(title+(' / continued' if i else ''),'Heading1'),Spacer(1,10)]
        a += [g[0] for g in groups[start:end]]
        a.append(PageBreak());start=end
    return a
def footer(c,d):
    c.setStrokeColor(colors.HexColor('#D8D2C6')); c.line(44,43,551,43)
    c.setFont('Helvetica',8); c.setFillColor(colors.HexColor('#62564C'))
    c.drawString(44,30,'CROCHET & HANDMADE  |  DEVELOPMENT DRAFT v0.2  |  NOT SAMPLE-TESTED')
    c.drawRightString(551,30,str(d.page))
def cover(code,title,subtitle,contents):
    return [Spacer(1,38),p('CROCHET & HANDMADE','Deck'),p(code,'Heading2'),Spacer(1,16),p(title,'TitleCustom'),p(subtitle,'Deck'),Spacer(1,20),h('Read before making or selling'),p('Original written development patterns based on the visual themes in your shop. These instructions have not been physically crocheted or independently tested. They do not reproduce the reference images stitch-for-stitch. Dimensions, yarn use and visual results are provisional.'),p('For maker testing and revision. Do not describe this edition as tested, photo-verified or a guaranteed match to the marketing images. Vector construction diagrams accompany the instructional stages. They are schematic, not to scale, and are not photographs of a tested sample.'),Spacer(1,15),h('Inside this file'),p(contents),Spacer(1,20),p('Language: English  |  Terminology: US crochet  |  Version: 0.2','SmallCustom'),PageBreak()]

COMMON=[('How to read this edition',[
'Read the entire project first. Each round starts at the stitch marker; move the marker after every round. Work in a continuous spiral unless the instructions explicitly say to join. A number in brackets is the stitch count after completing the row or round.',
'Work into both loops unless stated otherwise. A turning ch 1 is not counted as a stitch. In flat rows, ch 1 and turn after each row except the last. Fasten off means cut a sewing tail, pull it through the final loop and tighten.',
'US sc = UK dc; US hdc = UK htr; US dc = UK tr. All instructions in these books use US names.']),
('Abbreviations', 'ch: chain; sl st: slip stitch; sc: single crochet; hdc: half double crochet; dc: double crochet; st/sts: stitch/stitches; MR: magic ring; inc: 2 sc into one stitch; dec: single-crochet two stitches together; BLO: back loop only; FLO: front loop only. (2 sc, inc) x 6 consumes 18 stitches and makes 24.'),
('Making the stitches',[
'Chain: yarn over and pull through the loop on your hook. Single crochet: insert hook, yarn over and pull up a loop; yarn over and pull through both loops. Slip stitch: insert hook, yarn over and pull through the stitch and the loop on your hook together.',
'Half double crochet: yarn over, insert hook, yarn over and pull up a loop; yarn over and pull through all three loops. Double crochet: yarn over, insert hook, pull up a loop; yarn over and pull through two loops, then repeat through the remaining two.',
'Decrease: insert hook into the next stitch and pull up a loop; insert into the following stitch and pull up a loop; yarn over and pull through all three loops. For an invisible decrease in amigurumi, insert through the front loops of the next two stitches, draw yarn through those two loops, then yarn over and draw through the two loops on the hook.']),
('Magic ring and colour changes', 'Wrap yarn around two fingers, insert the hook under the ring, pull up the working yarn and ch 1. Work the instructed sc into the ring and pull the tail firmly to close. Secure that tail on the inside. To change colour, complete the last pull-through of the previous stitch with the new colour; weave tails into the wrong side.')]

TOOLS=[('Supplies and provisional scale',[
'For dolls and animals: smooth DK cotton yarn, a 2.5 mm hook as a starting point, polyester stuffing, blunt yarn needle, scissors, stitch marker and embroidery yarn. Use small amounts of accent colours. Reserve approximately 50 g each of the main colours and 10-20 g per accent; these are purchasing allowances, not measured consumption.',
'Target test gauge: approximately 24 sc and 26 rows per 10 cm in a flat swatch. Make ch 25; sc in second chain and across (24), then work 25 more rows of 24 sc. Measure the centre without stretching. Stuffed fabric must be dense enough that filling is not visible. Use a smaller hook if necessary.',
'Gauge controls size. At this target, 24 stitches measure about 10 cm; a 48-stitch head has a nominal circumference near 20 cm before stuffing. Finished height must be measured from the first sample, not copied from the reference artwork.']),
('Finishing and handling',[
'Use embroidered eyes and flat stitched details throughout these drafts. Do not add beads, loose bells, wire or sharp supports. These are decorative prototypes, not safety-tested toys. Keep loose yarn and stuffing away from small children.',
'Stuff gradually, pin pieces in position, and use small whipstitches through both edges. Sew each joint twice, then bury the tail through the stuffing and trim. Test each seam with a gentle pull. Follow the yarn label for washing; test colourfastness first.']),
('What verification means', 'The main round tables have been checked for arithmetic consistency. This does not verify shape, fit, yarn quantity or usability. A crocheter must make every variant, record corrections and photograph the finished sample before a customer edition is released.')]

def roundtable(title,rows):
    visual=table_figure(title,rows)
    items=[h(title),visual,Spacer(1,9)]
    data=[[p('Round / row','SmallCustom'),p('Instruction','SmallCustom'),p('Count','SmallCustom')]]
    for r,t,n in rows: data.append([p(str(r),'SmallCustom'),p(t,'SmallCustom'),p(str(n),'SmallCustom')])
    tb=Table(data,colWidths=[62,369,65],repeatRows=1,hAlign='LEFT')
    tb.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#E7EEE7')),('VALIGN',(0,0),(-1,-1),'TOP'),('BOTTOMPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),6),('LINEBELOW',(0,0),(-1,0),.6,colors.HexColor('#244B43')),('LINEBELOW',(0,1),(-1,-1),.25,colors.HexColor('#DEDAD0'))]))
    return items+[tb,Spacer(1,10)]

HEAD=[('1','6 sc in MR',6),('2','inc x 6',12),('3','(sc, inc) x 6',18),('4','(2 sc, inc) x 6',24),('5','(3 sc, inc) x 6',30),('6','(4 sc, inc) x 6',36),('7','(5 sc, inc) x 6',42),('8','(6 sc, inc) x 6',48),('9-16','sc in every stitch; 8 rounds',48),('17','(6 sc, dec) x 6',42),('18','(5 sc, dec) x 6',36),('19','(4 sc, dec) x 6',30),('20','(3 sc, dec) x 6',24),('21','(2 sc, dec) x 6; stuff firmly',18),('22','(sc, dec) x 6',12)]
BODY=[('1','6 sc in MR',6),('2','inc x 6',12),('3','(sc, inc) x 6',18),('4','(2 sc, inc) x 6',24),('5','(3 sc, inc) x 6',30),('6-10','sc around; 5 rounds',30),('11','(3 sc, dec) x 6',24),('12-14','sc around; 3 rounds',24),('15','(2 sc, dec) x 6',18),('16','sc around; stuff',18),('17','(sc, dec) x 6',12),('18','sc around; leave neck open',12)]
LEGS=[('1','6 sc in MR',6),('2','inc x 6',12),('3','(sc, inc) x 6',18),('4','sc BLO around',18),('5','sc around',18),('6','3 sc, dec x 6, 3 sc',12),('7-12','sc around; 6 rounds',12)]
ARMS=[('1','6 sc in MR',6),('2','(sc, inc) x 3',9),('3-4','sc around; 2 rounds',9),('5','(sc, dec) x 3',6),('6-12','sc around; 7 rounds',6)]

def dollbase():
    a=page('Doll construction plan',[('Three designs in collection 01','White-haired blindfolded doll, green-haired swordsman doll and pink-dress doll. These are simplified, independently written interpretations of the shop references; not official character merchandise patterns.'),('Make in this order','Make two legs and a body; attach legs. Make two arms and attach them. Make the head and face, then sew the neck. Add the chosen hair and outfit. Hair and garments use the same base for all three designs.'),('Placement map','Centre front = point halfway around each round from its marker. Keep all markers and colour-change seams at the back. Place eyes around head R13 with 8 stitches between their centres. Neck joins 12-to-12. Arms join the body at R15; attach legs to the lower front of the body with their upper edges near R4 and boot toes pointing forward. Each leg opening is sewn as an oval to the body surface, not matched stitch-for-stitch to a body round. This seated construction is not intended to stand unsupported. Pin and compare front and side views before sewing.')])
    a += [p('Doll head','Heading1')]+roundtable('Skin colour; one piece',HEAD)+[p('Leave the 12-stitch neck open with a long tail. Add a tiny embroidered nose at R14 between the eyes. Do not close the neck into a point. Embroider face before sewing onto the body.'),PageBreak()]
    a += [p('Doll body','Heading1')]+roundtable('One piece; colours specified by variant',BODY)+[p('Keep neck opening round. Sew head R22 to body R18 one-to-one through all 12 stitches. Add extra stuffing at the neck before the last stitches. The head is intentionally large; it may need support when displayed.'),PageBreak()]
    a += [p('Doll legs and arms','Heading1')]+roundtable('Legs: make two',LEGS)+[p('Stuff the boot firmly and upper leg moderately. Leave top open with a sewing tail. R1-R6 form the boot; R7-R12 form the leg. Sew the open top as an oval to the lower front of the body, upper edge near body R4. Set legs side-by-side, toes forward, for a seated doll. Do not try to match the 12-stitch leg opening to a 6-stitch circle at the body base.')]+roundtable('Arms: make two',ARMS)+[p('Use skin for R1-R5 and sleeve colour for R6-R12 unless the variant says otherwise. Stuff only the hand. Flatten the 6-stitch opening and sew across 3 paired stitches. Attach at body R15, one on each side.'),PageBreak()]
    a += page('Hair and garment modules',[
('Hair cap','In hair colour, work head R1-R8 (48 sts), then 4 rounds of 48 sc. Fasten off with a long tail. Place over head R1-R12, keeping the face clear; sew the edge to the head. Test cap fit before adding hair strands.'),
('Spiky strand','Ch 7. Starting in second chain, sl st 1, sc 2, hdc 3 (6 worked stitches). Fasten off. Make the number in your variant. Sew the last 2 stitches of each strip to the cap, leaving its pointed end free. Layer from crown toward hairline.'),
('Curl','Ch 16. Work 2 sc into each of the 15 chains starting in the second chain (30 sc). Fasten off. Twist gently into a curl and sew one end to the cap. Make longer curls by adding chains; each chain receives 2 sc.'),
('Open-front jacket','Ch 33; Row 1: sc in second ch and across (32). Rows 2-7: 32 sc. Row 8: 6 sc, ch 4, skip 4, 12 sc, ch 4, skip 4, 6 sc (24 sc + 8 ch). Row 9: 32 sc, working one into each ch. Row 10: 32 sc. Fit around the body with openings at the arms; front edges stay open. This is a wrap-style jacket with an open top edge, not a shaped shoulder garment. Position the armholes over the upper arms and tack the upper back edge to the body so it stays in place. Do not close the armholes. For sleeves, join yarn in an armhole and work 4 sc across its lower edge, 1 into side row-end, 4 across its top, 1 into other side (10). Work 4 further rounds of 10 sc; fasten off. Repeat.'),
('Belt and scarf strip','Ch 41; sc into second ch and across (40). Fasten off. Wrap around waist, overlap to fit and sew the overlap; stitch loose ends down. For a narrower belt, use the chain alone and sew every few stitches to the body.')])
    return a

DOLL_VARIANTS=[
('01-A | White-haired blindfolded doll',[
('Palette','Skin, navy, black and white. Use the doll base in this book.'),
('Body and limbs','Body: navy throughout. Legs: black R1-R6, navy R7-R12. Arms: skin R1-R5, navy R6-R12. Attach as in the placement map. Make the jacket in navy, adding 2 extra rows of 32 sc between jacket Rows 7 and 8 for a taller body section; renumber later rows locally.'),
('Hair and blindfold','Make a white hair cap and 30 spiky strands. Sew 8 around the crown, 12 through the middle and 10 at the hairline; keep spikes away from the face. Blindfold: ch 45; sc across from second chain (44). Work 2 more rows of 44 sc. Wrap over eye line and overlap at the back. If too short, remake the starting chain to fit; secure to head at both sides and at the overlap.'),
('Finish and sample check','Embroider a short mouth at head R17. This version has simple mitten hands, not articulated fingers or the reference hand gesture. Display seated or with external support; no internal wire. Check blindfold fit, sleeve openings and neck stability on the sample.')]),
('01-B | Green-haired swordsman doll',[
('Palette','Skin, green, dark green, black, red and gold embroidery thread.'),
('Base and outfit','Body: dark green R1-R10, skin R11-R18. Legs: black R1-R6, dark green R7-R12. Arms: skin R1-R5, green R6-R12. Make green jacket and red belt using the modules. Leave jacket front open over the skin-coloured upper body. Sew small gold straight stitches down the front as decorative fasteners.'),
('Hair and face','Make a green cap. Make 36 short curls: ch 7, then 2 sc in each chain from second chain (12). Sew 12 at crown and 24 around remaining cap. Embroider eyes at R13, brows at R11, and a short vertical cheek scar beside one eye without crossing the eye stitches.'),
('Three soft sword accessories','For each sword: with grey, ch 16; sc into second ch and next 14 chains (15). Make a second identical strip. Place wrong sides together and whipstitch long edges and tips; do not insert rigid sticks. Wrap last 4 stitches at one end with black yarn for a handle. Guard: gold ch 5, sl st back over 4 chains; sew across the blade at the handle boundary. Sew all three swords along the belt, with every tip fixed to the outfit. These are flat decorative accessories.'),
('Sample check','Check jacket length and whether accessories pull the doll sideways. This is a simplified yarn-only design; embroidered details replace metal jewellery.')]),
('01-C | Pink-dress doll',[
('Palette','Skin, pink, cream, brown and a little white.'),
('Base','Body: pink R1-R14, skin R15-R18. Arms: skin throughout. Legs: pink R1-R6, white R7-R8, skin R9-R12. Add a cream horizontal stitch to each shoe as trim.'),
('Skirt','Ch 31 and join to first ch without twisting. R1: sc in each ch (31). R2: (sc, inc) x 15, sc (46). R3: (sc, inc) x 23 (69). R4-R7: sc around (69). Sl st to next st and fasten off. Before attaching legs, slide skirt around waist at body R10 and sew top edge evenly in place. Alternatively sew skirt before attaching head.'),
('Cardigan','Use the jacket module in cream but work only 4 plain rows total before the armhole row. Work 2 sleeve rounds after picking up the 10 stitches. Keep front edges open.'),
('Hair and bun','Brown cap plus 18 curls from the curl module: 6 on each side, 6 at the back. Bun: MR 6; inc x 6 (12); (sc, inc) x 6 (18); 3 rounds of 18; (sc, dec) x 6 (12). Stuff lightly and sew opening over cap crown. Bow: ch 9; sc across (8); 3 more rows of 8. Wrap yarn 5 times around centre and sew bow to bun.'),
('Bag','Cream ch 9; 8 sc across; work 11 more rows of 8 sc. Fold in half, seam both sides and leave top open. Strap: ch 35, sl st back along 34 chains; sew ends to bag corners. Fit across doll and stitch strap to shoulder so it cannot slip. Embroider a small pink flower on bag. Check skirt clearance, cardigan and strap on a sample.')])]

def animals():
    a=page('Beginner practice before amigurumi',[
('Practice rectangle','Ch 13. Row 1: sc into second ch and every chain (12). Rows 2-12: ch 1, turn, 12 sc. Count every row; place markers in first and last stitches. If edges narrow, a stitch is being missed. If edges widen, an extra stitch is being added.'),
('Practice circle','MR 6; R2 inc x 6 (12); R3 (sc, inc) x 6 (18); R4 (2 sc, inc) x 6 (24). A flat circle is the goal. If it cups, check missed increases. If it ruffles, count and check for extra increases.'),
('Before the animal projects','You should be comfortable counting, increasing, decreasing, changing colour and sewing. The first rectangle is beginner level; the assembled animals are intermediate. Work slowly and record changes on the test sheet.')])
    a+=page('03-A | Seated striped cat - plan',[
('Pieces','One large head, one pear-shaped body, two front legs, two feet, two triangular ears, one tail and a flat chest patch. Use grey, cream, charcoal, pink and red. This is a simplified seated cat inspired by CYRUS7 and by-cyrus-5; those two images represent one design, not two patterns.'),
('Head and body','Use the doll head table in this file in grey, then add R23: dec x 6 (6); thread through FLO of remaining 6 stitches and close. Use the doll body table in grey, leaving its 12-stitch opening for attachment. Stuff firmly and sew neck to underside of closed head, centred over head R21-R23.'),
('Face patch','Cream MR 6; inc x 6 (12); (sc, inc) x 6 (18); (2 sc, inc) x 6 (24). Fasten off. Sew flat over front of head, centred around R14. Embroider eyes either side near its upper edge, pink triangle nose in centre and a black inverted Y mouth below it. Sew short black whiskers flat to the surface; no loose projecting ends.'),
('Chest patch','Cream ch 7; sc across (6). Rows 2-5: 6 sc. Row 6: dec, 2 sc, dec (4). Row 7: dec x 2 (2). Fasten off. Place broad edge toward neck, pointed end toward belly; sew flat to body front.')])
    a += [p('Cat head and body tables','Heading1')]+roundtable('Head: grey; add R23 described in plan',HEAD)+[PageBreak()]
    a += [p('Cat body','Heading1')]+roundtable('Body: grey',BODY)+[p('Stuff through the neck opening, then sew to underside of head. Keep body marker at centre back.'),PageBreak()]
    a+=page('Cat limbs, ears and tail',[
('Front legs - make two','Cream: MR 6; R2 inc x 6 (12); R3-R5 12 sc; R6 (2 sc, dec) x 3 (9). Change to grey; R7-R13 9 sc. R14: 7 sc, dec (8). Stuff lower half. Flatten and seam across 4 paired stitches. Sew upper ends at body R14, with paws resting below body R4. Embroider two charcoal toe lines on each paw.'),
('Back feet - make two','Cream: MR 6; R2 inc x 6 (12); R3 (sc, inc) x 6 (18); R4-R5 18 sc; R6 (sc, dec) x 6 (12). Stuff, flatten and seam across 6 paired stitches. Attach at left and right of body R3-R5, behind the front paws.'),
('Ears - make two','Grey, worked flat from tip downward: ch 2; Row 1: 2 sc in second ch (2). Row 2: inc in both sts (4). Row 3: inc, 2 sc, inc (6). Row 4: inc, 4 sc, inc (8). Row 5: inc, 6 sc, inc (10). Fasten off. Pink inner triangle: repeat only Rows 1-3; sew centred onto grey. Sew 10-stitch base to head R5-R8, one ear on each side.'),
('Tail','Charcoal MR 6; R2 (sc, inc) x 3 (9). R3-R20: 9 sc. Change to grey for R3-R5, charcoal R6-R7, grey R8-R10, charcoal R11-R12, grey R13-R15, charcoal R16-R17, grey R18-R20. Stuff lightly; leave opening and sew at back body R4-R6. Curve tail by securing its middle to body R10.'),
('Stripes and collar','Embroider 3 short charcoal stripes on each outer cheek and 3 on either side of body. Red ch 36; sl st back along 35 chains. Fit around neck, shorten if needed and sew down around its full length. No bell included. Pin all limbs on a level surface, then adjust placement until the cat sits without tipping.')])
    a+=page('03-B | Small panda - head and body',[
('Scope and yarn','White and black DK cotton. The seated panda can be made alone or with the decorative cradle on the next page. Both by-cyrus-2 and CYRUS6 are visual references; this pattern is an approximation, not a reproduced photographed sample.'),
('Head','White: R1 MR 6; R2 inc x 6 (12); R3 (sc, inc) x 6 (18); R4 (2 sc, inc) x 6 (24); R5 (3 sc, inc) x 6 (30); R6 (4 sc, inc) x 6 (36). R7-R12: 36 sc. R13 (4 sc, dec) x 6 (30); R14 (3 sc, dec) x 6 (24); R15 (2 sc, dec) x 6 (18); stuff; R16 (sc, dec) x 6 (12). Leave neck open.'),
('Body','White: MR 6; inc x 6 (12); (sc, inc) x 6 (18); (2 sc, inc) x 6 (24). R5-R8: 24 sc. R9: (2 sc, dec) x 6 (18). Change to black: R10-R11 18 sc; R12 (sc, dec) x 6 (12). Stuff and sew 12-to-12 to head.'),
('Eye patches and ears','Patches, make two: black MR 6; R2 inc x 6 (12); fasten off and flatten. Sew at head R8-R11 with about 4 sts between patches. Embroider white eye highlights. Ears, make two: black MR 6; R2 inc x 6 (12); R3 12 sc. Flatten without stuffing and seam opening across 6 paired stitches, then sew that seam onto head R3-R5. Embroider nose and mouth between patches.'),
('Four paws','Black MR 6; R2 (sc, inc) x 3 (9); R3-R5 9 sc; R6: 7 sc, dec (8). Stuff tips lightly, flatten opening and seam across 4 paired stitches. Attach two at body R9 as arms, two at body R3-R4 as feet. White tail: MR 6, then 6 sc; thread through front loops of all 6 stitches, pull closed and sew to body back R4.')])
    a+=page('Panda cradle and finishing',[
('Decorative cradle','Brown DK cotton, same hook. Ch 19. Row 1: sc from second chain (18). Rows 2-18: 18 sc. Fasten off. The panel is about 7.5 x 7 cm at target gauge; measure your sample. Fold in half so the two Row 1/Row 18 edges meet; sew the left and right row-end edges together, leaving the top open. Open it into a shallow pocket and sit panda inside. Increase the rectangle in both directions if sample does not fit.'),
('Hanging cords','For each of two cords, ch 61 and sl st back along 60 chains. Secure one cord to each upper side seam. Join upper ends for indoor display only. Stitch panda to the cradle through body base so it does not fall out. No tested load rating; do not hang over a cot or use as a vehicle accessory. Keep cords out of reach of children.'),
('Plain seated alternative with bamboo','Omit cradle and cords. Position feet wider, flatten body base gently and stitch paws in place. Bamboo: green ch 16; sc in second ch and across (15); ch 1, turn, 15 sc; fasten off. Make two leaves: ch 6, then from second chain sl st, sc, hdc, sc, sl st (5). Sew stalk flat to front between paws; stitch leaves to stalk and secure their tips. The panda is not guaranteed to stand; a seated display is intended.'),
('Testing checklist','Check neck firmness, symmetry, seam strength, sitting balance and cradle fit. Record finished dimensions, actual yarn used, hook and adjustments. Take front, side and rear photographs of the real sample.')])
    return a

def covers():
    a=page('Measure your actual phone case',[
('What this pattern makes','A decorative crochet back panel attached to an existing compatible rigid case with a perforated craft border. It is not a standalone protective phone case, and no impact, heat, charging or specific phone-model compatibility is claimed. The reference images show more elaborate fitted covers; this draft uses a practical flat-panel construction.'),
('Materials','DK cotton in chosen colours; 2.5 mm starting hook; tapestry needle; markers; paper template; ruler; an existing craft-ready case with sewing holes around a border that clears all controls. Obtain the correct case for your actual device. Do not drill a phone or improvise holes close to the device. Remove the phone while fitting or sewing.'),
('Measure and swatch','Trace the flat back area inside the sewing border. Mark camera, flash and all openings. Measure usable width W and height H in cm. Swatch at least 12 x 12 cm in sc, measure the central 10 cm. Let S = stitches per cm and R = rows per cm. Target N = round(W x S) stitches and M = round(H x R) rows. These are starting counts; compare fabric to template frequently without stretching.'),
('Worked example - not a device specification','For W=7 cm, H=14 cm and gauge S=2.4, R=2.6: N=17 stitches, M=36 rows. This is only a sample rectangle. A camera opening needs separate measurements; do not assume the sample fits any named phone.'),
('Order','Make the panel and camera opening. Fit to empty case. Make embellishments; sew them to panel. Finally sew panel to the case through existing craft holes. Keep yarn clear of camera/flash, ports, microphone, buttons, screen edge and ventilation areas.')])
    a+=page('Back panel with a camera window',[
('Basic rectangle','Ch N+1. Row 1: sc in second ch and across (N). Rows 2-M: ch 1, turn, N sc, except rows assigned to the camera window. Check width after Row 3 and height every 5 rows. Remake counts if fit differs from the template.'),
('Plan the opening','From panel bottom, measure where the camera opening starts and ends. Convert to row numbers using R. Mark the right side and the camera side on both the paper and fabric before splitting rows. Choose a bottom full row b below the opening and the number g of rows in the opening. Choose L stitches to its left and K stitches to its right, leaving C=N-L-K missing stitches. Require L and K at least 2 and C at least 1. Add clearance on the template; round the opening outward. If the opening reaches the panel edge, use the edge-notch option below.'),
('Worked internal window','For N=17, L=3, C=8, K=6, b=24 and g=9: work 24 full rows. At the next row make only 3 sc and turn; work a total of 9 rows of 3 sc for the first rail, then fasten off. Join yarn at the opposite outer edge of Row 24 and work the other rail across its 6 stitches, turning for 9 rows; fasten off. Both rails must finish at the same height. Lay the piece right-side up on the original template before bridging; check that the opening is on the correct side.'),
('Bridge above window','With right side facing, join at the outer edge of one rail. Sc across that rail, ch C, sc across the other rail. In the example: 3 sc, ch 8, 6 sc (17 positions). Turn; sc in every sc and each chain (17). This bridge is Row b+g+1 (34 in example). Continue to Row M (36). Choose the starting edge and rail order from the visible right side so the window is not mirrored.'),
('Edge-notch option','If camera window reaches the top, omit bridge and end the two rails at M. If it reaches a side edge, work a single narrow rail after row b, ending at M; leave the entire camera-side region open. Do not run yarn across lenses. Trace and refit before final attachment.')])
    a+=page('Shared applique modules',[
('Small round patch','MR 6; R2 inc x 6 (12). Fasten off, flatten and leave tail. Use for cheeks, panda eye patches or small spots.'),
('Large round patch','MR 6; R2 inc x 6 (12); R3 (sc, inc) x 6 (18). Fasten off and flatten. Use for muzzle or layered cloud shapes.'),
('Small padded paw','MR 6; R2 (sc, inc) x 3 (9); R3-R4 9 sc; R5: 7 sc, dec (8). Add a pinch of stuffing, flatten open edge and seam across 4 paired stitches. Make two in design colour. Sew all around outer edge so paws do not swing.'),
('Triangle ear','Ch 2. Row 1: 2 sc in second ch (2). Row 2: inc x 2 (4). Row 3: inc, 2 sc, inc (6). Row 4: inc, 4 sc, inc (8). Fasten off. Sew the 8-stitch base and lower sides to panel. For pink inner ear repeat only Rows 1-2 and sew inside.'),
('Round ear','MR 6; R2 inc x 6 (12); R3 12 sc. Flatten without stuffing and sew bottom half to panel; upper half stays rounded. Keep ears away from camera and flash.'),
('Leaf','Ch 6. Starting in second chain: sl st, sc, hdc, sc, sl st (5). Fasten off and sew along centre line. Scarf: ch 25; sc back across 24; sew around motif with both ends fixed.'),
('Placement grid','Use only the solid rectangle below the camera opening. Measure its height A. Put eye centres around 0.30 x A from its top, muzzle around 0.45 x A, paws around 0.65 x A. Place eyes one third and two thirds across panel width. Pin first; scale or omit details if they crowd the opening.')])
    a+=page('02-A | Cat phone-case panel',[
('Reference and colours','CYRUS8: cream base, grey patches, charcoal stripes, pink nose/inner ears. Use the measured panel from this book. Its result will be simpler than the rendered marketing reference.'),
('Make pieces','Make two grey triangle ears with pink inner triangles, two cream padded paws and 4 grey small round patches. Make a tail: charcoal MR 6; work 14 more rounds of 6 sc, changing to grey for R3-R5, R8-R10 and R13-R15. R16: 6 sc. Stuff lightly; flatten opening and seam across 3 paired stitches.'),
('Arrange','Sew ears near upper left/right edges wherever camera permits. Sew paws below the face and patches on the solid lower panel. Embroider eyes in black with small white highlights, a pink nose and a black Y-shaped mouth. Embroider three flat whiskers each side and short charcoal stripes over patches.'),
('Attach tail','Curve tail along one side of the panel. Sew it down continuously rather than leaving a loop or projection that catches. Keep edges and phone controls unobstructed. Fit to empty case, then use the attachment checklist.')])
    a+=page('02-B | Horse phone-case panel',[
('Reference and colours','CYRUS9: cream panel, brown mane and paws, pink inner ears, green scarf.'),
('Make pieces','Two cream triangle ears with pink centres; one cream large round muzzle; two brown padded paws; one green scarf strip. Mane strands: make 10 brown strips, each ch 13 then sl st across 12 chains. For a longer side mane make 5 additional strips with ch 21 then 20 sl st.'),
('Arrange','Sew muzzle at face centre and embroider two brown nostrils on it. Embroider eyes above muzzle, with pink cheek stitches at each side. Sew ears to top panel corners only if they clear camera/flash. Layer short mane diagonally above the eyes; stitch long strands flat down one side.'),
('Scarf and paws','Place scarf below muzzle, cross ends and sew every section flat. Attach brown paws either side below scarf. Embroider a gold circle as a button instead of adding a detachable button. Keep face and mane within the solid back area; resize by removing strands if necessary.')])
    a+=page('02-C | Panda phone-case panel',[
('Reference and colours','by-cyrus-4: cream panel, black ears/patches/paws, green bamboo, pink cheeks.'),
('Make pieces','Two black round ears; two black small round eye patches; two black padded paws; two green leaves. Bamboo stalk: ch 16, sc across 15, work one more row of 15 sc. Fasten off; this is a flat strip, not a stuffed tube.'),
('Arrange','Sew eye patches slightly diagonally above embroidered nose. Add white eye highlights on the black patches, and a short black mouth below nose. Sew ears where camera allows. Add pink cheek stitches outside eye patches.'),
('Bamboo detail','Sew stalk vertically between paws; use pale green horizontal stitches at three points as segments. Sew leaves angled from stalk and secure tips. Attach paws overlapping sides of stalk. Avoid placing raised pieces where they prevent a secure grip or camera clearance.')])
    a+=page('02-D | Red-cloud phone-case panel',[
('Reference and palette','by-cyrus-3: red, black and cream. This edition uses a striped back and an original simplified cloud applique, not an exact recreation of the pictured logo or diagonal texture.'),
('Panel stripes','Work measured panel as written, using black for Rows 1-2, red Rows 3-4, then repeat 2 black/2 red rows. Continue the row-colour sequence on both window rails. Weave in ends; do not carry yarn across the camera opening.'),
('Cloud applique','Make three red small round patches (12 sts each) and one red large round patch (18 sts). Overlap the three small circles along the top of the large circle to create a lobed cloud. Whipstitch overlaps invisibly on the back. With cream yarn, embroider a running outline along the outside perimeter after attaching cloud to panel.'),
('Finish','Place cloud in centre of solid lower panel. Sew all edges securely. Omit the reference metal plate, external charm and chain: this pattern supplies only yarn details. Check that red yarn does not bleed onto the cream yarn when gently dampened.')])
    a+=page('Case fitting and release checklist',[
('Attach','Use a doubled length of matching cotton and sew through existing craft holes and the panel edge. Start at four corners, then distribute remaining sewing evenly. Use short stitches, not long floats. Tie securely on the outer back beneath the panel; no knots or hard parts against the phone.'),
('Functional checks','Test on the empty case first, then install phone briefly. Confirm camera and flash have no yarn in their field; check buttons, microphone, charging cable and case retention. Remove cover for charging if it interferes or traps heat. Do not claim drop protection or wireless-charging compatibility from appearance.'),
('Measurements to record','Device and rigid case model: __________. W/H: __________. Swatch S/R: __________. N/M: __________. Window b/g/L/C/K: __________. Samplemaker/date: __________. Corrections: __________.'),
('Customer edition requirements','Provide verified device/case measurements, finished sample photos, actual yarn amount and a clear statement that a compatible rigid craft case is required. Do not use the iPhone model claims printed in the reference images as tested specifications.')])
    return a

def testpage():
    return page('Samplemaker record and sources',[
('Release gate','Each included design must be made from the written instructions by someone other than the writer. Record every deviation and resolve ambiguities. No sample has been made for this edition.'),
('Record','Pattern ID: __________  Maker/date: __________\nYarn brand/fibre/weight: __________  Hook: __________\nGauge stitches/rows per 10 cm: __________\nFinished height/width/depth: __________\nActual yarn weight per colour: __________'),
('Checks','Count each round; record any mismatch. Confirm colour changes, face position, garment fit, joining instructions and assembly order. Take front, back, side and close-up photographs. Check that the result supports the exact product-page promise. Record the corrected version and date before removing DRAFT labels.'),
('Reference standard','US abbreviation and reading conventions checked against the Craft Yarn Council: https://craftyarncouncil.com/standards/crochet-abbreviations and https://www.craftyarncouncil.com/standards/how-to-read-crochet-pattern (accessed 23 September 2026). Written pattern instructions here are newly drafted, not copied from those sources.'),
('Artwork is not a test sample','User-supplied shop images informed themes and colours only. Their printed measurements and short instructions were not treated as validated patterns. These PDFs deliberately do not label marketing renders as actual step-by-step photographs.')])

def build(filename,title,story):
    if isinstance(story[-1],PageBreak): story=story[:-1]
    doc=SimpleDocTemplate(str(OUT/filename),pagesize=A4,rightMargin=48,leftMargin=48,topMargin=48,bottomMargin=58,title=title,author='Crochet & Handmade',pageCompression=1)
    doc.build(story,onFirstPage=footer,onLaterPages=footer)

f1='01_Characters_and_Dolls_TEST_DRAFT_v0.2.pdf'
f2='02_Phone_Covers_TEST_DRAFT_v0.2.pdf'
f3='03_Beginner_Cat_and_Panda_TEST_DRAFT_v0.2.pdf'
f4='04_Complete_Collection_TEST_DRAFT_v0.2.pdf'
one=cover('COLLECTION 01','Characters & Dolls','Three modular doll designs','01-A White-haired doll | 01-B Green-haired swordsman | 01-C Pink-dress doll')+page('Before you begin',COMMON)+page('Materials and testing',TOOLS)+dollbase()
for title,ss in DOLL_VARIANTS: one+=page(title,ss)
one+=testpage()
build(f1,'Characters & Dolls - TEST DRAFT',one)
build(f2,'Phone Covers - TEST DRAFT',cover('COLLECTION 02','Phone Covers','Measured decorative panels for compatible rigid cases','02-A Cat | 02-B Horse | 02-C Panda | 02-D Red cloud')+page('Before you begin',COMMON)+covers()+testpage())
build(f3,'Beginner Cat & Panda - TEST DRAFT',cover('COLLECTION 03','Beginner Guide: Cat & Panda','Practice lessons followed by two intermediate animal projects','Practice rectangle and circle | 03-A Seated striped cat | 03-B Panda with optional cradle')+page('Before you begin',COMMON)+page('Materials and testing',TOOLS)+animals()+testpage())

# Bundle is a clearly indexed compilation, not the unsupported 15-character offer.
intro=OUT/'qa-v02'/'bundle-intro.pdf'
build('qa-v02/bundle-intro.pdf','Complete Collection - TEST DRAFT',cover('COLLECTION 04','Complete Collection','Nine development designs in three collections','Part 1: Characters & Dolls (3) | Part 2: Phone Covers (4) | Part 3: Cat & Panda (2)')+page('Bundle scope and navigation',[
('Included','This bundle combines collections 01, 02 and 03 in full. It contains nine distinct development designs; alternate reference photos do not count as additional patterns. Each part restarts its printed page numbers; PDF bookmarks navigate to the correct part.'),
('Not included','The existing bundle artwork advertises 15 anime patterns. This edition does not supply that advertised bundle. Only the white-haired and green-haired doll interpretations are developed here, plus a pink-dress doll, four case panels and two animals. Other characters shown in the bundle image are not included.'),
('Before offering this bundle','Replace the 15-pattern marketing image and description with an accurate nine-design listing after testing, or develop and test the missing character patterns first. Do not send this draft as a replacement for the advertised 15-character product.')]))
writer=PdfWriter()
writer.append(str(intro),outline_item='Scope and contents')
for name,label in [(f1,'01 Characters & Dolls'),(f2,'02 Phone Covers'),(f3,'03 Cat & Panda')]: writer.append(str(OUT/name),outline_item=label)
writer.add_metadata({'/Title':'Complete Collection - Nine Designs - TEST DRAFT v0.2','/Author':'Crochet & Handmade'})
writer.write(str(OUT/f4)); writer.close()

manifest=[]
for filename in [f1,f2,f3,f4]:
    doc=pymupdf.open(OUT/filename)
    pages=[]
    for i,pg in enumerate(doc):
        txt=pg.get_text()
        assert 'DEVELOPMENT DRAFT' in txt, (filename,i)
        assert len(txt)>150,(filename,i,'nearly empty')
        # Bounding boxes catch text outside the page; images are reviewed separately.
        for b in pg.get_text('blocks'):
            assert b[0]>=25 and b[1]>=20 and b[2]<=A4[0]-20 and b[3]<=A4[1]-15,(filename,i,b)
        pg.get_pixmap(matrix=pymupdf.Matrix(0.7,0.7)).save(QA/f'{Path(filename).stem}-{i+1:02d}.png')
        pages.append({'page':i+1,'characters':len(txt)})
    manifest.append({'file':filename,'pages':len(doc),'status':'UNTESTED DEVELOPMENT DRAFT','page_checks':pages})
    doc.close()
(QA/'figure-manifest.json').write_text(json.dumps(FIGURES,indent=2),encoding='utf-8')
(QA/'validation.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps([{'file':v['file'],'pages':v['pages']} for v in manifest],indent=2))
