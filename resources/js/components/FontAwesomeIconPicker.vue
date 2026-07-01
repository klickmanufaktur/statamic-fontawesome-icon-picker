<script setup>
import { Fieldtype } from '@statamic/cms';
import { Button, ButtonGroup, Input, Stack, StackContent, StackFooter } from '@statamic/cms/ui';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

// Searchable, style-switchable, virtualized FontAwesome icon picker. Value is
// stored as a ready-to-use class string ("fa-solid fa-rocket"), so templates can
// drop it straight into a class attribute. Icon datasets are loaded lazily on
// first open (the classic weights share one JSON chunk, brands another); their
// search text carries English + German keywords (baked in by bin/build-icons.mjs).
// The grid is virtualized: only the rows inside the viewport ever exist in the DOM.

const emit = defineEmits(Fieldtype.emits);
const props = defineProps(Fieldtype.props);
const { expose, isReadOnly, update } = Fieldtype.use(emit, props);
defineExpose(expose);

const CELL_MIN = 72; // px — min tile width; column count is derived from the panel width
const MIN_COLS = 3; // never collapse below this
const MAX_COLS = 10; // cap so tiles don't sprawl in a full-width stack
const ROW_H = 68; // px — must match grid-auto-rows in cp.css
const BUFFER = 2; // extra rows rendered above/below the viewport

const dataModules = import.meta.glob('../data/fa-*.json');
const loadedDatasets = {};

// Solid/Regular/Light/Thin all live in the shared "classic" dataset; a style is
// derived by filtering on each icon's `w` list (absent = all classic weights).
const CLASSIC_STYLES = ['solid', 'regular', 'light', 'thin'];

function datasetFor(target) {
    return CLASSIC_STYLES.includes(target) ? 'classic' : target;
}

async function loadDataset(name) {
    if (!loadedDatasets[name]) {
        const importer = dataModules[`../data/fa-${name}.json`];
        loadedDatasets[name] = importer ? (await importer()).default : [];
    }

    return loadedDatasets[name];
}

const enabledStyles = computed(() => {
    const styles = props.meta?.styles;
    return Array.isArray(styles) && styles.length ? styles : ['regular'];
});

function parseValue(value) {
    const match = typeof value === 'string' ? /^fa-([a-z-]+)\s+fa-(.+)$/.exec(value.trim()) : null;

    return match ? { style: match[1], name: match[2] } : { style: null, name: '' };
}

// Never start on a style that isn't offered — fall back to the configured
// default, then to the first enabled style.
function pickInitialStyle() {
    const enabled = enabledStyles.value;
    const parsed = parseValue(props.value).style;

    if (parsed && enabled.includes(parsed)) {
        return parsed;
    }

    if (props.meta?.defaultStyle && enabled.includes(props.meta.defaultStyle)) {
        return props.meta.defaultStyle;
    }

    return enabled[0];
}

const stackOpen = ref(false);
const style = ref(pickInitialStyle());
const searchQuery = ref('');
const loadedStyle = ref(null);
const icons = ref([]);
const loading = ref(false);
const scrollEl = ref(null);
const cols = ref(MIN_COLS);
const scrollTop = ref(0);

let resizeObserver = null;

const currentName = computed(() => parseValue(props.value).name);
const normalizedQuery = computed(() => searchQuery.value.trim().toLowerCase());

const filtered = computed(() => {
    if (!normalizedQuery.value) {
        return icons.value;
    }

    const q = normalizedQuery.value;

    return icons.value.filter((icon) => icon.n.includes(q) || icon.l.toLowerCase().includes(q) || icon.t.includes(q));
});

const rows = computed(() => Math.ceil(filtered.value.length / cols.value));

const visible = computed(() => {
    const list = filtered.value;
    const viewportHeight = scrollEl.value?.clientHeight || 0;
    const visibleRows = Math.ceil(viewportHeight / ROW_H) || 1;
    const startRow = Math.max(0, Math.floor(scrollTop.value / ROW_H) - BUFFER);
    const endRow = startRow + visibleRows + BUFFER * 2;
    const start = startRow * cols.value;
    const end = Math.min(list.length, endRow * cols.value);

    return { offset: startRow * ROW_H, items: list.slice(start, end) };
});

watch(
    () => props.value,
    (value) => {
        const next = parseValue(value).style;

        if (next) {
            style.value = next;
        }
    },
);

// A shrinking result set can leave the viewport scrolled past the last row,
// showing a blank grid until the next scroll — snap back to the top instead.
watch(normalizedQuery, resetScroll);

async function loadStyle(target) {
    if (loadedStyle.value === target) {
        return;
    }

    loading.value = true;

    const name = datasetFor(target);
    const dataset = await loadDataset(name);

    icons.value = name === 'classic'
        ? dataset.filter((icon) => !icon.w || icon.w.includes(target))
        : dataset;

    loadedStyle.value = target;
    loading.value = false;
}

// The grid is virtualized, so CSS auto-fit can't be used: measure the available
// width and derive the exact column count, keeping the scroller/slice in sync.
function measureCols() {
    const el = scrollEl.value;

    if (!el) {
        return;
    }

    const next = Math.max(MIN_COLS, Math.min(MAX_COLS, Math.floor(el.clientWidth / CELL_MIN)));

    if (next !== cols.value) {
        cols.value = next;
    }
}

function onScroll() {
    scrollTop.value = scrollEl.value?.scrollTop || 0;
}

function resetScroll() {
    scrollTop.value = 0;

    if (scrollEl.value) {
        scrollEl.value.scrollTop = 0;
    }
}

async function openStack() {
    if (isReadOnly.value) {
        return;
    }

    stackOpen.value = true;
    searchQuery.value = '';

    await loadStyle(style.value);
    await nextTick();

    measureCols();
    resetScroll();

    if (scrollEl.value && !resizeObserver) {
        resizeObserver = new ResizeObserver(() => measureCols());
        resizeObserver.observe(scrollEl.value);
    }
}

function closeStack() {
    stackOpen.value = false;
}

async function setStyle(target) {
    style.value = target;

    await loadStyle(target);

    // Carry the current icon over to the new weight, but only when that weight
    // actually has it — brands and the classic styles don't share icon names,
    // so blindly re-committing would produce a broken class like
    // "fa-brands fa-rocket".
    if (currentName.value && icons.value.some((icon) => icon.n === currentName.value)) {
        commit(currentName.value);
    }

    resetScroll();
}

function select(name) {
    commit(name);
    closeStack();
}

function commit(name) {
    update(name ? `fa-${style.value} fa-${name}` : null);
}

function clear(event) {
    event?.stopPropagation();
    update(null);
}

onBeforeUnmount(() => {
    resizeObserver?.disconnect();
});
</script>

<template>
    <div class="fontawesome-icon-picker-fieldtype">
        <ButtonGroup :gap="false" class="fontawesome-icon-picker-fieldtype__field">
            <Button
                variant="default"
                class="fontawesome-icon-picker-fieldtype__trigger"
                :disabled="isReadOnly"
                @click="openStack"
            >
                <span class="fontawesome-icon-picker-fieldtype__trigger-inner">
                    <span class="fontawesome-icon-picker-fieldtype__glyph">
                        <i v-if="value" :class="value" />
                        <i v-else class="fa-regular fa-icons" />
                    </span>
                    <span class="fontawesome-icon-picker-fieldtype__name">{{ currentName || 'Icon wählen' }}</span>
                </span>
            </Button>
            <Button
                v-if="value && !isReadOnly"
                variant="default"
                icon-only
                class="fontawesome-icon-picker-fieldtype__clear"
                aria-label="Icon entfernen"
                @click="clear"
            >
                <i class="fa-regular fa-xmark" />
            </Button>
        </ButtonGroup>

        <Stack v-model:open="stackOpen" title="Icon auswählen" icon="fieldtype-icon_picker" size="half">
            <StackContent>
                <div class="fontawesome-icon-picker-fieldtype__panel">
                    <div class="fontawesome-icon-picker-fieldtype__header">
                        <Input
                            v-model="searchQuery"
                            icon-prepend="magnifying-glass"
                            placeholder="Icon suchen …"
                            clearable
                            focus
                        />
                        <div class="fontawesome-icon-picker-fieldtype__styles">
                            <button
                                v-for="s in enabledStyles"
                                :key="s"
                                type="button"
                                class="fontawesome-icon-picker-fieldtype__style"
                                :class="{ 'is-active': s === style }"
                                @click="setStyle(s)"
                            >
                                <i :class="`fa-${s} fa-${s === 'brands' ? 'font-awesome' : 'star'}`" />
                                <span>{{ s }}</span>
                            </button>
                        </div>
                    </div>

                    <div ref="scrollEl" class="fontawesome-icon-picker-fieldtype__scroll" @scroll="onScroll">
                        <div class="fontawesome-icon-picker-fieldtype__sizer" :style="{ height: rows * ROW_H + 'px' }">
                            <div
                                class="fontawesome-icon-picker-fieldtype__viewport"
                                :style="{ transform: `translateY(${visible.offset}px)`, gridTemplateColumns: `repeat(${cols}, 1fr)` }"
                            >
                                <button
                                    v-for="icon in visible.items"
                                    :key="icon.n"
                                    type="button"
                                    class="fontawesome-icon-picker-fieldtype__cell"
                                    :class="{ 'is-active': icon.n === currentName }"
                                    :title="icon.l"
                                    @click="select(icon.n)"
                                >
                                    <i :class="`fa-${style} fa-${icon.n}`" />
                                    <span class="fontawesome-icon-picker-fieldtype__cell-name">{{ icon.n }}</span>
                                </button>
                            </div>
                        </div>

                        <div v-if="!loading && filtered.length === 0" class="fontawesome-icon-picker-fieldtype__empty">
                            Keine Icons gefunden
                        </div>
                    </div>
                </div>
            </StackContent>

            <StackFooter>
                <template #start>{{ filtered.length }} Icons</template>
                <template #end>
                    <Button v-if="value" variant="ghost" text="Entfernen" @click="clear" />
                    <Button variant="primary" text="Fertig" @click="closeStack" />
                </template>
            </StackFooter>
        </Stack>
    </div>
</template>
