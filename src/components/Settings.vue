<template>
  <div class="settings">
    <h1>Settings</h1>
    <div class="theme-selection">
      <label for="theme">Select SideNav Theme:</label>
      <select id="theme" v-model="selectedTheme" @change="changeTheme">
        <option value="default">Default</option>
        <option value="dark">Dark</option>
        <option value="yellow">Yellow</option>
        <option value="blue">Blue</option>
        <option value="real-fire">Real Fire</option>
        <option value="real-smoke">Real Smoke</option>
      </select>
    </div>
    <div class="effect-selection">
      <label for="effect">Select NavLink Active Effect:</label>
      <select id="effect" v-model="selectedEffect" @change="changeEffect">
        <option value="none">None</option>
        <option value="fire">Fire</option>
        <option value="smoke">Smoke</option>
      </select>
    </div>
    <div class="click-effect-selection">
      <label for="click-effect">Select Click Effect:</label>
      <select id="click-effect" v-model="clickEffectType" @change="changeClickEffect">
        <option value="none">None</option>
        <option value="fire">Fire</option>
        <option value="line">Line</option>
      </select>
    </div>
  </div>
</template>

<script>
import { ref, inject } from 'vue';

export default {
  name: 'Settings',
  setup() {
    const selectedTheme = ref('default');
    const selectedEffect = ref('none');
    const clickEffectType = ref('none');
    const setClickEffectType = inject('setClickEffectType');

    const changeTheme = () => {
      document.documentElement.setAttribute('data-theme', selectedTheme.value);
    };

    const changeEffect = () => {
      document.documentElement.setAttribute('data-effect', selectedEffect.value);
    };

    const changeClickEffect = () => {
      setClickEffectType(clickEffectType.value);
    };

    return {
      selectedTheme,
      selectedEffect,
      clickEffectType,
      changeTheme,
      changeEffect,
      changeClickEffect,
    };
  }
};
</script>

<style scoped>
.settings {
  padding: 20px;
}

.theme-selection,
.effect-selection,
.click-effect-selection {
  margin-top: 20px;
}

.theme-selection label,
.effect-selection label,
.click-effect-selection label {
  margin-right: 10px;
}
</style>