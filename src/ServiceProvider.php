<?php

namespace StatamicFontAwesomeIconPicker;

use Statamic\Providers\AddonServiceProvider;

class ServiceProvider extends AddonServiceProvider
{
    protected $commands = [
        Console\Commands\MigrateIcons::class,
    ];

    protected $vite = [
        'input' => [
            'resources/js/cp.js',
        ],
        'publicDirectory' => 'resources/dist',
        'buildDirectory' => 'cp',
    ];

    protected $fieldtypes = [
        Fieldtypes\FontAwesomeIcon::class,
    ];
}
