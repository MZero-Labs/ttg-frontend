<template>
  <span class="inline-flex items-center relative font-inter">
    <div v-if="showAvatar" class="absolute flex items-center">
      <img
        v-if="ensAvatar"
        class="w-4 h-4 rounded-full"
        :src="ensAvatar"
        alt=""
      />
      <Jazzicon
        v-else
        class="flex items-center"
        :address="props?.address"
        :diameter="16"
      />
    </div>
    <div class="flex items-center gap-1" :class="{ 'ml-[22px]': showAvatar }">
      <NuxtLink class="hover:underline" :to="`/profile/${props.address}`">
        <span v-if="ensName">{{ ensName }}</span>
        <span v-else :title="props.address">{{
          shortAddress ? shortenAddress(props.address) : props.address
        }}</span>
      </NuxtLink>

      <img v-if="justCopied" class="min-w-5 h-5" src="/img/icons/check.svg" />
      <button v-else-if="showCopy" @click="copy(props.address)">
        <img class="min-w-5 h-5 hover:opacity-75" src="/img/icons/copy.svg" />
      </button>
    </div>
  </span>
</template>
<script setup lang="ts">
import { useEnsAvatar, useEnsName } from "use-wagmi";
import { Hash, Address } from "viem";
import { Jazzicon } from "vue3-jazzicon/src/components";

export interface MAddressAvatar {
  address: Hash | undefined;
  shortAddress?: boolean;
  showAvatar?: boolean;
  showCopy?: boolean;
}

const props = withDefaults(defineProps<MAddressAvatar>(), {
  address: undefined,
  shortAddress: true,
  showAvatar: true,
  showCopy: false,
});

const justCopied = ref(false);

function copy(address: Address) {
  copyToClipboard(address);
  justCopied.value = true;
  setTimeout(() => {
    justCopied.value = false;
  }, 2000);
}

const { data: ensName } = useEnsName({
  address: props.address,
});

const { data: ensAvatar } = useEnsAvatar({
  name: ensName,
});
</script>
