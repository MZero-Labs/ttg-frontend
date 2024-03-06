import { storeToRefs } from "pinia";
import { Hash } from "viem";
import { useReadContract } from "use-wagmi";
import { powerTokenAbi } from "@/lib/sdk";
import { useSpogStore } from "@/stores/spog";

export default (
  userAccount:
    | globalThis.Ref<undefined>
    | globalThis.Ref<`0x${string}`>
    | globalThis.Ref<`0x${string}` | undefined>
) => {
  // keep the reactive from the prop alive
  const account = ref(userAccount);

  const store = useSpogStore();
  const spog = storeToRefs(store);

  return useReadContract({
    address: spog.contracts.value.powerToken as Hash,
    abi: powerTokenAbi,
    functionName: "delegates",
    args: [account as Ref<Hash>],
    query: {
      select: (data) => {
        console.log("delegates", data);
        return String(data);
      },
    },
  });
};
