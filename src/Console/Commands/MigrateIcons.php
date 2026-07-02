<?php

namespace StatamicFontAwesomeIconPicker\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Statamic\Facades\Entry;
use Statamic\Facades\GlobalSet;
use Statamic\Facades\Term;

class MigrateIcons extends Command
{
    protected $signature = 'fontawesome-icon-picker:migrate
        {--dry-run : Report the changes without writing anything}
        {--force : Skip the confirmation prompt}
        {--handles=icon,button_icon,page_theme_icon : Comma-separated field handles to migrate}
        {--classic-style=regular : FontAwesome style to use for non-brand icons}';

    protected $description = 'Migrate legacy bare icon names (e.g. "rocket") to full FontAwesome class strings (e.g. "fa-regular fa-rocket").';

    /** @var array<string, true> */
    private array $brands = [];

    /** @var list<string> */
    private array $handles = [];

    private string $classicStyle = 'regular';

    private int $scanned = 0;

    private int $changedItems = 0;

    private int $convertedValues = 0;

    /** @var array<string, string> */
    private array $examples = [];

    public function handle(): int
    {
        $this->handles = collect(explode(',', (string) $this->option('handles')))
            ->map(fn (string $handle): string => trim($handle))
            ->filter()
            ->values()
            ->all();

        if ($this->handles === []) {
            $this->error('No field handles given.');

            return self::FAILURE;
        }

        $this->classicStyle = trim((string) $this->option('classic-style')) ?: 'regular';
        $this->brands = $this->loadBrandNames();

        $dryRun = (bool) $this->option('dry-run');

        if (! $dryRun && ! $this->option('force') && ! $this->confirm('Rewrite legacy icon values across all entries, globals and terms?')) {
            $this->comment('Aborted.');

            return self::SUCCESS;
        }

        $this->line($dryRun ? '<comment>Dry run — no data will be written.</comment>' : '<info>Migrating icon data…</info>');

        $this->migrate(Entry::all(), $dryRun);
        GlobalSet::all()->each(fn ($set) => $this->migrate($set->localizations(), $dryRun));
        $this->migrate(Term::all(), $dryRun);

        $this->report($dryRun);

        return self::SUCCESS;
    }

    private function migrate(Collection $items, bool $dryRun): void
    {
        $items->each(fn ($item) => $this->process($item, $dryRun));
    }

    private function process(object $item, bool $dryRun): void
    {
        $this->scanned++;

        $data = $item->data();
        $data = $data instanceof Collection ? $data->all() : (array) $data;

        $changed = 0;
        $new = $this->transform($data, $changed);

        if ($changed === 0) {
            return;
        }

        $this->changedItems++;
        $this->convertedValues += $changed;

        if (! $dryRun) {
            $item->data($new)->save();
        }
    }

    /**
     * @param  array<array-key, mixed>  $data
     * @return array<array-key, mixed>
     */
    private function transform(array $data, int &$changed): array
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->transform($value, $changed);

                continue;
            }

            if (! is_string($value) || ! in_array($key, $this->handles, true)) {
                continue;
            }

            $converted = $this->convert($value);

            if ($converted === $value) {
                continue;
            }

            if (count($this->examples) < 50) {
                $this->examples[$value] = $converted;
            }

            $data[$key] = $converted;
            $changed++;
        }

        return $data;
    }

    private function convert(string $value): string
    {
        $name = trim($value);

        if ($name === '') {
            return $value;
        }

        // Repair a brand that an earlier run mis-classified as a non-brand weight
        // (e.g. "fa-regular fa-github" -> "fa-brands fa-github").
        if (preg_match('/^fa-(?:solid|regular|light|thin) fa-([a-z0-9-]+)$/', $name, $matches) && isset($this->brands[$matches[1]])) {
            return "fa-brands fa-{$matches[1]}";
        }

        // Already migrated or not a plain FontAwesome slug — leave as-is.
        if (str_starts_with($name, 'fa-') || ! preg_match('/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/', $name)) {
            return $value;
        }

        $style = isset($this->brands[$name]) ? 'brands' : $this->classicStyle;

        return "fa-{$style} fa-{$name}";
    }

    /**
     * @return array<string, true>
     */
    private function loadBrandNames(): array
    {
        $names = [];

        // Primary: the brand slug list shipped with the package. This works on a
        // source-only Packagist install, where the JS datasets are not present.
        $embedded = __DIR__.'/../../brand-icons.php';

        if (is_file($embedded)) {
            foreach (require $embedded as $name) {
                $names[$name] = true;
            }
        }

        // Optional: merge the richer JS dataset when it exists (local builds).
        foreach ([
            base_path('vendor/klickmanufaktur/statamic-fontawesome-icon-picker/resources/js/data/fa-brands.json'),
            __DIR__.'/../../../resources/js/data/fa-brands.json',
        ] as $path) {
            if (! is_file($path)) {
                continue;
            }

            foreach (json_decode((string) file_get_contents($path), true) ?: [] as $icon) {
                if (isset($icon['n'])) {
                    $names[$icon['n']] = true;
                }
            }

            break;
        }

        if ($names === []) {
            $this->warn("Could not load the brand icon list — brand icons will be migrated as \"{$this->classicStyle}\". Verify brand icons (e.g. social links) afterwards.");
        }

        return $names;
    }

    private function report(bool $dryRun): void
    {
        $this->newLine();
        $this->line("Scanned:   {$this->scanned} localizations");
        $this->line("Changed:   {$this->changedItems} ".($dryRun ? '(would change)' : 'saved'));
        $this->line("Converted: {$this->convertedValues} icon value(s)");

        if ($this->examples !== []) {
            $this->newLine();
            $this->line('Examples:');

            foreach (array_slice($this->examples, 0, 15, true) as $from => $to) {
                $this->line("  <fg=red>{$from}</> → <fg=green>{$to}</>");
            }
        }

        if ($this->convertedValues === 0) {
            $this->newLine();
            $this->info('Nothing to migrate — all icon values are already in the new format.');
        } elseif ($dryRun) {
            $this->newLine();
            $this->comment('Re-run without --dry-run to apply these changes.');
        }
    }
}
