<template>
  <div class="flex items-center justify-between">
    <div class="flex items-center">
      <div :class="`p-3 rounded-md ${color}`">
        <component :is="iconComponent" class="h-6 w-6 text-white" />
      </div>
      <div class="ml-4">
        <h3 class="text-sm font-medium text-gray-900">{{ title }}</h3>
        <p class="text-2xl font-semibold text-gray-900">{{ value }}</p>
      </div>
    </div>
    <div v-if="change !== undefined" :class="`text-sm font-medium ${changeColor}`">
      {{ change > 0 ? '+' : '' }}{{ change }}%
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  BuildingOffice2Icon, 
  UsersIcon, 
  PhoneIcon, 
  CurrencyEuroIcon,
  ClockIcon,
  DocumentTextIcon,
  ShoppingCartIcon
} from '@heroicons/vue/24/outline'

const props = defineProps<{
  title: string;
  value: string | number;
  icon: string;
  color: string;
  change?: number;
}>();

// Déterminer l'icône à afficher
const iconComponent = computed(() => {
  switch (props.icon) {
    case 'BuildingOffice2Icon':
      return BuildingOffice2Icon;
    case 'UsersIcon':
      return UsersIcon;
    case 'PhoneIcon':
      return PhoneIcon;
    case 'CurrencyEuroIcon':
      return CurrencyEuroIcon;
    case 'ClockIcon':
      return ClockIcon;
    case 'DocumentTextIcon':
      return DocumentTextIcon;
    case 'ShoppingCartIcon':
      return ShoppingCartIcon;
    default:
      return BuildingOffice2Icon;
  }
});

// Déterminer la couleur du changement
const changeColor = computed(() => {
  if (props.change === undefined) return '';
  return props.change > 0 ? 'text-green-600' : 'text-red-600';
});
</script>
