<?php
/** test-only build for the shape sheet (not one of the six BGs):  php _src/build-sheet.php → shape-sheet/shape-sheet.html */
$src = __DIR__; $out = dirname(__DIR__) . '/shape-sheet';
$tpl = file_get_contents("$src/template.html");
$mascots = file_get_contents("$src/mascots.html");
$core = preg_replace('/^export function startApp/m', 'function startApp', file_get_contents("$src/core.js"));
$bg = preg_replace('/^import .*?;\s*$/m', '', file_get_contents("$src/sheet.js"));
$html = str_replace(['{{TITLE}}', '{{NAV}}', '{{MASCOTS}}', '{{CODE}}'], ['Shape sheet · test', '[]', $mascots, $core . "\n\n/* ═══════════ shape sheet ═══════════ */\n" . $bg], $tpl);
if (!is_dir($out)) mkdir($out, 0777, true);
file_put_contents("$out/shape-sheet.html", $html);
echo 'built shape-sheet/shape-sheet.html (' . round(strlen($html) / 1024) . " KB)\n";
