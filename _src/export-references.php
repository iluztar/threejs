<?php
/**
 * Export the Sirpeltric board's reference images (board 2, local iluztar_db + hostinger/board/_media/2)
 * into one folder per background:   <bg folder>/references/<frame>/NN_caption.ext  +  <bg folder>/references.md
 * Shared folders: 00-brief (Brief + Anime era timeline).
 * Run: php _src/export-references.php      (re-runnable: rewrites the references folders only)
 */
$root  = dirname(__DIR__);
$media = 'D:/xampp/htdocs/iluztar/hostinger/board/_media/2';
$db    = new PDO('mysql:host=localhost;dbname=iluztar_db;charset=utf8mb4', 'root', '');

$map = [   // board folder prefix → output folder
    '00 · Brief' => '00-brief', '00 · Anime era timeline' => '00-brief',
    '01' => 'bg1-world-reveal', '02' => 'bg2-earth-zoom-globe', '03' => 'bg3-underwater',
    '04' => 'bg4-mirrored', '05' => 'bg5-hobby', '06' => 'bg6-forward-pathway',
];
$slug = function (string $t, int $max = 70): string {
    $t = preg_replace('/\s*·\s*(©|Public domain|CC).*$/u', '', $t);          // drop the credit tail from file names
    $t = str_replace(['°', '&', '—', '–'], ['', 'and', '-', '-'], $t);
    $t = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $t);
    $t = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', $t), '-'));
    if (strlen($t) > $max) { $t = substr($t, 0, $max); $cut = strrpos($t, '-'); if ($cut > $max * 0.5) $t = substr($t, 0, $cut); }   // cut at a word boundary
    return $t ?: 'untitled';
};
$rmrf = function ($d) use (&$rmrf) { if (!is_dir($d)) return; foreach (scandir($d) as $f) if ($f !== '.' && $f !== '..') { $p = "$d/$f"; is_dir($p) ? $rmrf($p) : unlink($p); } rmdir($d); };

$rows = [];
foreach ($db->query("SELECT id, jenis, data FROM board_items WHERE board_id = 2 AND dihapus = 0") as $r) { $d = json_decode($r['data'], true) ?: []; $d['_id'] = $r['id']; $d['_j'] = $r['jenis']; $rows[] = $d; }
$files = []; foreach ($db->query("SELECT id, berkas FROM board_media WHERE board_id = 2") as $m) $files[$m['id']] = $m['berkas'];
$folders = array_filter($rows, fn($d) => $d['_j'] === 'folder');
usort($folders, fn($a, $b) => ($a['urut'] ?? 0) <=> ($b['urut'] ?? 0));

$out = [];   // folder → ['frames' => [frameSlug => [items]], 'links' => [], 'notes' => []]
foreach ($folders as $fd) {
    $dest = null; foreach ($map as $pre => $to) if (str_starts_with($fd['nama'], $pre)) { $dest = $to; break; }
    if (!$dest) continue;
    $items = array_values(array_filter($rows, fn($d) => ($d['folder'] ?? '') === $fd['_id']));
    usort($items, fn($a, $b) => [$a['y'] ?? 0, $a['x'] ?? 0] <=> [$b['y'] ?? 0, $b['x'] ?? 0]);
    $frames = array_values(array_filter($items, fn($d) => $d['_j'] === 'bingkai'));
    $frameOf = function ($d) use ($frames) {                 // the board frame an item sits in (by its top-left point)
        $best = null; foreach ($frames as $f) { $x = $d['x'] ?? 0; $y = $d['y'] ?? 0;
            if ($x >= ($f['x'] ?? 0) - 4 && $y >= ($f['y'] ?? 0) - 4 && $x <= ($f['x'] ?? 0) + ($f['w'] ?? 0) && $y <= ($f['y'] ?? 0) + ($f['h'] ?? 0)) $best = $f; }
        return $best ? $best['label'] : 'other';
    };
    $section = $fd['nama'];
    foreach ($items as $d) {
        if (in_array($d['_j'], ['gambar', 'video'], true)) $out[$dest]['frames'][$section . ' › ' . $frameOf($d)][] = $d;
        elseif ($d['_j'] === 'tautan') $out[$dest]['links'][$section . ' › ' . $frameOf($d)][] = $d;
        elseif (in_array($d['_j'], ['catatan', 'teks'], true) && mb_strlen($d['teks'] ?? '') > 40) $out[$dest]['notes'][] = $d['teks'];
        elseif ($d['_j'] === 'palet') $out[$dest]['palettes'][$section . ' › ' . $frameOf($d)][] = implode(' ', $d['warna'] ?? []);
    }
}

$total = 0;
foreach ($out as $dest => $o) {
    $dir = "$root/$dest"; if (!is_dir($dir)) mkdir($dir, 0777, true);
    $rmrf("$dir/references");
    $md = "# References · $dest\n\nExported from the Sirpeltric board (board 2, local copy). Images are grouped by the board frame they sit in, in board order.\n"
        . "Credits/sources are kept below. Copyrighted stills are for internal / client reference only.\n";
    $fi = 0;
    foreach ($o['frames'] ?? [] as $frame => $items) {
        $fi++; $fslug = sprintf('%02d-', $fi) . $slug(preg_replace('/^.*?›\s*/u', '', $frame), 48);
        if (count(array_unique(array_map(fn($k) => explode(' › ', $k)[0], array_keys($o['frames'])))) > 1) $fslug = sprintf('%02d-', $fi) . $slug(str_replace(' › ', ' ', $frame), 60);
        $fdir = "$dir/references/$fslug"; mkdir($fdir, 0777, true);
        $md .= "\n## " . str_replace(' › ', ' — ', $frame) . "\n`references/$fslug/`\n\n";
        foreach ($items as $n => $d) {
            $id = $d['_j'] === 'video' ? $d['media'] : $d['media'] ?? ''; $src = $files[$id] ?? null;
            if (!$src || !is_file("$media/$src")) { $md .= "- (missing file for " . ($d['judul'] ?? $id) . ")\n"; continue; }
            $ext = pathinfo($src, PATHINFO_EXTENSION);
            $title = $d['judul'] ?? ($d['_j'] === 'video' ? 'video' : 'from the team (Discord, 2 Oct)');
            $name = sprintf('%02d_%s.%s', $n + 1, $slug($title), $ext);
            copy("$media/$src", "$fdir/$name"); $total++;
            $md .= "- **$name** — " . $title . (!empty($d['sumber']) ? " · <" . $d['sumber'] . ">" : '') . "\n";
            if ($d['_j'] === 'video' && !empty($d['poster']) && !empty($files[$d['poster']])) { $pn = sprintf('%02d_%s-poster.%s', $n + 1, $slug($title), pathinfo($files[$d['poster']], PATHINFO_EXTENSION)); copy("$media/" . $files[$d['poster']], "$fdir/$pn"); $total++; $md .= "- **$pn** — poster frame of the video above\n"; }
        }
    }
    if (!empty($o['palettes'])) { $md .= "\n## Palettes on the board\n"; foreach ($o['palettes'] as $k => $ps) foreach ($ps as $p) $md .= "- " . str_replace(' › ', ' — ', $k) . ": `$p`\n"; }
    if (!empty($o['links'])) { $md .= "\n## Links on the board\n"; foreach ($o['links'] as $k => $ls) { $md .= "\n**" . str_replace(' › ', ' — ', $k) . "**\n"; foreach ($ls as $l) $md .= "- [" . ($l['judul'] ?? $l['url']) . "](" . $l['url'] . ")" . (isset($l['mulai']) ? " (watch " . gmdate('i:s', $l['mulai']) . "–" . gmdate('i:s', $l['akhir'] ?? $l['mulai']) . ")" : '') . "\n"; } }
    if (!empty($o['notes'])) { $md .= "\n## Notes on the board\n"; foreach ($o['notes'] as $t) $md .= "\n> " . str_replace("\n", "\n> ", trim($t)) . "\n"; }
    file_put_contents("$dir/references.md", $md);
    echo str_pad($dest, 24) . " " . count(glob("$dir/references/*/*")) . " files\n";
}
echo "total $total files\n";
