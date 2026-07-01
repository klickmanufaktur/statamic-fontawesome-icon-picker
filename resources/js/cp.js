import './cp.css';
import FontAwesomeIconPicker from './components/FontAwesomeIconPicker.vue';

Statamic.booting(() => {
    Statamic.$components.register('fontawesome_icon-fieldtype', FontAwesomeIconPicker);
});
