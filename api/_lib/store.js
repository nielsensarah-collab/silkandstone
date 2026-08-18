// Where the product list lives.
//
// Everything is kept as one JSON file in Vercel Blob storage. That is enough
// for a shop this size, it needs no database, and it means the storefront and
// the checkout function always read the same prices from the same place.
//
// If Blob is not configured yet, or the file has never been written, we fall
// back to DEFAULTS below — so the site keeps working rather than going blank.

const { put, list } = require('@vercel/blob');

const FILE = 'products.json';

// The catalogue as it shipped. Photos here are the keys of the images already
// embedded in index.html; anything uploaded through the admin becomes a URL.
const DEFAULTS = [
  { id:'hrt', title:'White heart cord necklace', price:40, isNew:true, inStock:true,
    cols:['necklaces','paracord'], swatch:'Black & white cord · white heart',
    desc:'A finely woven black and white cord that reads almost like a chain from a distance, with a smooth white ceramic heart hanging at the front. The cord is soft enough to sit flat against the collarbone and long enough to layer over a crewneck.',
    spec:[['Pendant','White ceramic heart'],['Cord','Woven black and white'],
          ['Hardware','Tarnish-free, made for regular wear'],['Findings','Gold clasp and end caps']],
    photos:['/photos/hrt_full.jpg', '/photos/hrt_close.jpg', '/photos/hrt_alt.jpg', '/photos/hrt_long.jpg'] },

  { id:'blu', title:'Blue cord heart necklace', price:40, isNew:true, inStock:true,
    cols:['necklaces','paracord'], swatch:'Blue cord · yellow heart',
    desc:'Cobalt cord flecked with red and white, finished with a butter yellow ceramic heart and a small puffed gold heart tucked beside it. Short enough to wear on its own at the base of the throat.',
    spec:[['Pendant','Yellow ceramic heart with gold heart charm'],['Cord','Blue flecked cord'],
          ['Hardware','Tarnish-free, made for regular wear'],['Findings','Gold clasp and end caps']],
    photos:['/photos/blu_full.jpg', '/photos/blu_close.jpg'] },

  { id:'nvy', title:'Navy seed bead necklace', price:20, isNew:true, inStock:true,
    cols:['necklaces','beaded'], swatch:'Navy · gold hearts',
    desc:'Hundreds of deep navy seed beads strung fine and close, with tiny fluted gold hearts set at intervals so they catch the light as the strand turns. It sits high on the neck and weighs almost nothing.',
    spec:[['Beads','Navy glass seed beads'],['Accents','Fluted gold hearts'],
          ['Hardware','Tarnish-free, made for regular wear'],['Closure','Gold lobster clasp']],
    photos:['/photos/nvy_full.jpg', '/photos/nvy_close.jpg', '/photos/nvy_clasp.jpg'] },

  { id:'grf', title:'Green fish necklace', price:20, isNew:true, inStock:true,
    cols:['necklaces','beaded'], swatch:'Green · gold fish',
    desc:'Bottle green glass beads on a fine strand, with a detailed gold fish that hangs at the clasp rather than centre front, so it sits off to one side. The green goes translucent in sunlight and reads almost black indoors.',
    spec:[['Beads','Green glass seed beads'],['Charm','Gold fish'],
          ['Hardware','Tarnish-free, made for regular wear'],['Closure','Gold clasp']],
    photos:['/photos/grf_full.jpg', '/photos/grf_close.jpg', '/photos/grf_alt.jpg'] },

  { id:'mlt', title:'Color block necklace', price:30, isNew:false, inStock:true,
    cols:['necklaces','beaded'], swatch:'Coral, blush, sky and yellow',
    desc:'Coral, blush, sky blue and buttercup laid down in solid runs rather than scattered, so the strand reads as blocks of colour that shift as it curves around the neck. The brightest thing I make.',
    spec:[['Beads','Coral, blush, sky blue and yellow rondelles'],
          ['Hardware','Tarnish-free, made for regular wear'],['Closure','Gold spring ring']],
    photos:['/photos/mlt_full.jpg', '/photos/mlt_alt.jpg', '/photos/mlt_clasp.jpg', '/photos/mlt_board.jpg'] },

  { id:'grn', title:'Green & red beaded necklace', price:30, isNew:false, inStock:true,
    cols:['necklaces','beaded'], swatch:'Pale green with red spacers',
    desc:'Soft pistachio rondelles with a single tomato red seed bead set between each one, which keeps the strand from reading as one solid colour and gives it a quiet rhythm up close.',
    spec:[['Beads','Green rondelles with red seed bead spacers'],
          ['Hardware','Tarnish-free, made for regular wear'],['Closure','Gold spring ring']],
    photos:['/photos/grn_full.jpg', '/photos/grn_close.jpg', '/photos/grn_clasp.jpg', '/photos/grn_board.jpg'] },

  { id:'crd', title:'Red cord charm necklace', price:35, isNew:false, inStock:true,
    cols:['necklaces','paracord'], swatch:'Adjustable cord with charm cluster',
    desc:'Bright red paracord with sliding knots at both sides, so it pulls up to a choker or drops below the collarbone. At the front, speckled jasper beads sit above a gold fish, a red enamel heart and a green evil eye.',
    spec:[['Charms','Gold fish, enamel heart, evil eye'],['Beads','Speckled jasper, green seed beads'],
          ['Cord','Red paracord with sliding knots'],
          ['Hardware','Tarnish-free, made for regular wear'],['Length','Fully adjustable']],
    photos:['/photos/crd_full.jpg', '/photos/crd_alt.jpg', '/photos/crd_close.jpg'] },

  { id:'amb', title:'Amber fish bracelet', price:25, isNew:false, inStock:true,
    cols:['bracelets','beaded'], swatch:'Frosted amber with an aqua fish',
    desc:'Frosted amber rondelles the colour of honey held up to a window, broken by small pale aqua spacers, with a hand-painted fish bead sitting at the centre of the wrist.',
    spec:[['Beads','Frosted amber with aqua spacers'],['Feature','Hand-painted fish bead'],
          ['Hardware','Tarnish-free, made for regular wear'],['Closure','Gold lobster clasp'],
          ['Size shown','7.5 in']],
    photos:['/photos/amb_full.jpg', '/photos/amb_alt.jpg', '/photos/amb_clasp.jpg', '/photos/amb_board.jpg'] },

  { id:'lem', title:'Lemon fish bracelet', price:25, isNew:false, inStock:true,
    cols:['bracelets','beaded'], swatch:'Pale yellow with turquoise',
    desc:'Pale lemon rondelles with bright turquoise seed beads between them and a glossy yellow fish at the front. The turquoise is what makes it work; without it the yellow would go quiet.',
    spec:[['Beads','Pale yellow rondelles with turquoise spacers'],['Feature','Hand-painted fish bead'],
          ['Hardware','Tarnish-free, made for regular wear'],['Closure','Gold lobster clasp'],
          ['Size shown','7 in']],
    photos:['/photos/lem_full.jpg', '/photos/lem_alt.jpg', '/photos/lem_clasp.jpg', '/photos/lem_board.jpg'] },

  { id:'pb', title:'Paracord bracelet', price:10, isNew:false, inStock:true,
    cols:['bracelets','paracord'], swatch:'Braided cord',
    desc:'A flat-braided paracord band that sits close to the wrist and takes daily wear without complaint. It softens and moulds to you over the first few weeks.',
    spec:[['Cord','Braided paracord'],['Hardware','Tarnish-free, made for regular wear']],
    photos:[] },

  { id:'phn', title:'Paracord heart necklace', price:40, isNew:false, inStock:true,
    cols:['necklaces','paracord'], swatch:'Braided cord · heart',
    desc:'Braided cord worn at the neck with a heart at the centre. Sturdier than it looks, and it softens with wear rather than fraying.',
    spec:[['Cord','Braided paracord'],['Feature','Heart pendant'],
          ['Hardware','Tarnish-free, made for regular wear']],
    photos:[] }
];

let cachedUrl = null;

async function blobUrl() {
  if (cachedUrl) return cachedUrl;
  const { blobs } = await list({ prefix: FILE, limit: 1 });
  cachedUrl = blobs.length ? blobs[0].url : null;
  return cachedUrl;
}

async function readProducts() {
  try {
    const url = await blobUrl();
    if (!url) return { products: DEFAULTS, source: 'defaults' };
    const r = await fetch(url + '?t=' + Date.now()); // skip any CDN cache
    if (!r.ok) return { products: DEFAULTS, source: 'defaults' };
    const data = await r.json();
    if (!Array.isArray(data) || !data.length) return { products: DEFAULTS, source: 'defaults' };
    return { products: data, source: 'blob' };
  } catch (err) {
    console.error('readProducts fell back to defaults:', err.message);
    return { products: DEFAULTS, source: 'defaults' };
  }
}

async function writeProducts(products) {
  const { url } = await put(FILE, JSON.stringify(products, null, 2), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0
  });
  cachedUrl = url;
  return url;
}

// Cents, taken from the stored list — never from the browser.
async function priceTable() {
  const { products } = await readProducts();
  const table = {};
  for (const p of products) {
    table[p.id] = { name: p.title, price: Math.round(Number(p.price) * 100), inStock: p.inStock !== false };
  }
  return table;
}

module.exports = { readProducts, writeProducts, priceTable, DEFAULTS };
