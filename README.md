# FontAwesome Icon Picker

A searchable, virtualized FontAwesome (Pro) icon picker fieldtype for Statamic 6.

- Search in **English and German** – every icon carries baked-in German keywords.
- **Style tabs** (Solid, Regular, Light, Thin, Brands) – configurable per field.
- **Virtualized grid** – only the rows in the viewport exist in the DOM, so even
  the full 3,600+ icon set scrolls smoothly.
- Stores a **ready-to-use class string** (`fa-solid fa-rocket`) – drop it straight
  into a `class` attribute.

## Requirements

- PHP 8.2+
- Statamic 6 / Laravel 12
- A **FontAwesome Pro** npm token – required only to build the CP assets and to
  regenerate the icon data, not at runtime.

## Installation

This package is consumed as a local path repository. In the host app's
`composer.json`:

```json
"repositories": {
    "statamic-fontawesome-icon-picker": {
        "type": "path",
        "url": "../_packages/statamic-fontawesome-icon-picker"
    }
}
```

```bash
composer require klickmanufaktur/statamic-fontawesome-icon-picker
```

> **FontAwesome Pro required.** The compiled CP assets and the icon datasets are
> derived from FontAwesome Pro and are **not** shipped with this package (Pro
> assets may not be redistributed). After installing, build them once with your
> own FA Pro token — see below.

## Building the CP assets

Required once after installing (the assets and icon data are not shipped) and
again whenever you change the Vue component or styles. Provide your FA Pro token
first (see `.npmrc.example`):

```bash
cp .npmrc.example .npmrc   # then insert your FA Pro token
npm install
npm run build-icons        # generate resources/js/data (needs FA Pro metadata)
npm run build              # generate resources/dist/cp
```

The host app serves CP assets from a **published copy** in
`public/vendor/statamic-fontawesome-icon-picker`, not from the addon directly, so
after every build re-publish them (otherwise the CP keeps loading the old bundle):

```bash
php artisan vendor:publish --tag=statamic-fontawesome-icon-picker --force
```

## Regenerating the icon data

`npm run build-icons` (run above) reads the FA Pro metadata from `node_modules`
and writes the datasets to `resources/js/data`. Re-run it after a FontAwesome
version bump.

Solid/Regular/Light/Thin share the same icon set, so they are baked into a single
`fa-classic.json`; brand logos go into `fa-brands.json`. An icon only carries a
`w` (weights) list when it does **not** ship in every classic weight – the picker
treats a missing `w` as "available in all classic weights". German keywords are
generated word-by-word via the EN→DE map inside `bin/build-icons.mjs`; extend that
map to improve German search coverage.

## Migrating legacy data

Earlier versions of a site may have stored only the bare icon name (e.g. `rocket`)
and prepended the style in the template. This fieldtype stores the full class
string (`fa-regular fa-rocket`). The bundled command rewrites the old values in
place across all entries, globals and taxonomy terms:

```bash
php artisan fontawesome-icon-picker:migrate --dry-run   # preview
php artisan fontawesome-icon-picker:migrate             # apply
```

- Brand icons are detected via `fa-brands.json` and written as `fa-brands …`;
  everything else uses `--classic-style` (default `regular`).
- Values already in the new format are skipped, so the command is idempotent and
  safe to run repeatedly.
- `--handles=` overrides which field handles are scanned (default
  `icon,button_icon,page_theme_icon`); `--force` skips the confirmation prompt.

## Usage

Add the fieldtype to a blueprint or fieldset:

```yaml
fields:
  -
    handle: icon
    field:
      type: fontawesome_icon
      display: Icon
```

### Configuration

| Option          | Description                                            | Default                              |
| --------------- | ------------------------------------------------------ | ------------------------------------ |
| `styles`        | Which style tabs are offered in the picker.            | `solid`, `regular`, `light`, `brands` |
| `default_style` | Preselected style when the picker opens.               | `regular`                            |

### Templating (Antlers)

The stored value is a full class string, so render it directly:

```antlers
{{ if icon }}<i class="{{ icon }}" aria-hidden="true"></i>{{ /if }}
```

The fieldtype's `augment()` guarantees the value is always a well-formed
`fa-{style} fa-{name}` string (anything else is discarded), so `{{ icon }}` is
safe without `|raw`.
