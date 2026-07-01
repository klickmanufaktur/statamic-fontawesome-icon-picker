<?php

namespace StatamicFontAwesomeIconPicker\Fieldtypes;

use Statamic\Fields\Fieldtype;

class FontAwesomeIcon extends Fieldtype
{
    protected static $handle = 'fontawesome_icon';

    protected $categories = ['media'];

    protected $icon = 'fieldtype-icon_picker';

    /**
     * @var array<string, string>
     */
    private const STYLES = [
        'solid' => 'Solid',
        'regular' => 'Regular',
        'light' => 'Light',
        'thin' => 'Thin',
        'brands' => 'Brands (Logos)',
    ];

    protected function configFieldItems(): array
    {
        return [
            [
                'display' => 'Styles',
                'fields' => [
                    'styles' => [
                        'display' => 'Verfügbare Styles',
                        'instructions' => 'Welche FontAwesome-Styles im Picker als Tabs zur Auswahl stehen.',
                        'type' => 'checkboxes',
                        'options' => self::STYLES,
                        'default' => ['solid', 'regular', 'light', 'brands'],
                    ],
                    'default_style' => [
                        'display' => 'Standard-Style',
                        'instructions' => 'Vorausgewählter Style beim Öffnen des Pickers.',
                        'type' => 'select',
                        'options' => self::STYLES,
                        'default' => 'regular',
                        'width' => 50,
                    ],
                ],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function preload(): array
    {
        return [
            'styles' => $this->enabledStyles(),
            'defaultStyle' => $this->defaultStyle(),
        ];
    }

    /**
     * Guarantee templates only ever receive a well-formed FontAwesome class
     * string ("fa-solid fa-rocket"). Anything else (hand-edited YAML, a stray
     * import) is discarded rather than rendered, since templates drop this value
     * straight into a class attribute, sometimes via |raw.
     */
    public function augment($value): ?string
    {
        if (! is_string($value) || ! preg_match('/^fa-([a-z]+)\s+fa-([a-z0-9-]+)$/', trim($value), $matches)) {
            return null;
        }

        return "fa-{$matches[1]} fa-{$matches[2]}";
    }

    /**
     * @return list<string>
     */
    private function enabledStyles(): array
    {
        $styles = collect($this->config('styles', ['solid', 'regular', 'light', 'brands']))
            ->filter(fn (string $style): bool => array_key_exists($style, self::STYLES))
            ->values()
            ->all();

        return $styles === [] ? ['regular'] : $styles;
    }

    private function defaultStyle(): string
    {
        $style = $this->config('default_style', 'regular');
        $enabled = $this->enabledStyles();

        return in_array($style, $enabled, true) ? $style : $enabled[0];
    }
}
