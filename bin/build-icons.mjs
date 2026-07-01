#!/usr/bin/env node
/**
 * Regenerates the icon datasets in resources/js/data from the FontAwesome Pro
 * metadata. Solid/Regular/Light/Thin share the same icon set, so they are baked
 * into a single fa-classic.json (icons that don't ship in every classic weight
 * carry a `w` list); brand logos go into fa-brands.json. Each icon's search text
 * (`t`) gets the English terms PLUS German keywords (translated word-by-word via
 * the EN->DE map below), so every icon is searchable in German. Re-run after a
 * FontAwesome version bump (requires an FA Pro npm token in .npmrc, see
 * meinwaiblingen/.npmrc for the format).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const META = path.join(__dirname, '../node_modules/@fortawesome/fontawesome-pro/metadata/icon-families.json')
const OUT = path.join(__dirname, '../resources/js/data')
const CLASSIC_WEIGHTS = ['solid', 'regular', 'light', 'thin']

// English FA term -> German keyword(s). Word-by-word; one English word may map to
// several German synonyms (space separated). Focused on the frequent vocabulary.
const DE = {
    // people / body
    face: 'gesicht', person: 'person mensch', people: 'leute personen menschen', user: 'benutzer nutzer person konto',
    users: 'benutzer nutzer leute gruppe', head: 'kopf', hand: 'hand', hands: 'hände', finger: 'finger', eye: 'auge',
    eyes: 'augen', mouth: 'mund', hair: 'haare frisur', smile: 'lächeln smiley', smiling: 'lächelnd', laugh: 'lachen',
    grin: 'grinsen', kiss: 'kuss', sad: 'traurig', happy: 'glücklich fröhlich', male: 'mann männlich', female: 'frau weiblich',
    child: 'kind', baby: 'baby', man: 'mann', woman: 'frau', family: 'familie', group: 'gruppe', bust: 'person profil',
    silhouette: 'silhouette umriss', gender: 'geschlecht', skeleton: 'skelett', body: 'körper',
    // commerce / shop
    cart: 'warenkorb einkaufswagen einkauf', shopping: 'einkaufen shopping', shop: 'shop laden geschäft', store: 'laden geschäft shop',
    bag: 'tasche einkaufstüte tüte', basket: 'einkaufskorb korb warenkorb', buy: 'kaufen', purchase: 'kauf kaufen', checkout: 'kasse bezahlen',
    price: 'preis', money: 'geld', cash: 'bargeld geld', currency: 'währung geld', dollar: 'dollar', payment: 'zahlung bezahlen',
    pay: 'bezahlen zahlung', credit: 'kredit kreditkarte', card: 'karte', coin: 'münze geld', coins: 'münzen geld',
    wallet: 'geldbörse portemonnaie', receipt: 'rechnung beleg quittung', invoice: 'rechnung', tag: 'etikett tag preisschild',
    discount: 'rabatt', sale: 'angebot rabatt', gift: 'geschenk', percent: 'prozent', euro: 'euro', market: 'markt',
    grocery: 'lebensmittel einkauf', delivery: 'lieferung', shipping: 'versand lieferung', order: 'bestellung auftrag',
    package: 'paket', box: 'box kiste karton', warehouse: 'lager', inventory: 'inventar lagerbestand', barcode: 'barcode',
    // navigation / arrows
    arrow: 'pfeil', arrows: 'pfeile', up: 'oben hoch nach-oben', down: 'unten runter nach-unten', left: 'links',
    right: 'rechts', back: 'zurück', forward: 'vorwärts weiter', next: 'weiter nächste', previous: 'zurück vorherige',
    chevron: 'pfeil winkel', caret: 'pfeil dreieck', direction: 'richtung', navigation: 'navigation', move: 'bewegen verschieben',
    turn: 'drehen abbiegen', rotate: 'drehen rotieren', expand: 'erweitern vergrößern', collapse: 'einklappen zuklappen',
    enlarge: 'vergrößern', resize: 'größe-ändern', fullscreen: 'vollbild', exit: 'ausgang verlassen', sort: 'sortieren',
    align: 'ausrichten', diagonal: 'diagonal', vertical: 'vertikal', horizontal: 'horizontal', center: 'zentriert mitte',
    // ui / actions
    check: 'haken bestätigen erledigt', checkmark: 'haken häkchen', mark: 'markierung', remove: 'entfernen löschen',
    delete: 'löschen entfernen', add: 'hinzufügen', plus: 'plus hinzufügen', minus: 'minus entfernen', cancel: 'abbrechen',
    close: 'schließen', xmark: 'kreuz schließen x', edit: 'bearbeiten', pen: 'stift', pencil: 'stift bleistift',
    write: 'schreiben', writing: 'schreiben', save: 'speichern', download: 'herunterladen download', upload: 'hochladen upload',
    share: 'teilen', copy: 'kopieren', paste: 'einfügen', import: 'importieren', export: 'exportieren', filter: 'filter',
    search: 'suche suchen', magnifying: 'lupe vergrößern', settings: 'einstellungen', gear: 'zahnrad einstellungen',
    tool: 'werkzeug', tools: 'werkzeuge', wrench: 'schraubenschlüssel', hammer: 'hammer', config: 'konfiguration einstellungen',
    menu: 'menü', bars: 'menü balken', list: 'liste', grid: 'raster gitter', table: 'tabelle', dashboard: 'dashboard übersicht',
    button: 'knopf button schalter', switch: 'schalter umschalter', toggle: 'umschalter schalter', slider: 'regler schieberegler',
    select: 'auswählen auswahl', done: 'fertig erledigt', confirm: 'bestätigen', accept: 'akzeptieren annehmen',
    agree: 'zustimmen', ok: 'ok okay', okay: 'okay ok', yes: 'ja', success: 'erfolg', refresh: 'aktualisieren neu-laden',
    undo: 'rückgängig', redo: 'wiederholen', reset: 'zurücksetzen', play: 'abspielen', pause: 'pause', stop: 'stopp',
    record: 'aufnehmen aufnahme', volume: 'lautstärke', favorite: 'favorit', bookmark: 'lesezeichen', pin: 'anheften pin nadel',
    pointer: 'zeiger', point: 'punkt zeiger', dots: 'punkte', dotted: 'gepunktet', lines: 'linien', line: 'linie',
    // files / docs
    file: 'datei', files: 'dateien', document: 'dokument', folder: 'ordner', page: 'seite', paper: 'papier',
    book: 'buch', books: 'bücher', library: 'bibliothek', journal: 'tagebuch journal', note: 'notiz', notes: 'notizen',
    text: 'text', font: 'schriftart schrift', clipboard: 'zwischenablage', archive: 'archiv', trash: 'mülleimer papierkorb müll abfall löschen',
    garbage: 'mülleimer müll abfall', dumpster: 'müllcontainer mülltonne abfall', print: 'drucken drucker', printer: 'drucker', scan: 'scannen scanner', pdf: 'pdf', attachment: 'anhang',
    paperclip: 'büroklammer', newspaper: 'zeitung', calendar: 'kalender termin', date: 'datum', schedule: 'zeitplan terminplan termin',
    // communication
    message: 'nachricht', messages: 'nachrichten', chat: 'chat', comment: 'kommentar', comments: 'kommentare',
    conversation: 'unterhaltung gespräch', bubble: 'sprechblase', speech: 'sprache sprechblase', sms: 'sms nachricht',
    texting: 'texten nachricht', mail: 'mail post', email: 'email mail', envelope: 'briefumschlag umschlag brief mail kuvert', send: 'senden',
    inbox: 'posteingang', phone: 'telefon', telephone: 'telefon', call: 'anruf anrufen', mobile: 'handy mobil',
    contact: 'kontakt', address: 'adresse', notification: 'benachrichtigung', bell: 'glocke benachrichtigung', alert: 'warnung hinweis',
    feedback: 'feedback rückmeldung', support: 'support hilfe', help: 'hilfe', question: 'frage', info: 'info information',
    // media
    image: 'bild foto', images: 'bilder', photo: 'foto bild', picture: 'bild foto', camera: 'kamera', video: 'video',
    film: 'film', movie: 'film', music: 'musik', song: 'lied song', audio: 'audio ton', sound: 'ton klang',
    speaker: 'lautsprecher', microphone: 'mikrofon', voice: 'stimme', headphones: 'kopfhörer', podcast: 'podcast',
    instrument: 'instrument', album: 'album', radio: 'radio', record: 'aufnahme schallplatte',
    // tech / devices
    computer: 'computer rechner', desktop: 'desktop computer', laptop: 'laptop notebook', screen: 'bildschirm',
    display: 'anzeige bildschirm', monitor: 'monitor bildschirm', keyboard: 'tastatur', mouse: 'maus', device: 'gerät',
    phone: 'telefon handy', tablet: 'tablet', server: 'server', database: 'datenbank', data: 'daten', disk: 'festplatte disk',
    storage: 'speicher', floppy: 'diskette speichern', code: 'code programmieren', terminal: 'terminal konsole',
    network: 'netzwerk', wifi: 'wlan wifi', wireless: 'drahtlos funk', signal: 'signal empfang', bluetooth: 'bluetooth',
    nfc: 'nfc', internet: 'internet', browser: 'browser', window: 'fenster', app: 'app anwendung', system: 'system',
    plug: 'stecker', power: 'strom power', battery: 'akku batterie', electric: 'elektrisch strom', electricity: 'elektrizität strom',
    bolt: 'blitz strom', energy: 'energie', cloud: 'wolke cloud', link: 'link verknüpfung kette', qrcode: 'qr-code',
    robot: 'roboter', cpu: 'prozessor cpu', chip: 'chip',
    // security
    lock: 'vorhängeschloss schloss sperre gesperrt', unlock: 'entsperren', key: 'schlüssel', security: 'sicherheit', safety: 'sicherheit',
    shield: 'schild schutz', protect: 'schützen schutz', virus: 'virus', warning: 'warnung', danger: 'gefahr',
    error: 'fehler', emergency: 'notfall', fingerprint: 'fingerabdruck',
    // home / building / places
    home: 'startseite hauptseite zuhause haus', house: 'haus gebäude', building: 'gebäude', office: 'büro', city: 'stadt', bridge: 'brücke',
    road: 'straße', map: 'karte', location: 'standort ort', place: 'ort platz', destination: 'ziel', route: 'route',
    coordinates: 'koordinaten', gps: 'gps navigation', door: 'tür', window: 'fenster', kitchen: 'küche', bathroom: 'badezimmer bad',
    restroom: 'toilette wc', toilet: 'toilette wc', bed: 'bett', hotel: 'hotel', hospital: 'krankenhaus', school: 'schule',
    bank: 'bank', church: 'kirche', factory: 'fabrik', construction: 'baustelle bau', landscape: 'landschaft',
    // transport / travel
    car: 'auto wagen', vehicle: 'fahrzeug', automobile: 'auto', sedan: 'auto limousine', truck: 'lkw lastwagen',
    bus: 'bus', train: 'zug', plane: 'flugzeug', airplane: 'flugzeug', airport: 'flughafen', travel: 'reise reisen',
    transportation: 'transport verkehr', transport: 'transport', ship: 'schiff', boat: 'boot', bike: 'fahrrad',
    bicycle: 'fahrrad', motorcycle: 'motorrad', fly: 'fliegen flug', wheel: 'rad', odometer: 'tacho kilometerzähler',
    speedometer: 'tacho', speed: 'geschwindigkeit tempo', fast: 'schnell', parking: 'parken parkplatz', gas: 'tankstelle benzin',
    fuel: 'kraftstoff benzin', pump: 'pumpe zapfsäule',
    // nature / weather
    sun: 'sonne', moon: 'mond', cloud: 'wolke', rain: 'regen', snow: 'schnee', storm: 'sturm', weather: 'wetter',
    wind: 'wind', water: 'wasser', droplet: 'tropfen wasser', fire: 'feuer', flame: 'flamme feuer', ice: 'eis',
    cold: 'kalt', hot: 'heiß', heat: 'hitze wärme', temperature: 'temperatur', thermometer: 'thermometer', sky: 'himmel',
    air: 'luft', smoke: 'rauch', tree: 'baum', plant: 'pflanze', flower: 'blume', leaf: 'blatt', nature: 'natur',
    flora: 'pflanzen flora', fauna: 'tiere', mountain: 'berg', earth: 'erde welt', globe: 'globus welt', world: 'welt globus',
    solar: 'solar sonne', wave: 'welle', flood: 'flut hochwasser', precipitation: 'niederschlag', star: 'stern',
    // animals / food
    animal: 'tier', mammal: 'säugetier tier', dog: 'hund', cat: 'katze', bird: 'vogel', fish: 'fisch', horse: 'pferd',
    monster: 'monster', food: 'essen lebensmittel', drink: 'getränk', beverage: 'getränk', coffee: 'kaffee', mug: 'tasse becher',
    glass: 'glas', bowl: 'schüssel schale', sandwich: 'sandwich', burger: 'burger', pizza: 'pizza', bread: 'brot',
    fruit: 'obst frucht', apple: 'apfel', wheat: 'weizen', knife: 'messer', utensils: 'besteck', alcohol: 'alkohol',
    beer: 'bier', wine: 'wein', breakfast: 'frühstück', meal: 'mahlzeit essen', cake: 'kuchen torte',
    // health / medical
    medical: 'medizinisch medizin', medicine: 'medizin', health: 'gesundheit', doctor: 'arzt', hospital: 'krankenhaus',
    heart: 'herz', pulse: 'puls', pill: 'pille tablette', prescription: 'rezept', care: 'pflege', bandage: 'pflaster verband',
    tooth: 'zahn', brain: 'gehirn', virus: 'virus', infection: 'infektion', pandemic: 'pandemie',
    // objects / misc
    clock: 'uhr', time: 'zeit', timer: 'timer', hour: 'stunde', minute: 'minute', stopwatch: 'stoppuhr', alarm: 'wecker alarm',
    watch: 'uhr armbanduhr', flag: 'flagge fahne', trophy: 'pokal trophäe', award: 'auszeichnung preis', medal: 'medaille',
    crown: 'krone', diamond: 'diamant', ring: 'ring', glasses: 'brille', umbrella: 'regenschirm', lamp: 'lampe',
    lightbulb: 'glühbirne idee', idea: 'idee', light: 'licht', candle: 'kerze', key: 'schlüssel', gift: 'geschenk',
    ticket: 'ticket eintrittskarte', ball: 'ball', game: 'spiel', games: 'spiele', dice: 'würfel', chess: 'schach',
    puzzle: 'puzzle', toy: 'spielzeug', magic: 'magie zauber', rocket: 'rakete', anchor: 'anker', bell: 'glocke',
    crosshairs: 'fadenkreuz ziel', target: 'ziel zielscheibe', compass: 'kompass', umbrella: 'schirm', briefcase: 'aktentasche',
    suitcase: 'koffer', toolbox: 'werkzeugkasten', shield: 'schild', sword: 'schwert', weapon: 'waffe',
    // shapes / symbols
    circle: 'kreis', circled: 'eingekreist kreis', square: 'quadrat viereck', rectangle: 'rechteck', triangle: 'dreieck',
    shape: 'form', cross: 'kreuz', heart: 'herz', symbol: 'symbol zeichen', sign: 'zeichen schild', letter: 'buchstabe',
    number: 'zahl nummer', digit: 'ziffer', math: 'mathematik rechnen', arithmetic: 'rechnen mathematik', equals: 'gleich',
    // money/finance/biz
    chart: 'diagramm grafik', graph: 'diagramm graph', analytics: 'auswertung statistik', pie: 'tortendiagramm',
    bar: 'balken', trend: 'trend', statistics: 'statistik', business: 'geschäft business', finance: 'finanzen',
    bank: 'bank', transfer: 'überweisung transfer', exchange: 'tausch wechsel', swap: 'tauschen wechseln', balance: 'bilanz waage',
    // colors / design
    color: 'farbe', paint: 'farbe malen', brush: 'pinsel', palette: 'palette farben', design: 'design gestaltung',
    creative: 'kreativ', format: 'format', layout: 'layout', bracket: 'klammer',
    // status / flags
    new: 'neu', open: 'offen öffnen', closed: 'geschlossen', empty: 'leer', full: 'voll', low: 'niedrig', high: 'hoch',
    positive: 'positiv', negative: 'negativ', status: 'status', progress: 'fortschritt', loading: 'laden ladevorgang',
    // seasonal / events
    christmas: 'weihnachten', xmas: 'weihnachten', halloween: 'halloween', holiday: 'feiertag urlaub', party: 'party feier',
    celebration: 'feier feiern', event: 'veranstaltung event termin', birthday: 'geburtstag', wedding: 'hochzeit',
    winter: 'winter', summer: 'sommer', spring: 'frühling', fall: 'herbst', autumn: 'herbst', season: 'jahreszeit', seasonal: 'saison',
    // generic
    love: 'liebe', favorite: 'favorit liebling', like: 'gefällt mir', social: 'social sozial', share: 'teilen',
    group: 'gruppe', collection: 'sammlung', category: 'kategorie', folder: 'ordner', label: 'beschriftung etikett',
    badge: 'abzeichen', certificate: 'zertifikat urkunde', stamp: 'stempel', signature: 'unterschrift', clean: 'sauber reinigen',
    machine: 'maschine', science: 'wissenschaft', research: 'forschung', education: 'bildung', graduation: 'abschluss',
}

const j = JSON.parse(fs.readFileSync(META, 'utf8'))

function germanFor(words) {
    const out = new Set()
    for (const w of words) {
        const de = DE[w]
        if (de) de.split(' ').forEach((g) => out.add(g))
    }
    return [...out]
}

// Build one entry ({n, l, t}) per icon. `keep(weights)` decides inclusion;
// `annotate(weights)` may return a `w` list to attach (or null to omit it).
function build(keep, annotate) {
    const list = []
    for (const [name, meta] of Object.entries(j)) {
        const weights = meta.svgs && meta.svgs.classic ? Object.keys(meta.svgs.classic) : []
        if (!keep(weights)) continue
        const terms = ((meta.search && meta.search.terms) || []).filter((t) => typeof t === 'string')
        const en = (name + ' ' + (meta.label || '') + ' ' + terms.join(' ')).toLowerCase()
        const words = en.split(/[^a-z0-9]+/).filter((w) => w.length >= 2)
        const de = germanFor(words)
        const t = [...new Set([...terms.map((x) => x.toLowerCase()), ...de])].join(' ')
        const entry = { n: name, l: meta.label || name, t }
        const w = annotate ? annotate(weights) : null
        if (w) entry.w = w
        list.push(entry)
    }
    list.sort((a, b) => a.l.localeCompare(b.l))
    return list
}

fs.mkdirSync(OUT, { recursive: true })

// A `w` list is attached only when an icon does NOT ship in every classic weight;
// the runtime treats a missing `w` as "available in all classic weights".
const datasets = {
    classic: build(
        (weights) => CLASSIC_WEIGHTS.some((weight) => weights.includes(weight)),
        (weights) => {
            const available = CLASSIC_WEIGHTS.filter((weight) => weights.includes(weight))
            return available.length < CLASSIC_WEIGHTS.length ? available : null
        },
    ),
    brands: build((weights) => weights.includes('brands'), null),
}

for (const [name, list] of Object.entries(datasets)) {
    const file = path.join(OUT, `fa-${name}.json`)
    fs.writeFileSync(file, JSON.stringify(list))
    console.log(name + ':', list.length, '(' + fs.statSync(file).size + ' bytes)')
}

console.log('DE dict entries:', Object.keys(DE).length)
